# Tutor - AI-Powered Learning Companion

**Transform AI-assisted coding into a guided, confidence-building learning journey**

## 🎯 Overview

Tutor is an AI-powered learning app that helps developers truly understand code instead of just generating it. By turning project goals into sequences of small, adaptive challenges—debugging, explaining, and building each piece by hand—it transforms AI-assisted coding into a guided learning experience.

### Key Features

- 🧠 **Vision Board Learning**: Track goals across programming, languages, and projects
- 📱 **SMS Integration**: Daily challenges via advanced-imessage-kit  
- 🎮 **Gamified Learning**: Streaks, badges, and progress tracking
- 🤖 **AI Tutor Chat**: Personalized learning guidance
- 🔧 **Project-Based Learning**: Learn by building real applications
- 🧩 **Multiple Question Types**: Debugging, vocabulary, design challenges
- 🌐 **Cross-Domain Learning**: Interleave different subjects for better retention

## 🏗️ Architecture

### Frontend
- **HTML5/CSS3/JavaScript**: Modern web standards
- **Bootstrap 5**: Responsive UI components
- **Font Awesome**: Icons and visual elements
- **Progressive Enhancement**: Works without JavaScript enabled

### Backend  
- **Node.js/Express**: RESTful API server
- **advanced-imessage-kit**: SMS integration for daily challenges
- **node-cron**: Scheduled learning notifications
- **In-memory storage**: For prototype (production would use database)

### SMS Integration
- **advanced-imessage-kit**: Primary SMS service integration
- **Fallback simulation**: Development mode without SMS credentials
- **Daily challenges**: Automated via cron jobs
- **Interactive responses**: Two-way SMS conversation

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- macOS (for iMessage integration)
- Text editor/IDE

### Installation

1. **Clone and setup**:
```bash
git clone <repository-url>
cd tutor-prototype
npm install
```

2. **Environment setup**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the application**:
```bash
# Development mode
npm run dev

# Production mode  
npm start
```

4. **Access the app**:
   - Frontend: http://localhost:3000
   - SMS API: Automatically configured

## 🎮 Usage Guide

### Vision Board
- Set learning goals across different domains
- Track progress with visual indicators
- Maintain daily learning streaks

### Learning Sessions
- Take interactive quizzes across multiple subjects
- Debug real code challenges
- Learn vocabulary in context
- Complete algorithm design challenges

### AI Tutor Chat
- Ask questions about programming concepts
- Get personalized study plans
- Receive project guidance
- Debug problems with AI assistance

### SMS Learning
1. Enter your phone number in the app
2. Receive daily challenges via SMS
3. Reply with your answers
4. Get instant feedback and streak tracking

### Project-Guided Learning
1. Describe your project idea to the AI tutor
2. Get tech stack recommendations
3. Follow a step-by-step learning path
4. Complete challenges that build toward your final project

## 📱 SMS Commands

| Command | Description |
|---------|-------------|
| `HELP` | Show available commands |
| `STATS` | View your learning statistics |
| `STOP` | Unsubscribe from challenges |
| `HINT` | Get a hint for current challenge |
| Answer text | Submit your challenge response |

## 🎯 Learning Objectives

### For Students (Lauren's Persona)
- Bridge theory-to-practice gap
- Build confidence through guided challenges
- Learn by creating actual projects
- Get unstuck when facing new technologies

### For Junior Developers (John's Persona)  
- Understand unfamiliar codebases
- Learn new languages/frameworks systematically
- Build debugging and analysis skills
- Gain confidence in code comprehension

### For Experienced Developers (Hakim's Persona)
- Deepen theoretical knowledge
- Stay current with new technologies
- Learn low-level systems concepts
- master advanced algorithms and patterns

## 🧩 Question Types

### 🐛 Debugging Challenges
- Find and fix bugs in provided code
- Explain what went wrong and why
- Learn common error patterns

### 📚 Vocabulary Building
- Learn new programming concepts daily
- Practice with real code examples
- Build technical vocabulary systematically

### 🎨 Design Challenges  
- Create system architecture diagrams
- Design database schemas
- Plan application workflows

### 🧠 Concept Explanation
- Teach concepts back to the AI ("Explain like I'm five")
- Test deep understanding vs. surface knowledge
- Build communication skills

### 🔀 20 Questions Style
- Guess algorithms/data structures through Q&A
- Learn to analyze complexity and constraints
- Develop analytical thinking

