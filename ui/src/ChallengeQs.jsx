import react, {useState, useEffect, useRef, use} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import "./ChallengeQs.css";
import MainLayout from './layout.jsx';
import Navigation from './navigation/Navigation';

const API_BASE = "http://localhost:8000";

function ChallengeQs() {
  // Load chat history from localStorage on component mount
  const loadChatHistory = () => {
    try {
      const savedMessages = localStorage.getItem('challengeQsChatHistory');
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error('Error loading challenge chat history:', error);
      return [];
    }
  };

  const [messages, setMessages] = useState(() => loadChatHistory());
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem('challengeQsChatHistory', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving challenge chat history:', error);
    }
  }, [messages]);

  // Function to clear chat history
  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem('challengeQsChatHistory');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (inputValue.trim() === "") return;
    
    const topic = inputValue;
    // Add user message to chat
    setMessages([...messages, { text: `Generate challenge questions about: ${topic}`, sender: 'user' }]);
    setInputValue("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic }),
      });

      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }

      const data = await res.json();
      
      // Format the questions nicely
      let formattedResponse = `## Challenge Questions: ${topic}\n\n`;
      data.questions.forEach((q, idx) => {
        formattedResponse += `**Question ${idx + 1}:** ${q.question}\n\n`;
        q.options.forEach((opt, i) => {
          formattedResponse += `${String.fromCharCode(65 + i)}. ${opt}\n`;
        });
        formattedResponse += `\n**Answer:** ${q.answer}\n`;
        formattedResponse += `**Explanation:** ${q.explanation}\n\n---\n\n`;
      });

      setMessages(prevMessages => [...prevMessages, {
        text: formattedResponse,
        sender: 'ai',
        questions: data.questions
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prevMessages => [
        ...prevMessages,
        { text: "❌ Unable to generate challenge questions. Please make sure the backend is running and try again.", sender: 'ai' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const chatBoxRef = useRef(null);
  
  useEffect(() => { 
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);   

  return (
    <MainLayout>
      <div className="challengeq-container">
        <h1 className="challengeq-title">Daily Growth Challenges</h1>
        <h4 className="challengeq-subtitle">Get personalized challenge questions to boost your learning!</h4>
        <p className="challengeq-hint">💡 Enter a topic (e.g., "Python loops") or paste a GitHub URL for code-based questions</p>
        
        {messages.length > 0 && (
          <div className="chat-controls" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              className="clear-history-button"
              onClick={clearChatHistory}
              title="Clear chat history"
              style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
              🗑️ Clear History
            </button>
            <span style={{ padding: '0.5rem', color: '#666' }}>{messages.length} messages</span>
          </div>
        )}
        
        <div className="message-input-wrapper">
          <input
            type="text"
            placeholder="Enter a topic or GitHub URL..."
            className="topic-input"
            value = {inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
              handleSubmit(e);
            }}
          }       
          />
          <button className="send-button" type="submit" onClick={handleSubmit}>→</button>
        </div>

        <div className="input-box" ref={chatBoxRef}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender}-message`}
            >
              {message.sender === 'ai' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.text}
                </ReactMarkdown>
              ) : (
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
      </div>
    </MainLayout>
  );
}

export default ChallengeQs;
