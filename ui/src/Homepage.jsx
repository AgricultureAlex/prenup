import React, {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import "./Homepage.css";
import MainLayout from "./layout.jsx";

function Homepage() {
const streak = 5;
const [desired, setDesired] = useState([]);
const [newDesired, setNewDesired]= useState('');
const navigate = useNavigate();

// Roadmap data structure to get step counts
const roadmapSteps = {
  "Roles": {
    "Fullstack Developer": 5,
    "Data Scientist": 5
  },
  "Projects": {
    "Mood Tracking App": 5,
    "Company Website": 5,
    "Video Game": 5
  },
  "Skills-Tools": {
    "Python": 5,
    "SQL": 5,
    "Large Language Models": 5
  }
};

// Function to calculate progress from localStorage
const getProgress = (category, name) => {
  try {
    const storageKey = `roadmap_progress_${category}_${name}`;
    const savedProgress = localStorage.getItem(storageKey);
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      const totalSteps = roadmapSteps[category]?.[name] || 5;
      const completedSteps = Object.values(progress).filter(Boolean).length;
      return Math.round((completedSteps / totalSteps) * 100);
    }
    return 0;
  } catch (error) {
    console.error('Error loading progress:', error);
    return 0;
  }
};

// Progress states for sliders - initialized from localStorage
const [fullstack, setFullstack] = useState(() => getProgress("Roles", "Fullstack Developer"));
const [dataScientist, setDataScientist] = useState(() => getProgress("Roles", "Data Scientist"));
const [moodApp, setMoodApp] = useState(() => getProgress("Projects", "Mood Tracking App"));
const [companyWebsite, setCompanyWebsite] = useState(() => getProgress("Projects", "Company Website"));
const [videoGame, setVideoGame] = useState(() => getProgress("Projects", "Video Game"));
const [python, setPython] = useState(() => getProgress("Skills-Tools", "Python"));
const [sql, setSQL] = useState(() => getProgress("Skills-Tools", "SQL"));
const [llm, setLLM] = useState(() => getProgress("Skills-Tools", "Large Language Models"));

// Refresh progress when component gains focus
useEffect(() => {
  const handleFocus = () => {
    setFullstack(getProgress("Roles", "Fullstack Developer"));
    setDataScientist(getProgress("Roles", "Data Scientist"));
    setMoodApp(getProgress("Projects", "Mood Tracking App"));
    setCompanyWebsite(getProgress("Projects", "Company Website"));
    setVideoGame(getProgress("Projects", "Video Game"));
    setPython(getProgress("Skills-Tools", "Python"));
    setSQL(getProgress("Skills-Tools", "SQL"));
    setLLM(getProgress("Skills-Tools", "Large Language Models"));
  };

  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, []);

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
      <h1 className="homepage-title">VibeChild.Tech</h1>

      <p className="homepage-subtitle">Your Personalized Learning Companion</p>

      <h3 className="homepage-visionboard-title"> Your Personal Vision Board </h3>

      <div className="homepage-visionboard">
        <div className="vision-item">
          <h2>Desired Roles</h2>
            <div className="item-element">
                <div className="item-element-name">
                  <p onClick={() => handleClick("Roles", "Fullstack Developer")}>Fullstack Developer</p>
                </div>
              <input type="range" min="0" max="100" value={fullstack} readOnly className="progress-slider" style={{ pointerEvents: 'none' }} />
              <span className="progress-label">{fullstack}%</span>
            </div>
            <div className="item-element">
              <div className="item-element-name">
                <p onClick={() => handleClick("Roles", "Data Scientist")}>Data Scientist</p>
              </div>
              <input type="range" min="0" max="100" value={dataScientist} readOnly className="progress-slider" style={{ pointerEvents: 'none' }} />
              <span className="progress-label">{dataScientist}%</span>
            </div>

        </div>

        <div className="vision-item">
          <h2>Desired Projects</h2>
          <div className="item-element">
            <div className="item-element-name">
              <p onClick={() => handleClick("Projects", "Mood Tracking App")}>Mood Tracking App</p>
            </div>
            <input type="range" min="0" max="100" value={moodApp} readOnly className="progress-slider" style={{ pointerEvents: 'none' }} />
            <span className="progress-label">{moodApp}%</span>
          </div>
          
          <div className="item-element">
            <div className="item-element-name">
              <p onClick={() => handleClick("Projects", "Company Website")}>Company Website</p>
            </div>
            <input type="range" min="0" max="100" value={companyWebsite} readOnly className="progress-slider" style={{ pointerEvents: 'none' }} />
            <span className="progress-label">{companyWebsite}%</span>
          </div>
          
          <div className="item-element">
            <div className="item-element-name">
              <p onClick={() => handleClick("Projects", "Video Game")}>Video Game</p>
            </div>
            <input type="range" min="0" max="100" value={videoGame} readOnly className="progress-slider" style={{ pointerEvents: 'none' }} />
            <span className="progress-label">{videoGame}%</span>
          </div>
        </div>
        
        <div className="vision-item">
          <h2>Desired Skills/Tools</h2>
          
          <div className="item-element">
            <div className="item-element-name">
              <p onClick={() => handleClick("Skills-Tools", "Python")}>Python</p>
            </div>
            <input type="range" min="0" max="100" value={python} readOnly className="progress-slider" style={{ pointerEvents: 'none' }} />
            <span className="progress-label">{python}%</span>
            </div>
          
          <div className="item-element">
            <div className="item-element-name">
              <p onClick={() => handleClick("Skills-Tools", "SQL")}>SQL</p>
            </div>
            <input type="range" min="0" max="100" value={sql} readOnly className="progress-slider" style={{ pointerEvents: 'none' }} />
            <span className="progress-label">{sql}%</span>
          </div>
          
          <div className="item-element">
            <div className="item-element-name">
              <p onClick={() => handleClick("Skills-Tools", "Large Language Models")}>Large Language Models</p>
            </div>
            <input type="range" min="0" max="100" value={llm} readOnly className="progress-slider" style={{ pointerEvents: 'none' }} />
            <span className="progress-label">{llm}%</span>
          </div>
        </div>
      </div>

      <div className="homepage-challenge" onClick={() => navigate("/AIChatBot", { state: { mode: "challenge" } })}><h3 className="challenge-title"> Daily Growth Challenges</h3></div>

      
      <div className="homepage-streaks">
        <h3 className="streaks-title"> Learning Streaks: </h3>
        <p className="streak-count"> {streak} days 🔥</p>
      </div>

    </div>
    </MainLayout>
  );
}

export default Homepage;
