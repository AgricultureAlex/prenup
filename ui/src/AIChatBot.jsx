import react, {useState, useEffect, useRef} from 'react';
import "./AIChatBot.css";
import MainLayout from './layout';
import Navigation from './navigation/Navigation';

const API_BASE = "http://localhost:8000";

function AIChatBot() {
const [messages, setMessages]= useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (inputValue.trim() === "") {
      return; // Don't submit empty messages
    }

    const userText = inputValue;
    setInputValue("");
    
    // Convert current messages to history format for API
    const history = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Add user message to chat
    setMessages((m) => [...m, { text: userText, sender: 'user' }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: history
        }),
      });

      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }

      const data = await res.json(); // { reply: string }
      setMessages((m) => [...m, { text: data.reply, sender: 'ai' }]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { text: "Oops, something went wrong calling the backend.", sender: 'ai' },
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
      <div className="aichatbot-container">
        <h1 className="aichatbot-title">AI Tutor</h1>
        <h3 className="aichatbot-subtitle">What can I help you with?</h3>

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
            {message.text}
          </div>
        ))}
        </div>

        <div className="message-input-wrapper">
          <input 
            type="text" 
            placeholder="Type your message..." 
            className="message-input"
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
      </div>
    </MainLayout>
  );
}

export default AIChatBot;