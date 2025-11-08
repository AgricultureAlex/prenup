const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

// SMS functionality removed for prototype simplicity

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// SMS client placeholder for prototype
const mockSMSClient = {
    sendMessage: async (data) => {
        console.log(`[SMS SIMULATION] To: ${data.recipient}`);
        console.log(`[SMS SIMULATION] Message: ${data.message}`);
        return { success: true, messageId: 'mock_' + Date.now() };
    }
};

// In-memory storage for prototype (replace with database in production)
let users = new Map();
let learningData = new Map();

// Learning content database
const learningContent = {
    programming: [
        {
            question: "What's the difference between const, let, and var in JavaScript?",
            answer: "const: immutable binding, let: block-scoped, var: function-scoped",
            type: "concept",
            difficulty: "beginner"
        },
        {
            question: "Spot the bug: for(let i=0; i<array.length; i++) { setTimeout(() => console.log(i), 100); }",
            answer: "All outputs will be array.length. Fix: use closure or forEach",
            type: "debugging",
            difficulty: "intermediate"
        },
        {
            question: "What does this React hook do? useEffect(() => { fetchData(); }, [])",
            answer: "Runs fetchData once on component mount (empty dependency array)",
            type: "framework",
            difficulty: "intermediate"
        }
    ],
    languages: [
        {
            question: "French: How do you say 'I am learning programming'?",
            answer: "J'apprends la programmation",
            type: "vocabulary",
            difficulty: "beginner"
        },
        {
            question: "Spanish: Translate 'The developer is debugging the code'",
            answer: "El desarrollador está depurando el código",
            type: "sentence",
            difficulty: "intermediate"
        }
    ],
    algorithms: [
        {
            question: "What's the time complexity of binary search?",
            answer: "O(log n) - eliminates half the search space each iteration",
            type: "analysis",
            difficulty: "intermediate"
        },
        {
            question: "Quick sort vs merge sort: which is stable?",
            answer: "Merge sort is stable, quick sort is not stable",
            type: "comparison",
            difficulty: "advanced"
        }
    ]
};

// Routes

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API to register user for SMS learning
app.post('/api/register-sms', async (req, res) => {
    try {
        const { phoneNumber, preferences } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Store user preferences
        const userId = generateUserId();
        users.set(userId, {
            phoneNumber,
            preferences: preferences || ['programming'],
            streak: 0,
            lastActive: new Date(),
            totalQuestions: 0,
            correctAnswers: 0
        });

        // Log welcome message (SMS disabled for prototype)
        console.log(`Welcome message would be sent to: ${phoneNumber}`);

        res.json({ 
            success: true, 
            message: 'SMS learning enabled successfully!',
            userId 
        });
    } catch (error) {
        console.error('Error registering SMS:', error);
        res.status(500).json({ error: 'Failed to register SMS' });
    }
});

