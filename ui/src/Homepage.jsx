import React, {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import { useModel } from './ModelContext';
import "./Homepage.css";
import MainLayout from "./layout.jsx";

function Homepage() {
const [desired, setDesired] = useState([]);
const [newDesired, setNewDesired]= useState('');
const navigate = useNavigate();
const { selectedModel } = useModel();

// Typing animation state
const [displayedTitle, setDisplayedTitle] = useState('');
const fullTitle = 'VibeChild.tech';

// Typing animation effect
useEffect(() => {
  let currentIndex = 0;
  const typingInterval = setInterval(() => {
    if (currentIndex <= fullTitle.length) {
      setDisplayedTitle(fullTitle.substring(0, currentIndex));
      currentIndex++;
    } else {
      clearInterval(typingInterval);
    }
  }, 150); // Speed of typing (milliseconds per character)

  return () => clearInterval(typingInterval);
}, []);

// Streak tracking
const [streak, setStreak] = useState(() => {
  const savedStreak = localStorage.getItem('learningStreak');
  return savedStreak ? parseInt(savedStreak) : 0;
});

// Update streak based on activity
useEffect(() => {
  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastActive = localStorage.getItem('lastActiveDate');
    const currentStreak = parseInt(localStorage.getItem('learningStreak') || '0');
    
    if (!lastActive) {
      // First time user
      localStorage.setItem('lastActiveDate', today);
      localStorage.setItem('learningStreak', '1');
      setStreak(1);
      return;
    }
    
    const lastActiveDate = new Date(lastActive);
    const todayDate = new Date(today);
    const diffTime = todayDate - lastActiveDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Same day, no change
      setStreak(currentStreak);
    } else if (diffDays === 1) {
      // Consecutive day, increment streak
      const newStreak = currentStreak + 1;
      localStorage.setItem('lastActiveDate', today);
      localStorage.setItem('learningStreak', newStreak.toString());
      setStreak(newStreak);
    } else {
      // Streak broken, reset to 1
      localStorage.setItem('lastActiveDate', today);
      localStorage.setItem('learningStreak', '1');
      setStreak(1);
    }
  };
  
  updateStreak();
}, []);

