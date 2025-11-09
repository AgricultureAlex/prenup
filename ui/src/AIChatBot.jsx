import react, {useState, useEffect, useRef} from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import "./AIChatBot.css";
import MainLayout from './layout';
import Navigation from './navigation/Navigation';

const API_BASE = "http://localhost:8000";

function AIChatBot() {
  const location = useLocation();
  
  // Load chat history from localStorage on component mount
  const loadChatHistory = () => {
    try {
      const savedMessages = localStorage.getItem('aiChatHistory');
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  };

  const [messages, setMessages] = useState(loadChatHistory);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(location.state?.mode || "tutor"); // "tutor", "github", "challenge"
  
  // Challenge mode state
  const [challengeQuestions, setChallengeQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [challengeScore, setChallengeScore] = useState(0);
  const [inChallengeSession, setInChallengeSession] = useState(false);
  const [originalMode, setOriginalMode] = useState(null); // For returning from help mode

  // Show welcome message when coming from homepage in challenge mode
  useEffect(() => {
    if (location.state?.mode === "challenge" && messages.length === 0) {
      // Show typing animation first
      setLoading(true);
      setTimeout(() => {
        setMessages([{
          text: "👋 Welcome to Challenge Mode!\n\nEnter a topic you want to study, or paste a GitHub URL to generate challenge questions from real code.",
          sender: 'ai'
        }]);
        setLoading(false);
      }, 1000); // 1 second typing animation
    }
  }, [location.state?.mode]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem('aiChatHistory', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [messages]);

  // Function to clear chat history
  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem('aiChatHistory');
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (inputValue.trim() === "") {
      return; // Don't submit empty messages
    }

    const userText = inputValue;
    setInputValue("");
    
    // Add user message to chat
    setMessages((m) => [...m, { text: userText, sender: 'user' }]);
    
    // Show typing animation after 1 second if request is still pending
    const loadingTimeout = setTimeout(() => {
      setLoading(true);
    }, 1000);

    try {
      if (mode === "challenge" && !inChallengeSession) {
        // Start Challenge Session - Fetch questions
        const res = await fetch(`${API_BASE}/challenge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: userText }),
        });

        if (!res.ok) throw new Error("HTTP " + res.status);

        const data = await res.json();
        
        // Store questions and start session
        setChallengeQuestions(data.questions);
        setCurrentQuestionIndex(0);
        setChallengeScore(0);
        setInChallengeSession(true);
        
        // Show first question
        showQuestion(data.questions[0], 0, data.questions.length);
        
      } else if (mode === "challenge" && inChallengeSession) {
        // Handle answer or help request during challenge
        handleChallengeInput(userText);
        
      } else {
        // AI Tutor or GitHub Analysis Mode
        const history = messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

        // Check if this is a GitHub URL to show appropriate loading message
        const isGitHubUrl = userText.includes('github.com');
        let loadingMessageIndex = null;
        
        if (isGitHubUrl || mode === "github") {
          setMessages((m) => {
            const newMessages = [...m, { text: "Working...", sender: 'ai', isLoading: true }];
            loadingMessageIndex = newMessages.length - 1;
            return newMessages;
          });
          
          setTimeout(() => {
            setMessages((m) => {
              const updated = [...m];
              if (loadingMessageIndex !== null && updated[loadingMessageIndex]?.isLoading) {
                updated[loadingMessageIndex] = { text: "Still working...", sender: 'ai', isLoading: true };
              }
              return updated;
            });
          }, 5000);
        }

        const res = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            history: history
          }),
        });

        if (!res.ok) throw new Error("HTTP " + res.status);

        const data = await res.json();
        
        setMessages((m) => {
          const filtered = m.filter(msg => !msg.isLoading);
          return [...filtered, { text: data.reply, sender: 'ai' }];
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((m) => {
        const filtered = m.filter(msg => !msg.isLoading);
        return [
          ...filtered,
          { text: "Oops, something went wrong calling the backend.", sender: 'ai' },
        ];
      });
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  }

  // Helper function to show a question
  const showQuestion = (question, index, total) => {
    // Detect and format code blocks in the question text
    let formattedQuestion = question.question;
    
    // Check if the question contains code (indented lines or common code keywords)
    const codePattern = /(?:^|\n)(?:def |class |import |from |if |for |while |function |const |let |var |    |\t)/m;
    
    if (codePattern.test(formattedQuestion) && !formattedQuestion.includes('```')) {
      // Split question into description and code parts
      const lines = formattedQuestion.split('\n');
      let descriptionLines = [];
      let codeLines = [];
      let inCode = false;
      
      for (const line of lines) {
        // Check if line looks like code (indented or starts with keywords)
        if (line.match(/^(def |class |import |from |if |for |while |function |const |let |var |    |\t)/) ||
            (inCode && (line.trim().length === 0 || line.match(/^(    |\t)/))) ||
            (inCode && line.match(/^[a-zA-Z_]/))) {
          inCode = true;
          codeLines.push(line);
        } else if (inCode && codeLines.length > 0) {
          // We've finished a code block
          break;
        } else {
          descriptionLines.push(line);
        }
      }
      
      if (codeLines.length > 0) {
        // Format with code block
        const description = descriptionLines.join('\n').trim();
        const code = codeLines.join('\n').trim();
        formattedQuestion = `${description}\n\n\`\`\`python\n${code}\n\`\`\``;
      }
    }
    
    const questionText = `### Question ${index + 1} of ${total}\n\n${formattedQuestion}\n\n${question.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}\n\n**Type A, B, C, or D to answer**\n*Ask me any question if you need help, or type "quit" to end*`;
    
    setMessages((m) => [...m, { text: questionText, sender: 'ai' }]);
  };

  // Helper function to handle challenge input (answers or questions)
  const handleChallengeInput = async (input) => {
    const trimmedInput = input.trim();
    const upperInput = trimmedInput.toUpperCase();
    const currentQuestion = challengeQuestions[currentQuestionIndex];
    
    // Check if user wants to quit
    if (upperInput === 'QUIT' || upperInput === 'EXIT' || upperInput === 'STOP') {
      setMessages((m) => [...m, {
        text: `Challenge session ended. Final score: **${challengeScore}/${challengeQuestions.length}**\n\nEnter a new topic to start another challenge!`,
        sender: 'ai'
      }]);
      setInChallengeSession(false);
      setChallengeQuestions([]);
      setCurrentQuestionIndex(0);
      setChallengeScore(0);
      return;
    }
    
    // Check if it's a valid answer (single letter: A, B, C, or D)
    if (trimmedInput.length === 1 && ['A', 'B', 'C', 'D'].includes(upperInput)) {
    
      // Process the answer
      const selectedAnswer = currentQuestion.options[upperInput.charCodeAt(0) - 65];
      const isCorrect = selectedAnswer === currentQuestion.answer;
      
      if (isCorrect) {
        setChallengeScore(prev => prev + 1);
        setMessages((m) => [...m, {
          text: `✅ **Correct!**\n\n${currentQuestion.explanation}\n\n**Score: ${challengeScore + 1}/${challengeQuestions.length}**`,
          sender: 'ai'
        }]);
      } else {
        setMessages((m) => [...m, {
          text: `❌ **Incorrect.** The correct answer was: ${currentQuestion.answer}\n\n${currentQuestion.explanation}\n\n**Score: ${challengeScore}/${challengeQuestions.length}**`,
          sender: 'ai'
        }]);
      }
      
      // Move to next question or end session
      if (currentQuestionIndex < challengeQuestions.length - 1) {
        setTimeout(() => {
          const nextIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIndex);
          showQuestion(challengeQuestions[nextIndex], nextIndex, challengeQuestions.length);
        }, 1500);
      } else {
        // End of challenge session
        const finalScore = isCorrect ? challengeScore + 1 : challengeScore;
        setTimeout(() => {
          setMessages((m) => [...m, {
            text: `🎉 **Challenge Complete!**\n\nFinal Score: **${finalScore}/${challengeQuestions.length}**\n\n${finalScore === challengeQuestions.length ? "Perfect score! Outstanding! 🌟" : finalScore >= challengeQuestions.length * 0.7 ? "Great job! You're making excellent progress! 💪" : "Keep practicing! Every question helps you learn! 📚"}\n\nEnter a new topic to start another challenge!`,
            sender: 'ai'
          }]);
          setInChallengeSession(false);
          setChallengeQuestions([]);
          setCurrentQuestionIndex(0);
          setChallengeScore(0);
        }, 1500);
      }
      return;
    }
    
    // Otherwise, treat it as a question for the AI Tutor with context
    const questionContext = `Current challenge question:\n${currentQuestion.question}\n\nOptions:\n${currentQuestion.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}`;
    
    // Get recent conversation history for context
    const history = messages.slice(-6).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    const contextualPrompt = `IMPORTANT: The student is taking a quiz. You must help them understand the concepts WITHOUT revealing which option (A, B, C, or D) is correct. Do not say things like "pick A" or "the answer is B" or "choose option C". Guide their thinking and explain concepts, but let them figure out the answer themselves.

${questionContext}

Student's question: ${trimmedInput}

Remember: Explain concepts and guide their reasoning, but DO NOT reveal which option is the correct answer.`;
    
    // Show typing animation after 1 second if request is still pending
    const loadingTimeout = setTimeout(() => {
      setLoading(true);
    }, 1000);
    
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: contextualPrompt,
          history: history
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((m) => [...m, {
          text: `${data.reply}\n\n*When you're ready, type A, B, C, or D to answer*`,
          sender: 'ai'
        }]);
      }
    } catch (err) {
      setMessages((m) => [...m, {
        text: "I'm having trouble responding right now. Try rephrasing your question!",
        sender: 'ai'
      }]);
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  };

  const chatBoxRef = useRef(null);
  
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const getPlaceholderText = () => {
    if (mode === "challenge" && inChallengeSession) {
      return "Type A, B, C, or D (or ask any question for help)...";
    }
    
    switch(mode) {
      case "tutor":
        return "Ask me anything about programming...";
      case "github":
        return "Paste a GitHub repository URL to analyze...";
      case "challenge":
        return "Enter a topic or GitHub URL for challenge questions...";
      default:
        return "Type your message...";
    }
  };

  const getModeTitle = () => {
    switch(mode) {
      case "tutor":
        return "AI Tutor";
      case "github":
        return "GitHub Analyzer";
      case "challenge":
        return "Challenge Questions";
      default:
        return "AI Tutor";
    }
  };

  return (
    <MainLayout>
      <div className="aichatbot-container">
        <h1 className="aichatbot-title">{getModeTitle()}</h1>
        <h3 className="aichatbot-subtitle">
          {mode === "tutor" && "Ask me anything!"}
          {mode === "github" && "Analyze GitHub repositories"}
          {mode === "challenge" && !inChallengeSession && "Get quiz questions on any topic or from GitHub repos"}
          {mode === "challenge" && inChallengeSession && `Challenge in Progress - Question ${currentQuestionIndex + 1}/${challengeQuestions.length} | Score: ${challengeScore}/${challengeQuestions.length}`}
        </h3>

        <div className="chat-controls">
          <div className="mode-toggles">
            <button
              className={`mode-button ${mode === "tutor" ? "active" : ""}`}
              onClick={() => !inChallengeSession && setMode("tutor")}
              disabled={inChallengeSession}
              title={inChallengeSession ? "Finish challenge first" : "Switch to Tutor mode"}
            >
              💬 Tutor
            </button>
            <button
              className={`mode-button ${mode === "github" ? "active" : ""}`}
              onClick={() => !inChallengeSession && setMode("github")}
              disabled={inChallengeSession}
              title={inChallengeSession ? "Finish challenge first" : "Switch to GitHub mode"}
            >
              📊 GitHub
            </button>
            <button
              className={`mode-button ${mode === "challenge" ? "active" : ""}`}
              onClick={() => setMode("challenge")}
              title="Challenge Questions mode"
            >
              🎯 Challenge
            </button>
          </div>
          <button
            className="clear-history-button"
            onClick={clearChatHistory}
            title="Clear chat history"
          >
            🗑️ Clear
          </button>
          {messages.length > 0 && (
            <span className="message-count">{messages.length} messages</span>
          )}
        </div>

        <div className="chat-box" ref={chatBoxRef}>
          {/* <div className="message user-message">
            Hey, can you help me with logic problems?
          </div>

          <div className="message ai-message">
            Sure! I’d be happy to help you with logic problems.
          </div> */}

          {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender}-message`}
          >
            {message.sender === 'ai' ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {message.text}
              </ReactMarkdown>
            ) : (
              // Handle newlines in user messages
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {message.text}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="message ai-message">
            <div className="loading-animation">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        )}
        </div>

        <div className="message-input-wrapper">
          <input
            type="text"
            placeholder={getPlaceholderText()}
            className="message-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit(e);
              }
            }}
          />
          <button className="send-button" type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "..." : "→"}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

export default AIChatBot;