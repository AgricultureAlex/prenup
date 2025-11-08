// Tutor Learning App JavaScript

// Global state management
const appState = {
    currentSection: 'vision-board',
    currentQuestion: 1,
    totalQuestions: 5,
    userProgress: {
        streak: 7,
        completedChallenges: 247,
        badges: 12,
        hoursLearned: 45
    },
    goals: {
        programming: [
            { id: 'react', text: 'Master React', progress: 35 },
            { id: 'python', text: 'Learn Python Data Science', progress: 60 }
        ],
        language: [
            { id: 'french', text: 'French B2 Level', progress: 45 }
        ],
        project: [
            { id: 'social-app', text: 'Social Outing Planner App', progress: 20 }
        ]
    },
    questions: [
        {
            type: 'Debugging Challenge',
            content: `Find the bug in this React component:`,
            code: `function UserProfile({ user }) {
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchUserData(user.id)
            .then(data => {
                setUser(data);
                setLoading(false);
            });
    });
    
    if (loading) return <div>Loading...</div>;
    
    return (
        <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
        </div>
    );
}`,
            question: "What's wrong with this code?",
            options: [
                "Missing dependency array in useEffect",
                "setUser is not defined",
                "Both A and B"
            ],
            correctAnswer: 2,
            explanation: "Both issues are present: the useEffect lacks a dependency array causing infinite re-renders, and setUser is not defined in the component state."
        },
        {
            type: 'Vocabulary Challenge',
            content: 'Python Package Management',
            question: 'Which command installs a package with pip and adds it to requirements.txt?',
            options: [
                "pip install package_name",
                "pip install package_name --save",
                "pip freeze > requirements.txt (after install)",
                "pip install -r requirements.txt"
            ],
            correctAnswer: 2,
            explanation: "While pip install installs packages, you need to manually add them to requirements.txt or use pip freeze > requirements.txt to update it."
        },
        {
            type: 'Code Completion',
            content: 'Complete this JavaScript function:',
            code: `function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        // Complete this function
    };
}`,
            question: 'What should go in the function body?',
            options: [
                "clearTimeout(timeoutId); timeoutId = setTimeout(() => func.apply(this, args), delay);",
                "setTimeout(() => func.apply(this, args), delay);",
                "if (!timeoutId) timeoutId = setTimeout(() => func.apply(this, args), delay);"
            ],
            correctAnswer: 0,
            explanation: "Debounce should clear the previous timeout and set a new one each time the function is called."
        },
        {
            type: 'French Vocabulary',
            content: 'Language Learning',
            question: 'What does "développeur" mean in English?',
            options: [
                "Designer",
                "Developer", 
                "Manager",
                "Engineer"
            ],
            correctAnswer: 1,
            explanation: "Développeur is French for developer/programmer."
        },
        {
            type: 'Algorithm Analysis',
            content: 'Data Structures',
            question: 'What is the time complexity of searching in a balanced binary search tree?',
            options: [
                "O(n)",
                "O(log n)",
                "O(n log n)",
                "O(1)"
            ],
            correctAnswer: 1,
            explanation: "In a balanced BST, search operations take O(log n) time as you eliminate half the remaining nodes at each step."
        }
    ],
    chatMessages: [
        {
            sender: 'tutor',
            content: "Hi! I'm your AI learning companion. I can help you understand complex concepts, create personalized study plans, and guide you through your coding projects. What would you like to work on today?",
            timestamp: new Date().toLocaleTimeString()
        }
    ],
    smsEnabled: false
};

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// App initialization
function initializeApp() {
    console.log('Tutor app initialized');
    showSection('vision-board');
    renderGoals();
    renderProgress();
    renderChatMessages();
    
    // Add event listeners
    setupEventListeners();
    
    // Initialize progress bars with animation
    setTimeout(animateProgressBars, 500);
}

// Event listeners setup
function setupEventListeners() {
    // Chat input enter key
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Navigation clicks
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('href').substring(1);
            showSection(targetSection);
        });
    });
}

// Section navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('fade-in');
    }
    
    appState.currentSection = sectionId;
    
    // Special handling for different sections
    switch(sectionId) {
        case 'learn':
            loadCurrentQuestion();
            break;
        case 'progress':
            renderProgress();
            setTimeout(animateProgressBars, 100);
            break;
        case 'tutor-chat':
            scrollChatToBottom();
            break;
    }
}

// Vision Board Functions
function renderGoals() {
    Object.keys(appState.goals).forEach(category => {
        const container = document.getElementById(`${category}-goals`);
        if (!container) return;
        
        container.innerHTML = '';
        
        appState.goals[category].forEach(goal => {
            const goalElement = createGoalElement(goal, category);
            container.appendChild(goalElement);
        });
    });
}