## 🏆 Gamification Features

### Streaks & Progress
- Daily learning streaks
- Topic-specific progress bars
- Goal completion tracking

### Badges & Achievements
- 🐛 **Debug Master**: Fix 10 bugs in a row
- 🔥 **Streak Keeper**: Maintain 7+ day streak  
- 🌟 **Polyglot**: Learn across 3+ domains
- 🚀 **Quick Learner**: Complete sessions under time

### Social Features (Future)
- Share progress on "study-finsta"
- Compare streaks with friends  
- Collaborative learning challenges

## 🔧 API Endpoints

### Core Learning API
```javascript
POST /api/register-sms      // Register for SMS learning
POST /api/send-challenge    // Send daily challenge
POST /api/handle-response   // Process SMS responses
GET  /api/progress/:userId  // Get user progress
```

### Project Guide API
```javascript
POST /api/projects/start           // Start new project
GET  /api/projects/:id/progress    // Get project status  
POST /api/projects/:id/complete    // Complete challenge
```

## 🎨 Technical Implementation

### Frontend State Management
```javascript
const appState = {
    currentSection: 'vision-board',
    userProgress: { streak: 7, completed: 247 },
    goals: { programming: [...], language: [...] },
    questions: [...],
    chatMessages: [...]
};
```

### SMS Integration
```javascript
const imessageClient = new iMessageClient({
    bundleId: 'com.tutor.learning',
    authToken: process.env.IMESSAGE_AUTH_TOKEN
});

// Daily challenges at 9 AM
cron.schedule('0 9 * * *', sendDailyChallenges);
```

### Project Guide System
```javascript
const projectGuide = new ProjectGuide();
const project = await projectGuide.startProject(userId, projectIdea);
// Generates: requirements → tech stack → learning path → challenges
```

## 🧪 Testing

### Manual Testing
1. **SMS Integration**: Test with real phone number
2. **Learning Flow**: Complete full question sequence
3. **Project Guide**: Start and complete project challenges
4. **AI Chat**: Test various query types

### Unit Testing (Planned)
```bash
npm test
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Set production environment variables
2. Configure SSL/HTTPS
3. Set up process monitoring
4. Deploy to cloud platform (Heroku, AWS, etc.)

### Environment Variables
- `IMESSAGE_AUTH_TOKEN`: iMessage integration token
- `OPENAI_API_KEY`: AI tutor functionality  
- `DATABASE_URL`: Production database
- `REDIS_URL`: Session storage

## 🔮 Future Enhancements

### Technical
- [ ] Database persistence (MongoDB/PostgreSQL)
- [ ] User authentication and accounts
- [ ] Real-time AI tutor integration (OpenAI API)
- [ ] Advanced analytics and learning insights
- [ ] Mobile app versions (React Native)

### Educational
- [ ] More question types (diagram completion, UML design)
- [ ] Advanced project templates
- [ ] Collaborative learning features
- [ ] Integration with coding platforms (GitHub, LeetCode)
- [ ] Spaced repetition algorithms

### Content
- [ ] More programming languages (Go, Rust, Kotlin)
- [ ] Natural language learning modules  
- [ ] Technical interview preparation
- [ ] System design challenges

## 📊 Success Metrics

### Learning Outcomes
- User confidence in understanding code (vs. generating)
- Reduced dependence on AI for simple tasks
- Improved debugging skills
- Better architectural thinking

### Engagement Metrics
- Daily active users
- Streak retention rates  
- Challenge completion rates
- SMS response rates

### Technical Metrics
- App performance and uptime
- SMS delivery success rates
- User session duration
- Feature adoption rates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow JavaScript ES6+ standards
- Write descriptive commit messages
- Include tests for new features
- Update documentation

## 📄 License

MIT License - see LICENSE file for details.

## 👥 Team

- **Sarah**: Java, JS, React, Design, Research
- **Alex**: Java, Python, JS, Language Learning, Linguistics  
- **Mehak**: Python, Computer Vision, Finance, Social Media

## 📞 Support

- 📧 Email: support@tutor.tech
- 💬 Chat: Available in app
- 📱 SMS: Text HELP to your registered number
- 📖 Docs: https://tutor.tech/docs

---

Built with ❤️ for the future of learning. **Programming by hand is not a lost art.**