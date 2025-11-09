import { IMessageSDK } from '@photon-ai/imessage-kit';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

// API configuration
const API_BASE = process.env.API_BASE || 'http://localhost:8000';

// Conversation history storage (per user)
const conversationHistory = new Map<string, Array<{ role: string; content: string }>>();

// Model preference storage (per user) - defaults to OpenAI
const userModelPreference = new Map<string, string>();

// Track if user has received welcome message
const welcomedUsers = new Set<string>();

// Track if user is in challenge mode
const userChallengeMode = new Map<string, boolean>();

// Helper function to detect model switching requests
function detectModelSwitch(message: string): string | null {
  const lowerMessage = message.toLowerCase().trim();
  
  // OpenAI patterns
  if (lowerMessage.includes('use openai') ||
      lowerMessage.includes('switch to openai') ||
      lowerMessage.includes('change to openai') ||
      lowerMessage === 'openai') {
    return 'openai';
  }
  
  // Gemini patterns
  if (lowerMessage.includes('use gemini') ||
      lowerMessage.includes('switch to gemini') ||
      lowerMessage.includes('change to gemini') ||
      lowerMessage === 'gemini') {
    return 'gemini';
  }
  
  return null;
}

// Helper function to convert markdown to plain text for iMessage
function convertMarkdownToPlainText(markdown: string): string {
  let text = markdown;
  
  // Convert headers to uppercase with newlines
  text = text.replace(/^### (.+)$/gm, '\n$1\n');
  text = text.replace(/^## (.+)$/gm, '\n$1\n');
  text = text.replace(/^# (.+)$/gm, '\n$1\n');
  
  // Convert bold (**text** or __text__)
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');
  
  // Convert italic (*text* or _text_)
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/_(.+?)_/g, '$1');
  
  // Convert code blocks (```code```)
  text = text.replace(/```[\w]*\n([\s\S]+?)```/g, '\n--- CODE ---\n$1\n--- END CODE ---\n');
  
  // Convert inline code (`code`)
  text = text.replace(/`(.+?)`/g, '"$1"');
  
  // Convert links ([text](url))
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');
  
  // Convert bullet lists (- item or * item)
  text = text.replace(/^[\*\-] (.+)$/gm, '• $1');
  
  // Convert numbered lists (1. item)
  text = text.replace(/^\d+\. (.+)$/gm, '• $1');
  
  // Clean up multiple newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

// Helper function to call the backend API
async function callTutorAPI(message: string, userId: string): Promise<string> {
  try {
    // Check for help command
    const lowerMessage = message.toLowerCase().trim();
    if (lowerMessage === 'help' || lowerMessage === 'info' || lowerMessage === 'commands') {
      const currentModel = userModelPreference.get(userId) || 'openai';
      const inChallengeMode = userChallengeMode.get(userId) || false;
      return `ℹ️ AI Tutor Help\n\n🤖 Current Model: ${currentModel === 'openai' ? 'GPT-4o' : 'Gemini (Latest)'}\n📍 Current Mode: ${inChallengeMode ? 'Challenge' : 'Tutor'}\n\nSwitch AI Models:\n• "use OpenAI"\n• "use Gemini"\n\nSwitch Modes:\n• "challenge mode" - Get bite-sized coding challenges\n• "tutor mode" - Ask questions and get help\n• "next challenge" - Get a new challenge (in challenge mode)\n\nChallenge Types:\n🐛 Debug exercises\n📊 Data structures\n🎯 Guess the output\n💬 Explain concepts\n🎲 20 questions\n💭 Friendly check-ins\n\nTips:\n• Paste GitHub URLs for instant analysis\n• Say "help" anytime\n• Challenges are bite-sized for mobile!`;
    }
    
    // Check for mode switching
    if (lowerMessage.includes('challenge mode') || lowerMessage === 'challenge' || lowerMessage === 'start challenge') {
      userChallengeMode.set(userId, true);
      return `🎯 Challenge Mode Activated!\n\nI'll send you bite-sized coding challenges perfect for quick mobile practice.\n\nSay "next challenge" for a new one, or just answer the current challenge!\n\nSwitch back anytime with "tutor mode".\n\nReady? Here's your first challenge! 👇`;
    }
    
    if (lowerMessage.includes('tutor mode') || lowerMessage === 'tutor' || lowerMessage === 'exit challenge') {
      userChallengeMode.set(userId, false);
      return `📚 Tutor Mode Activated!\n\nI'm here to help with any coding questions you have.\n\nSwitch back to challenges anytime with "challenge mode"!`;
    }
    
    // Check if user wants to switch models (check BEFORE welcome message)
    const modelSwitch = detectModelSwitch(message);
    if (modelSwitch) {
      userModelPreference.set(userId, modelSwitch);
      welcomedUsers.add(userId); // Mark as welcomed to avoid duplicate welcome
      return `✅ Switched to ${modelSwitch === 'openai' ? 'GPT-4o' : 'Gemini (Latest)'} model!\n\nYou can switch between models anytime by saying "use OpenAI" or "use Gemini".\n\nSay "help" for more commands.`;
    }
    
    // Send welcome message to new users
    if (!welcomedUsers.has(userId)) {
      welcomedUsers.add(userId);
      const currentModel = userModelPreference.get(userId) || 'openai';
      return `👋 Welcome to AI Tutor!\n\nI'm currently using the ${currentModel === 'openai' ? 'GPT-4o' : 'Gemini (Latest)'} model.\n\n💡 Quick Tips:\n• Switch models: "use OpenAI" or "use Gemini"\n• Analyze GitHub repos: Just paste the URL\n• Try challenges: "challenge mode"\n• Get help: Say "help"\n\n📚 I'm in Tutor Mode - ask me anything!`;
    }
    
    // Check if user wants a new challenge
    const inChallengeMode = userChallengeMode.get(userId) || false;
    if ((inChallengeMode && (lowerMessage === 'next' || lowerMessage === 'next challenge' || lowerMessage === 'new challenge')) ||
        lowerMessage === 'challenge me' || lowerMessage === 'send challenge') {
      
      const selectedModel = userModelPreference.get(userId) || 'openai';
      
      try {
        const response = await fetch(`${API_BASE}/mini-challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: selectedModel }),
        });
        
        if (!response.ok) {
          throw new Error(`Mini challenge API responded with status ${response.status}`);
        }
        
        const data = await response.json() as { challenge_type: string; prompt: string; hint?: string };
        let challengeMessage = data.prompt;
        
        if (data.hint) {
          challengeMessage += `\n\n${data.hint}`;
        }
        
        return challengeMessage;
        
      } catch (error) {
        console.error('Error fetching mini challenge:', error);
        return "💪 Quick Challenge!\n\nWhat's the time complexity of binary search?\n\nA) O(n)\nB) O(log n)\nC) O(n²)\nD) O(1)\n\nTake your best guess!";
      }
    }
    
    // Get or initialize conversation history for this user
    const history = conversationHistory.get(userId) || [];
    
    // Get user's model preference (default to OpenAI)
    const selectedModel = userModelPreference.get(userId) || 'openai';
    
    // Call the FastAPI backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let response;
    try {
      response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          history: history,
          model: selectedModel,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds');
      }
      throw fetchError;
    }

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json() as { reply: string };
    
    // Update conversation history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: data.reply });
    
    // Keep only last 10 exchanges (20 messages) to avoid context getting too large
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    
    conversationHistory.set(userId, history);
    
    // Convert markdown to plain text for iMessage
    const plainTextReply = convertMarkdownToPlainText(data.reply);
    return plainTextReply;
  } catch (error: any) {
    console.error('Error calling Tutor API:', error);
    
    // Provide more specific error messages
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      return "⚠️ **Connection Error**\n\nI can't connect to the AI Tutor service. Please make sure:\n\n1. The backend server is running\n2. Run: `cd ui/GitHub-Summarizer-QuestionGenerator && python -m uvicorn api:app --reload`\n3. The server should be at http://localhost:8000";
    }
    
    if (error.message?.includes('timed out')) {
      return "⏱️ **Request Timeout**\n\nThe AI is taking too long to respond. This might be due to:\n• High server load\n• Complex query processing\n\nPlease try a simpler question or wait a moment and try again.";
    }
    
    return "Sorry, I'm having trouble connecting to the AI Tutor service. Please try again later.\n\nError: " + (error.message || 'Unknown error');
  }
}

// Initialize the iMessage SDK
console.log('🔧 Initializing iMessage SDK...');
const sdk = new IMessageSDK({
  debug: true,
    watcher: {
        pollInterval: 3000,        // Check interval (default: 2000ms)
        unreadOnly: false,         // Watch all messages (default: false)
        excludeOwnMessages: true   // Exclude own messages (default: true)
    }
});
console.log('✅ SDK initialized successfully');

console.log('🚀 AI Tutor iMessage bot is running!');
console.log(`📡 Connected to API: ${API_BASE}`);
console.log('💬 Starting message watcher...');

// Start watching for new messages
// Start watching
await sdk.startWatching({
    onNewMessage: async (message) => {
        console.log(`📨 New message from ${message.chatId}: ${message.text}`);
        
        // Skip if message text is null or empty
        if (!message.text || message.text.trim() === '') {
            console.log('⚠️ Skipping empty message');
            return;
        }
        
        // Get current model for this user
        const currentModel = userModelPreference.get(message.chatId) || 'openai';
        console.log(`🤖 Using ${currentModel} model`);
        
        // Call the AI Tutor API
        const reply = await callTutorAPI(message.text, message.chatId);
        
        // Send the reply back to the user
        await sdk.message(message)
            .replyText(reply)
            .execute();
        
        console.log(`✅ Replied to ${message.chatId}`);
    },
    
    onGroupMessage: async (message) => {
        console.log('📱 Group message received:', message.chatId);
        // For now, we'll skip group messages to avoid spamming
        // You can enable this later if needed
    },
    
    onError: (error) => {
        console.error('❌ Error:', error);
    }
})

console.log('✅ Message watcher started successfully!');
console.log('📱 Ready to receive messages...');

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  sdk.stopWatching();
  await sdk.close();
  process.exit(0);
});