function createGoalElement(goal, category) {
    const goalDiv = document.createElement('div');
    goalDiv.className = 'goal-item fade-in';
    goalDiv.setAttribute('data-goal', goal.id);
    
    const colorMap = {
        programming: 'success',
        language: 'info', 
        project: 'warning'
    };
    
    goalDiv.innerHTML = `
        <span class="goal-text">${goal.text}</span>
        <div class="progress mt-2">
            <div class="progress-bar bg-${colorMap[category]}" 
                 style="width: ${goal.progress}%" 
                 data-progress="${goal.progress}">
            </div>
        </div>
    `;
    
    return goalDiv;
}

function addGoal(category) {
    const goalText = prompt(`Enter your new ${category} goal:`);
    if (goalText) {
        const newGoal = {
            id: Date.now().toString(),
            text: goalText,
            progress: 0
        };
        
        appState.goals[category].push(newGoal);
        renderGoals();
        
        // Show success message
        showNotification(`New ${category} goal added: ${goalText}`, 'success');
    }
}

// Learning Section Functions
function loadCurrentQuestion() {
    const question = appState.questions[appState.currentQuestion - 1];
    if (!question) return;
    
    document.getElementById('question-type').textContent = question.type;
    document.getElementById('current-question').textContent = appState.currentQuestion;
    document.getElementById('total-questions').textContent = appState.totalQuestions;
    
    const questionContent = document.getElementById('question-content');
    questionContent.innerHTML = createQuestionHTML(question);
    
    // Update progress bar
    const progressPercent = (appState.currentQuestion / appState.totalQuestions) * 100;
    document.querySelector('#learn .progress-bar').style.width = `${progressPercent}%`;
}

function createQuestionHTML(question) {
    let html = `<h5>${question.content}</h5>`;
    
    if (question.code) {
        html += `<pre><code class="language-javascript">${escapeHtml(question.code)}</code></pre>`;
    }
    
    html += `<div class="mt-4">
        <h6>${question.question}</h6>`;
    
    question.options.forEach((option, index) => {
        html += `
        <div class="form-check">
            <input class="form-check-input" type="radio" name="question-answer" id="answer${index}" value="${index}">
            <label class="form-check-label" for="answer${index}">
                ${option}
            </label>
        </div>`;
    });
    
    html += `</div>`;
    return html;
}

function checkAnswer() {
    const selectedAnswer = document.querySelector('input[name="question-answer"]:checked');
    if (!selectedAnswer) {
        showNotification('Please select an answer', 'warning');
        return;
    }
    
    const question = appState.questions[appState.currentQuestion - 1];
    const answerValue = parseInt(selectedAnswer.value);
    const isCorrect = answerValue === question.correctAnswer;
    
    if (isCorrect) {
        showNotification('Correct! Well done!', 'success');
        // Update progress
        updateLearningProgress();
    } else {
        showNotification(`Incorrect. ${question.explanation}`, 'error');
    }
    
    // Disable all options
    document.querySelectorAll('input[name="question-answer"]').forEach(input => {
        input.disabled = true;
    });
    
    // Highlight correct answer
    highlightCorrectAnswer(question.correctAnswer);
}

function highlightCorrectAnswer(correctIndex) {
    const correctOption = document.getElementById(`answer${correctIndex}`).parentElement;
    correctOption.style.backgroundColor = '#d4edda';
    correctOption.style.borderColor = '#c3e6cb';
}

function nextQuestion() {
    if (appState.currentQuestion < appState.totalQuestions) {
        appState.currentQuestion++;
        loadCurrentQuestion();
    } else {
        // Session complete
        showNotification('Session complete! Great job!', 'success');
        showSection('progress');
    }
}

function previousQuestion() {
    if (appState.currentQuestion > 1) {
        appState.currentQuestion--;
        loadCurrentQuestion();
    }
}

function updateLearningProgress() {
    appState.userProgress.completedChallenges++;
    
    // Update random goal progress
    const categories = Object.keys(appState.goals);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const goals = appState.goals[randomCategory];
    
    if (goals.length > 0) {
        const randomGoal = goals[Math.floor(Math.random() * goals.length)];
        randomGoal.progress = Math.min(100, randomGoal.progress + Math.floor(Math.random() * 5) + 1);
    }
}

// Chat Functions
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage('user', message);
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        const response = generateTutorResponse(message);
        addChatMessage('tutor', response);
    }, 1000);
}

function addChatMessage(sender, content) {
    const message = {
        sender,
        content,
        timestamp: new Date().toLocaleTimeString()
    };
    
    appState.chatMessages.push(message);
    renderChatMessages();
    scrollChatToBottom();
}

function renderChatMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    container.innerHTML = '';
    
    appState.chatMessages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}-message fade-in`;
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <strong>${message.sender === 'tutor' ? 'Tutor' : 'You'}:</strong> ${message.content}
            </div>
            <div class="message-time">${message.timestamp}</div>
        `;
        
        container.appendChild(messageDiv);
    });
}

function generateTutorResponse(userMessage) {
    const responses = {
        'debug': "I'd be happy to help you debug! Can you share the code you're working with and describe what's not working as expected?",
        'react': "React is a powerful library! Let's start with components. What specifically about React would you like to learn?",
        'python': "Python is great for data science and web development! What's your current experience level?",
        'project': "Building projects is the best way to learn! What kind of project are you thinking about?",
        'help': "I can help with coding concepts, project planning, debugging, and creating study plans. What would you like to work on?",
        'default': "That's a great question! I'm here to help you learn. Can you tell me more about what you're trying to understand or build?"
    };
    
    const message = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
        if (message.includes(key)) {
            return response;
        }
    }
    
    return responses.default;
}

function scrollChatToBottom() {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function quickAction(action) {
    const actions = {
        'explain-concept': "I'd love to explain a concept! What topic would you like me to break down for you?",
        'study-plan': "Let's create a personalized study plan! What skills are you trying to develop?",
        'debug-help': "I'm here to help debug! Share your code and I'll help you identify issues.",
        'project-guidance': "Project-based learning is fantastic! What kind of project interests you?"
    };
    
    const message = actions[action] || "How can I help you today?";
    addChatMessage('tutor', message);
}

// Progress Functions
function renderProgress() {
    // Update stats
    const stats = appState.userProgress;
    document.querySelectorAll('.stat-card h4').forEach((element, index) => {
        const values = [stats.completedChallenges, stats.streak, stats.badges, stats.hoursLearned];
        if (element && values[index] !== undefined) {
            element.textContent = values[index];
        }
    });
}

function animateProgressBars() {
    document.querySelectorAll('.progress-bar').forEach(bar => {
        const progress = bar.getAttribute('data-progress') || bar.style.width;
        const progressValue = parseInt(progress);
        
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = `${progressValue}%`;
        }, 100);
    });
}

// SMS Integration Functions
function enableSMS() {
    const phoneInput = document.querySelector('#sms-panel input[type="tel"]');
    const phoneNumber = phoneInput?.value.trim();
    
    if (!phoneNumber) {
        showNotification('Please enter a valid phone number', 'warning');
        return;
    }
    
    // Simulate SMS integration with advanced-imessage-kit
    appState.smsEnabled = true;
    showNotification('SMS notifications enabled! You\'ll receive daily learning challenges.', 'success');
    
    // Hide SMS panel after enabling
    setTimeout(() => {
        const smsPanel = document.getElementById('sms-panel');
        if (smsPanel) {
            smsPanel.style.display = 'none';
        }
    }, 2000);
    
    // Simulate sending first SMS
    setTimeout(() => {
        simulateIncomingSMS();
    }, 3000);
}

function simulateIncomingSMS() {
    const smsContent = "🧠 Daily Challenge: What's the difference between `let` and `const` in JavaScript? Reply with your answer!";
    showNotification(`SMS Received: ${smsContent}`, 'info');
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Game Features
function updateStreak() {
    appState.userProgress.streak++;
    renderProgress();
    
    if (appState.userProgress.streak % 7 === 0) {
        showNotification(`🔥 Amazing! ${appState.userProgress.streak} day streak!`, 'success');
    }
}

function awardBadge(badgeName) {
    appState.userProgress.badges++;
    showNotification(`🏆 Badge Earned: ${badgeName}`, 'success');
    renderProgress();
}

// Export functions for global access
window.showSection = showSection;
window.addGoal = addGoal;
window.checkAnswer = checkAnswer;
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.sendMessage = sendMessage;
window.quickAction = quickAction;
window.enableSMS = enableSMS;

// Initialize SMS integration simulation
function initializeSMSIntegration() {
    console.log('Initializing SMS integration with advanced-imessage-kit...');
    // This would integrate with the actual iMessage kit
    // For prototype purposes, we'll simulate the functionality
    
    // Simulate daily SMS scheduling
    setInterval(() => {
        if (appState.smsEnabled) {
            const dailyChallenges = [
                "What's the time complexity of bubble sort?",
                "Translate: 'Hello, how are you?' to French",
                "What does 'git rebase' do?",
                "Name three CSS flexbox properties",
                "What's the difference between == and === in JavaScript?"
            ];
            
            const challenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
            console.log('Daily SMS sent:', challenge);
        }
    }, 24 * 60 * 60 * 1000); // 24 hours
}

// Start SMS integration
initializeSMSIntegration();