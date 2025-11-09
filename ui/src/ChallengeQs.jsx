import react, {useState, useEffect, useRef, use} from 'react';
import "./ChallengeQs.css";
import MainLayout from './layout.jsx';
import Navigation from './navigation/Navigation';

function ChallengeQs() {
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
      <div className="challengeq-container">
        <h1 className="challengeq-title">Daily Growth Challenges</h1>
        <h4 className="challengeq-subtitle">Get personalized challenge questions to boost your learning!</h4>
        <div className="message-input-wrapper">
          <input 
            type="text" 
            placeholder="Enter a topic for challenge questions..." 
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
            {message.text}
          </div>
        ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default ChallengeQs;
