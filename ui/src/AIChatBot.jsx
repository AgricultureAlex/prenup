import react, {useState, useEffect, useRef} from 'react';
import "./AIChatBot.css";
import MainLayout from './layout';
import Navigation from './navigation/Navigation';

function AIChatBot() {
const [messages, setMessages]= useState([]);
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (inputValue.trim() === "") return;
    // Add user message to chat
    setMessages([...messages, { text: inputValue, sender: 'user' }]);
    setInputValue("");  

    // fake AI message - replace with actual AI response logic after
    setTimeout(() => {
      const aiMessage = { text: "This is a test AI response!", sender: 'ai' };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    }, 800); // 800ms delay to simulate thinking
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