// Roadmap data structure to get step counts
const roadmapSteps = {
  "Roles": {
    "Fullstack Developer": 5,
    "Data Scientist": 5
  },
  "Projects": {
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
      
      // Check if it's a custom item (not in roadmapSteps)
      let totalSteps = roadmapSteps[category]?.[name];
      
      if (!totalSteps) {
        // It's a custom item - check localStorage for the item's steps
        // Map category names to localStorage keys
        const categoryKeyMap = {
          'Roles': 'custom_roles',
          'Projects': 'custom_projects',
          'Skills-Tools': 'custom_skills'
        };
        
        const customKey = categoryKeyMap[category];
        if (customKey) {
          const saved = localStorage.getItem(customKey);
          if (saved) {
            const customItems = JSON.parse(saved);
            const item = customItems.find(i => i.name === name);
            if (item && item.steps) {
              totalSteps = item.steps.length; // Custom items have 20 AI-generated steps
            }
          }
        }
      }
      
      // Default to 5 for custom items (since they're AI-generated with 5 major milestones)
      totalSteps = totalSteps || 5;
      
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
const [companyWebsite, setCompanyWebsite] = useState(() => getProgress("Projects", "Company Website"));
const [videoGame, setVideoGame] = useState(() => getProgress("Projects", "Video Game"));
const [python, setPython] = useState(() => getProgress("Skills-Tools", "Python"));
const [sql, setSQL] = useState(() => getProgress("Skills-Tools", "SQL"));
const [llm, setLLM] = useState(() => getProgress("Skills-Tools", "Large Language Models"));

// Custom progress cards state - Projects
const [customProjects, setCustomProjects] = useState(() => {
  const saved = localStorage.getItem('custom_projects');
  return saved ? JSON.parse(saved) : [];
});

// Custom progress cards state - Roles
const [customRoles, setCustomRoles] = useState(() => {
  const saved = localStorage.getItem('custom_roles');
  return saved ? JSON.parse(saved) : [];
});

// Custom progress cards state - Skills/Tools
const [customSkills, setCustomSkills] = useState(() => {
  const saved = localStorage.getItem('custom_skills');
  return saved ? JSON.parse(saved) : [];
});

// Save custom items to localStorage whenever they change
useEffect(() => {
  localStorage.setItem('custom_projects', JSON.stringify(customProjects));
}, [customProjects]);

useEffect(() => {
  localStorage.setItem('custom_roles', JSON.stringify(customRoles));
}, [customRoles]);

useEffect(() => {
  localStorage.setItem('custom_skills', JSON.stringify(customSkills));
}, [customSkills]);

// Refresh progress when component gains focus
useEffect(() => {
  const handleFocus = () => {
    setFullstack(getProgress("Roles", "Fullstack Developer"));
    setDataScientist(getProgress("Roles", "Data Scientist"));
    setCompanyWebsite(getProgress("Projects", "Company Website"));
    setVideoGame(getProgress("Projects", "Video Game"));
    setPython(getProgress("Skills-Tools", "Python"));
    setSQL(getProgress("Skills-Tools", "SQL"));
    setLLM(getProgress("Skills-Tools", "Large Language Models"));
    
    // Refresh custom items progress
    const savedProjects = localStorage.getItem('custom_projects');
    if (savedProjects) {
      setCustomProjects(JSON.parse(savedProjects));
    }
    
    const savedRoles = localStorage.getItem('custom_roles');
    if (savedRoles) {
      setCustomRoles(JSON.parse(savedRoles));
    }
    
    const savedSkills = localStorage.getItem('custom_skills');
    if (savedSkills) {
      setCustomSkills(JSON.parse(savedSkills));
    }
  };

  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, []);

// Generic function to add custom items
const addCustomItem = async (itemName, category, currentItems, setItems) => {
  if (currentItems.length >= 20) {
    alert(`Maximum of 20 custom ${category.toLowerCase()} reached`);
    return;
  }
  
  if (currentItems.some(p => p.name === itemName)) {
    alert(`${category} already exists`);
    return;
  }

  try {
    // Call AI to generate progress cards
    const response = await fetch('http://localhost:8000/generate-progress-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_name: itemName, model: selectedModel })
    });
    
    const data = await response.json();
    
    const newItem = {
      name: itemName,
      steps: data.cards || []
    };
    
    setItems([...currentItems, newItem]);
    
    // Initialize progress in localStorage
    const storageKey = `roadmap_progress_${category}_${itemName}`;
    const initialProgress = {};
    data.cards.forEach((_, index) => {
      initialProgress[`Milestone ${index + 1}`] = false;
    });
    localStorage.setItem(storageKey, JSON.stringify(initialProgress));
    
  } catch (error) {
    console.error('Error generating progress cards:', error);
    alert('Failed to generate progress cards. Please try again.');
  }
};

// Specific functions for each category
const addCustomProject = (projectName) => addCustomItem(projectName, 'Projects', customProjects, setCustomProjects);
const addCustomRole = (roleName) => addCustomItem(roleName, 'Roles', customRoles, setCustomRoles);
const addCustomSkill = (skillName) => addCustomItem(skillName, 'Skills-Tools', customSkills, setCustomSkills);

// Generic function to remove custom items
const removeCustomItem = (itemName, category, currentItems, setItems) => {
  setItems(currentItems.filter(p => p.name !== itemName));
  localStorage.removeItem(`roadmap_progress_${category}_${itemName}`);
};

// Specific remove functions
const removeCustomProject = (projectName) => removeCustomItem(projectName, 'Projects', customProjects, setCustomProjects);
const removeCustomRole = (roleName) => removeCustomItem(roleName, 'Roles', customRoles, setCustomRoles);
const removeCustomSkill = (skillName) => removeCustomItem(skillName, 'Skills-Tools', customSkills, setCustomSkills);

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
    <div className = "homepage-title-container">
      <h1 className="homepage-title">{displayedTitle}<span className="typing-cursor">|</span></h1>
    </div>
      <h2 className="homepage-subtitle">Your personal learning companion</h2>
      <h3 className="homepage-visionboard-title">Your Personal Vision Board</h3>
      <div className="homepage-visionboard">
        <div className="vision-item">
          <h2>Desired Roles</h2>
            <div className="item-element" onClick={() => handleClick("Roles", "Fullstack Developer")} style={{ cursor: 'pointer' }}>
                <div className="item-element-name">
                  <p>Fullstack Developer</p>
                </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${fullstack}%` }}>
                  {fullstack}%
                </div>
              </div>
            </div>
            <div className="item-element" onClick={() => handleClick("Roles", "Data Scientist")} style={{ cursor: 'pointer' }}>
              <div className="item-element-name">
                <p>Data Scientist</p>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${dataScientist}%` }}>
                  {dataScientist}%
                </div>
              </div>
            </div>
  
            {/* Custom Roles */}
            {customRoles.map((role) => {
              const progress = getProgress("Roles", role.name);
              return (
                <div key={role.name} className="item-element" onClick={() => handleClick("Roles", role.name)} style={{ position: 'relative', cursor: 'pointer' }}>
                  <div className="item-element-name">
                    <p>{role.name}</p>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
                      {progress}%
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCustomRole(role.name); }}
                    style={{
                      position: 'absolute',
                      right: '5px',
                      top: '5px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      lineHeight: '1'
                    }}
                    title="Remove role"
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {/* Add New Role Button - moved below existing roles */}
            {customRoles.length < 20 && (
              <div className="item-element" style={{ background: '#e0f2fe', cursor: 'pointer' }}
                   onClick={() => {
                     const roleName = prompt('Enter role name:');
                     if (roleName && roleName.trim()) {
                       addCustomRole(roleName.trim());
                     }
                   }}>
                <div className="item-element-name" style={{ textAlign: 'center', width: '100%' }}>
                  <p style={{ color: '#0284c7', fontWeight: 'bold' }}>+ Add New Role</p>
                </div>
              </div>
            )}
        </div>

        <div className="vision-item">
          <h2>Desired Projects</h2>
          
          <div className="item-element" onClick={() => handleClick("Projects", "Company Website")} style={{ cursor: 'pointer' }}>
            <div className="item-element-name">
              <p>Company Website</p>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${companyWebsite}%` }}>
                {companyWebsite}%
              </div>
            </div>
          </div>
          
          <div className="item-element" onClick={() => handleClick("Projects", "Video Game")} style={{ cursor: 'pointer' }}>
            <div className="item-element-name">
              <p>Video Game</p>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${videoGame}%` }}>
                {videoGame}%
              </div>
            </div>
          </div>

          {/* Custom Projects */}
          {customProjects.map((project) => {
            const progress = getProgress("Projects", project.name);
            return (
              <div key={project.name} className="item-element" onClick={() => handleClick("Projects", project.name)} style={{ position: 'relative', cursor: 'pointer' }}>
                <div className="item-element-name">
                  <p>{project.name}</p>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
                    {progress}%
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeCustomProject(project.name); }}
                  style={{
                    position: 'absolute',
                    right: '5px',
                    top: '5px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    lineHeight: '1'
                  }}
                  title="Remove project"
                >
                  ×
                </button>
              </div>
            );
          })}

          {/* Add New Project Button */}
          {customProjects.length < 20 && (
            <div className="item-element" style={{ background: '#e0f2fe', cursor: 'pointer' }}
                 onClick={() => {
                   const projectName = prompt('Enter project name:');
                   if (projectName && projectName.trim()) {
                     addCustomProject(projectName.trim());
                   }
                 }}>
              <div className="item-element-name" style={{ textAlign: 'center', width: '100%' }}>
                <p style={{ color: '#0284c7', fontWeight: 'bold' }}>+ Add New Project</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="vision-item">
          <h2>Desired Skills/Tools</h2>
          
          <div className="item-element" onClick={() => handleClick("Skills-Tools", "Python")} style={{ cursor: 'pointer' }}>
            <div className="item-element-name">
              <p>Python</p>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${python}%` }}>
                {python}%
              </div>
            </div>
          </div>
          
          <div className="item-element" onClick={() => handleClick("Skills-Tools", "SQL")} style={{ cursor: 'pointer' }}>
            <div className="item-element-name">
              <p>SQL</p>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${sql}%` }}>
                {sql}%
              </div>
            </div>
          </div>
          
          <div className="item-element" onClick={() => handleClick("Skills-Tools", "Large Language Models")} style={{ cursor: 'pointer' }}>
            <div className="item-element-name">
              <p>Large Language Models</p>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${llm}%` }}>
                {llm}%
              </div>
            </div>
          </div>

          {/* Custom Skills/Tools */}
          {customSkills.map((skill) => {
            const progress = getProgress("Skills-Tools", skill.name);
            return (
              <div key={skill.name} className="item-element" onClick={() => handleClick("Skills-Tools", skill.name)} style={{ position: 'relative', cursor: 'pointer' }}>
                <div className="item-element-name">
                  <p>{skill.name}</p>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
                    {progress}%
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeCustomSkill(skill.name); }}
                  style={{
                    position: 'absolute',
                    right: '5px',
                    top: '5px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    lineHeight: '1'
                  }}
                  title="Remove skill/tool"
                >
                  ×
                </button>
              </div>
            );
          })}

          {/* Add New Skill/Tool Button - moved below existing skills */}
          {customSkills.length < 20 && (
            <div className="item-element" style={{ background: '#e0f2fe', cursor: 'pointer' }}
                 onClick={() => {
                   const skillName = prompt('Enter skill/tool name:');
                   if (skillName && skillName.trim()) {
                     addCustomSkill(skillName.trim());
                   }
                 }}>
              <div className="item-element-name" style={{ textAlign: 'center', width: '100%' }}>
                <p style={{ color: '#0284c7', fontWeight: 'bold' }}>+ Add New Skill/Tool</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="homepage-challenge" onClick={() => navigate("/AIChatBot", { state: { mode: "challenge" } })}><h3 className="challenge-title"> Daily Growth Challenges</h3></div>

      
      <div className="homepage-streaks">
        <h3 className="streaks-title">Learning Streak:</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p className="streak-count">{streak} {streak === 1 ? 'day' : 'days'}</p>
          <span style={{ fontSize: '2rem' }}>🔥</span>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
          {streak === 0 ? 'Start your streak today!' :
           streak === 1 ? 'Great start! Come back tomorrow!' :
           streak < 7 ? 'Keep it up!' :
           streak < 30 ? 'Amazing consistency!' :
           'Incredible dedication! 🎉'}
        </p>
      </div>

    </div>
    </MainLayout>
  );
}

export default Homepage;
