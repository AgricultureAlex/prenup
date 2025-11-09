import { IMessageSDK } from '@photon-ai/imessage-kit';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

// API configuration
const API_BASE = process.env.API_BASE || 'http://localhost:8000';

// Conversation history storage (per user)
const conversationHistory = new Map<string, Array<{ role: string; content: string }>>();

// Helper function to call the backend API
async function callTutorAPI(message: string, userId: string): Promise<string> {
  try {
    // Get or initialize conversation history for this user
    const history = conversationHistory.get(userId) || [];
    
    // Call the FastAPI backend
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        history: history,
      }),
    });

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
    
    return data.reply;
  } catch (error) {
    console.error('Error calling Tutor API:', error);
    return "Sorry, I'm having trouble connecting to the AI Tutor service. Please try again later.";
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
        await sdk.message(message)
            .replyText(message.text + " was your message")
            .execute()
    },
    
    onGroupMessage: async (message) => {
        console.log('Group:', message.chatId)
    },
    
    onError: (error) => {
        console.error('Error:', error)
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