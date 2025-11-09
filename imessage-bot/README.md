# AI Tutor iMessage Bot

Chat with your AI programming tutor directly through iMessage! This bot integrates with the existing AI Tutor backend API to provide seamless access to programming help, GitHub repository analysis, and technical support via iMessage.

## Features

- 💬 **Natural Conversations**: Chat with AI Tutor through iMessage
- 📚 **Programming Help**: Get answers to coding questions and concepts
- 🔗 **GitHub Analysis**: Send repository URLs for automated analysis
- 📊 **Code Review**: Share code snippets for explanation and improvement
- 🧮 **Math Support**: Understands LaTeX mathematical notation
- 💾 **Conversation History**: Maintains context across messages (per user)
- 🎯 **Commands**: Special commands for managing conversations

## Prerequisites

- **macOS**: iMessage Kit requires macOS to access iMessage
- **Node.js**: Version 18 or higher
- **AI Tutor API**: Running backend API (default: http://localhost:8000)

## Installation

1. Navigate to the imessage-bot directory:
```bash
cd imessage-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```
API_BASE=http://localhost:8000
```

## Usage

### Running the Bot

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

### Commands

Send these commands via iMessage to interact with the bot:

- `/help` - Show help message with available features
- `/clear` - Clear your conversation history and start fresh

### Example Conversations

**General Programming Help**:
```
You: What is a closure in JavaScript?
AI Tutor: A closure is a function that has access to variables from its outer scope...
```

**GitHub Repository Analysis**:
```
You: https://github.com/facebook/react
AI Tutor: 📊 **REPOSITORY ANALYSIS: https://github.com/facebook/react**

**Summary:** React is a JavaScript library for building user interfaces...
[Full analysis with tech stack, components, recommendations]
```

**Code Review**:
```
You: Can you explain this code?
```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
  ...
```
AI Tutor: This is an implementation of the quicksort algorithm...
```

**Mathematics**:
```
You: Explain $E = mc^2$
AI Tutor: Einstein's mass-energy equivalence formula states...
```

## How It Works

1. **Message Reception**: iMessage Kit receives your messages
2. **API Call**: Bot forwards your message to the AI Tutor API
3. **Context Management**: Maintains conversation history (last 10 exchanges)
4. **Response**: AI's reply is sent back via iMessage

## Architecture

```
┌─────────────┐
│   iMessage  │
└──────┬──────┘
       │
       v
┌─────────────────────┐
│ iMessage Kit Bot    │
│ - Message Handler   │
│ - History Manager   │
│ - Command Processor │
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│ AI Tutor API        │
│ (FastAPI Backend)   │
└─────────────────────┘
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE` | Backend API URL | `http://localhost:8000` |

### Conversation  History

- Stores last 10 message exchanges per user
- Automatically managed in memory
- Cleared with `/clear` command
- Separate history for each user

## Troubleshooting

### Bot not responding
1. Ensure backend API is running: `curl http://localhost:8000/chat`
2. Check console logs for errors
3. Verify .env configuration

### TypeScript errors during development
```bash
npm install
```

### iMessage not receiving messages
1. Check macOS permissions for Messages app
2. Ensure you're sending to the correct phone number/email
3. Restart the bot

## Development

### Project Structure
```
imessage-bot/
├── index.ts          # Main bot implementation
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── .env.example      # Environment template
└── README.md         # This file
```

### Adding New Features

To add new commands:
```typescript
bot.onCommand('mycommand', async (message, context) => {
  await context.send('Response to my command');
});
```

To modify message handling:
```typescript
bot.onMessage(async (message, context) => {
  // Custom logic here
});
```

## Security Notes

- Conversation history is stored in memory (not persisted to disk)
- Each user's history is isolated
- API calls use standard HTTP (consider HTTPS for production)
- No sensitive data is logged

## License

Part of the AI Tutor project. See main project LICENSE.

## Support

For issues or questions:
1. Check this README
2. Review console logs
3. Verify backend API is running
4. Check iMessage Kit documentation