// API to send daily learning challenge
app.post('/api/send-challenge', async (req, res) => {
    try {
        const { userId, category } = req.body;
        const user = users.get(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const challenge = getRandomChallenge(category || 'programming');
        await sendLearningChallenge(user.phoneNumber, challenge);

        res.json({ success: true, challenge });
    } catch (error) {
        console.error('Error sending challenge:', error);
        res.status(500).json({ error: 'Failed to send challenge' });
    }
});

// API to handle SMS responses
app.post('/api/handle-response', async (req, res) => {
    try {
        const { phoneNumber, message, questionId } = req.body;
        
        const user = findUserByPhone(phoneNumber);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const result = await processUserResponse(user, message, questionId);
        
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error handling response:', error);
        res.status(500).json({ error: 'Failed to handle response' });
    }
});

// API to get user progress
app.get('/api/progress/:userId', (req, res) => {
    try {
        const user = users.get(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const progress = calculateUserProgress(user);
        res.json({ success: true, progress });
    } catch (error) {
        console.error('Error getting progress:', error);
        res.status(500).json({ error: 'Failed to get progress' });
    }
});

// SMS Integration Functions

async function sendWelcomeMessage(phoneNumber) {
    const message = `🎓 Welcome to Tutor! 

Your AI learning companion is ready to help you master programming, languages, and more through daily challenges.

You'll receive:
• Daily vocab/coding challenges
• Personalized study tips
• Progress tracking
• Streak rewards

Reply HELP for commands or STOP to unsubscribe.

Ready for your first challenge? 🚀`;

    await sendSMS(phoneNumber, message);
}

async function sendLearningChallenge(phoneNumber, challenge) {
    const message = `🧠 Daily Challenge #${Math.floor(Math.random() * 100) + 1}

${challenge.question}

Think about it and reply with your answer! 
Difficulty: ${challenge.difficulty}
Category: ${challenge.type}

💡 Take your time - learning happens one step at a time!`;

    await sendSMS(phoneNumber, message);
}

async function sendSMS(phoneNumber, message) {
    // SMS simulation for prototype
    console.log(`[SMS SIMULATION] To: ${phoneNumber}`);
    console.log(`[SMS SIMULATION] Message: ${message.substring(0, 50)}...`);
    
    return mockSMSClient.sendMessage({
        recipient: phoneNumber,
        message: message
    });
}

async function processUserResponse(user, message, questionId) {
    const cleanMessage = message.trim().toLowerCase();
    
    // Handle special commands
    if (cleanMessage === 'help') {
        await sendHelpMessage(user.phoneNumber);
        return { type: 'help' };
    }
    
    if (cleanMessage === 'stop') {
        await unsubscribeUser(user);
        return { type: 'unsubscribe' };
    }
    
    if (cleanMessage === 'stats') {
        await sendStatsMessage(user);
        return { type: 'stats' };
    }

    // Process learning response
    const currentChallenge = learningData.get(questionId);
    if (currentChallenge) {
        const isCorrect = evaluateAnswer(cleanMessage, currentChallenge.answer);
        
        // Update user stats
        user.totalQuestions++;
        if (isCorrect) {
            user.correctAnswers++;
            user.streak++;
        } else {
            user.streak = Math.max(0, user.streak - 1);
        }
        user.lastActive = new Date();
        
        // Send feedback
        await sendFeedback(user.phoneNumber, isCorrect, currentChallenge);
        
        return { 
            type: 'answer', 
            correct: isCorrect, 
            streak: user.streak,
            accuracy: (user.correctAnswers / user.totalQuestions * 100).toFixed(1)
        };
    }
    
    // General response
    await sendGeneralResponse(user.phoneNumber, cleanMessage);
    return { type: 'general' };
}

function evaluateAnswer(userAnswer, correctAnswer) {
    // Simple string matching (could be enhanced with NLP)
    const user = userAnswer.toLowerCase().trim();
    const correct = correctAnswer.toLowerCase().trim();
    
    // Check for key terms
    const keyTerms = correct.split(/[,\s]+/).filter(term => term.length > 2);
    const userTerms = user.split(/[,\s]+/);
    
    const matches = keyTerms.filter(term => 
        userTerms.some(userTerm => 
            userTerm.includes(term) || term.includes(userTerm)
        )
    );
    
    return matches.length >= Math.ceil(keyTerms.length * 0.5);
}

async function sendFeedback(phoneNumber, isCorrect, challenge) {
    let message;
    
    if (isCorrect) {
        message = `🎉 Correct! Great job!

${challenge.answer}

Keep up the excellent work! Your next challenge arrives tomorrow. 🚀`;
    } else {
        message = `🤔 Not quite right, but great effort!

The answer is: ${challenge.answer}

Don't worry - every mistake is a learning opportunity! Try again tomorrow. 💪`;
    }
    
    await sendSMS(phoneNumber, message);
}

// Helper Functions

function getRandomChallenge(category) {
    const challenges = learningContent[category] || learningContent.programming;
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    // Store challenge for response processing
    const challengeId = generateChallengeId();
    learningData.set(challengeId, randomChallenge);
    
    return { ...randomChallenge, id: challengeId };
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateChallengeId() {
    return 'challenge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function findUserByPhone(phoneNumber) {
    for (const [userId, user] of users.entries()) {
        if (user.phoneNumber === phoneNumber) {
            return { id: userId, ...user };
        }
    }
    return null;
}

function calculateUserProgress(user) {
    return {
        streak: user.streak,
        totalQuestions: user.totalQuestions,
        correctAnswers: user.correctAnswers,
        accuracy: user.totalQuestions > 0 ? (user.correctAnswers / user.totalQuestions * 100).toFixed(1) : 0,
        lastActive: user.lastActive,
        level: Math.floor(user.totalQuestions / 10) + 1,
        nextLevelProgress: (user.totalQuestions % 10) * 10
    };
}

async function sendHelpMessage(phoneNumber) {
    const helpMessage = `📚 Tutor Commands:

HELP - Show this message
STOP - Unsubscribe from challenges  
STATS - View your learning stats
HINT - Get a hint for current challenge
EASY/HARD - Adjust difficulty level

You can also just answer the daily challenges or ask questions about programming, languages, or algorithms!

Happy learning! 🎓`;
    
    await sendSMS(phoneNumber, helpMessage);
}

async function sendStatsMessage(user) {
    const progress = calculateUserProgress(user);
    
    const statsMessage = `📊 Your Learning Stats:

🔥 Current Streak: ${progress.streak} days
📝 Questions Answered: ${progress.totalQuestions}
✅ Correct Answers: ${progress.correctAnswers}
🎯 Accuracy: ${progress.accuracy}%
🏆 Current Level: ${progress.level}

Keep learning daily to maintain your streak! 💪`;
    
    await sendSMS(user.phoneNumber, statsMessage);
}

async function unsubscribeUser(user) {
    // Remove user from active list
    for (const [userId, userData] of users.entries()) {
        if (userData.phoneNumber === user.phoneNumber) {
            users.delete(userId);
            break;
        }
    }
    
    const goodbyeMessage = `👋 You've been successfully unsubscribed from Tutor challenges.

Thanks for learning with us! You answered ${user.totalQuestions} questions with ${user.correctAnswers} correct.

You can re-subscribe anytime at tutor.tech

Keep coding! 🚀`;
    
    await sendSMS(user.phoneNumber, goodbyeMessage);
}

// Scheduled Tasks

// Send daily challenges at 9 AM
cron.schedule('0 9 * * *', async () => {
    console.log('Sending daily challenges...');
    
    for (const [userId, user] of users.entries()) {
        try {
            const categories = user.preferences || ['programming'];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const challenge = getRandomChallenge(category);
            
            await sendLearningChallenge(user.phoneNumber, challenge);
            console.log(`Daily challenge sent to ${user.phoneNumber}`);
        } catch (error) {
            console.error(`Failed to send challenge to user ${userId}:`, error);
        }
    }
});

// Weekly progress summary on Sundays at 6 PM
cron.schedule('0 18 * * 0', async () => {
    console.log('Sending weekly progress summaries...');
    
    for (const [userId, user] of users.entries()) {
        try {
            await sendStatsMessage(user);
            console.log(`Weekly summary sent to ${user.phoneNumber}`);
        } catch (error) {
            console.error(`Failed to send summary to user ${userId}:`, error);
        }
    }
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Tutor server running on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log('SMS integration: Simulation mode (SMS functionality disabled)');
});

module.exports = app;