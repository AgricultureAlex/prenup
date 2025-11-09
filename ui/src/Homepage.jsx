import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import "./homepage.css";
import MainLayout from "./layout";

function Homepage() {
const streak = 5;
const [desired, setDesired] = useState([]);
const [newDesired, setNewDesired]= useState('');
const navigate = useNavigate();

const addDesired = (e) => {
  if (newDesired.trim() !== '') {
    setDesired([...desired, newDesired]);
    setNewDesired('');
  }
  e.preventDefault();
};

const removeDesired = (index) => {
  setDesired(desired.filter((_, i) => i !== index));
};

const handleClick = (category, name) => {
  navigate(`/roadmap/${category}/${encodeURIComponent(name)}`);
};

  return (
    <MainLayout>
    <div className="homepage-container">
      <h1 className="homepage-title">APP NAME</h1>

      <p className="homepage-subtitle">Your Personalized Learning Companion</p>

      <h3 className="homepage-visionboard-title"> Your Personal Vision Board </h3>

      <div className="homepage-visionboard">
        <div className="vision-item">
          <h2>Desired Roles</h2>
            <div className="item-element" onClick={() => handleClick("Roles", "Fullstack Developer")}>
              <div className="item-element-name">
                <p>Fullstack Developer</p>
              </div>
            <progress value="20" max="100"></progress> 20%
          </div>
          <div className="item-element" onClick={() => handleClick("Roles", "Data Scientist")}> 
            <div className="item-element-name">
              <p>Data Scientist</p>
            </div>
            <progress value="40" max="100"></progress> 40%
          </div>

        </div>

        <div className="vision-item">
          <h2>Desired Projects</h2>
          <div className="item-element" onClick={() => handleClick("Projects", "Mood Tracking App")}> 
            <div className="item-element-name">
              <p>Mood Tracking App</p>
            </div>
            <progress value="70" max="100"></progress> 70%
          </div>
          
          <div className="item-element" onClick={() => handleClick("Projects", "Company Website")}> 
            <div className="item-element-name">
              <p>Company Website</p>
            </div>
            <progress value="36" max="100"></progress> 36%
          </div>
          
          <div className="item-element" onClick={() => handleClick("Projects", "Video Game")}> 
            <div className="item-element-name">
              <p>Video Game</p>
            </div>
            <progress value="20" max="100"></progress> 20%
          </div>
        </div>
        
        <div className="vision-item">
          <h2>Desired Skills/Tools</h2>
          
          <div className="item-element" onClick={() => handleClick("Skills-Tools", "Python")}> 
            <div className="item-element-name">
              <p>Python</p>
            </div>
            <progress value="88" max="100"></progress> 88%
            </div>
          
          <div className="item-element" onClick={() => handleClick("Skills-Tools", "SQL")}> 
            <div className="item-element-name">
              <p>SQL</p>
            </div>
            <progress value="71" max="100"></progress> 71%
          </div>
          
          <div className="item-element" onClick={() => handleClick("Skills-Tools", "Large Language Models")}> 
            <div className="item-element-name">
              <p>Large Language Models</p>
            </div>
            <progress value="20" max="100"></progress> 20%
          </div>
        </div>
      </div>

      <div className="homepage-challenge"><h3 classname="challenge-title"> Daily Growth Challenge</h3></div>

      
      <div className="homepage-streaks">
        <h3 className="streaks-title"> Learning Streaks: </h3>
        <p className="streak-count"> {streak} days 🔥</p>
      </div>

    </div>
    </MainLayout>
  );
}

export default Homepage;