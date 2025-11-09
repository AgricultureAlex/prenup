import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Roadmap.css"
import MainLayout from "./layout";
import Navigation from "./navigation/Navigation";

function RoadmapPage() {
  const { category, name } = useParams();
  
  const [completedSteps, setCompletedSteps] = useState({});

  // Load progress from localStorage when component mounts or params change
  useEffect(() => {
    try {
      const storageKey = `roadmap_progress_${category}_${name}`;
      const savedProgress = localStorage.getItem(storageKey);
      if (savedProgress) {
        setCompletedSteps(JSON.parse(savedProgress));
      } else {
        setCompletedSteps({});
      }
    } catch (error) {
      console.error('Error loading roadmap progress:', error);
      setCompletedSteps({});
    }
  }, [category, name]);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (category && name) {
      try {
        const storageKey = `roadmap_progress_${category}_${name}`;
        localStorage.setItem(storageKey, JSON.stringify(completedSteps));
      } catch (error) {
        console.error('Error saving roadmap progress:', error);
      }
    }
  }, [completedSteps, category, name]);

  // Toggle step completion
  const toggleStep = (stepKey) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepKey]: !prev[stepKey]
    }));
  };

  // Clear all progress
  const clearProgress = () => {
    setCompletedSteps({});
    const storageKey = `roadmap_progress_${category}_${name}`;
    localStorage.removeItem(storageKey);
  };

  // Calculate progress percentage
  const calculateProgress = (totalSteps) => {
    const completed = Object.values(completedSteps).filter(Boolean).length;
    return totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;
  };

  // Load custom items from localStorage
  const [customProjects, setCustomProjects] = useState({});
  const [customRoles, setCustomRoles] = useState({});
  const [customSkills, setCustomSkills] = useState({});

  useEffect(() => {
    const loadCustomItems = () => {
      // Load custom projects
      const savedProjects = localStorage.getItem('custom_projects');
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        const projectsMap = {};
        projects.forEach(project => {
          projectsMap[project.name] = {
            steps: project.steps.map(card => `${card.title}: ${card.description}`)
          };
        });
        setCustomProjects(projectsMap);
      }
      
      // Load custom roles
      const savedRoles = localStorage.getItem('custom_roles');
      if (savedRoles) {
        const roles = JSON.parse(savedRoles);
        const rolesMap = {};
        roles.forEach(role => {
          rolesMap[role.name] = {
            steps: role.steps.map(card => `${card.title}: ${card.description}`)
          };
        });
        setCustomRoles(rolesMap);
      }
      
      // Load custom skills/tools
      const savedSkills = localStorage.getItem('custom_skills');
      if (savedSkills) {
        const skills = JSON.parse(savedSkills);
        const skillsMap = {};
        skills.forEach(skill => {
          skillsMap[skill.name] = {
            steps: skill.steps.map(card => `${card.title}: ${card.description}`)
          };
        });
        setCustomSkills(skillsMap);
      }
    };
    
    loadCustomItems();
    
    // Listen for storage changes
    window.addEventListener('storage', loadCustomItems);
    window.addEventListener('focus', loadCustomItems);
    
    return () => {
      window.removeEventListener('storage', loadCustomItems);
      window.removeEventListener('focus', loadCustomItems);
    };
  }, []);

  const roadmapData ={ // connect with ai agent later to generate dynamic roadmaps
    "Roles": {
      "Fullstack Developer": {
        steps: [
          "Learn HTML, CSS, JavaScript",
          "Master frontend frameworks (React, Vue)",
          "Learn backend development (Node.js, Django)",
          "Understand databases (SQL, NoSQL)",
          "Build fullstack projects"
        ]
      },
      "Data Scientist": {
        steps: [
          "Learn Python and R",
          "Study statistics and probability",
          "Master data visualization tools",
          "Learn machine learning algorithms",
          "Work on real-world datasets"
        ]
      },
      // Add custom roles dynamically
      ...customRoles
    },
    "Projects": {
      "Company Website": {
        steps: [
          "Gather client requirements",
          "Create wireframes and design",
          "Develop frontend with responsive design",
          "Implement backend functionalities",
          "Launch and maintain the website"
        ]
      },
      "Video Game": {
        steps: [
          "Conceptualize game idea and mechanics",
          "Create storyboards and character designs",
          "Develop game engine and physics",
          "Design levels and environments",
          "Test, debug, and release the game"
        ]
      },
      // Add custom projects dynamically
      ...customProjects
    },
    "Skills-Tools": {
      "Python": {
        steps: [
          "Learn basic syntax and data structures",
          "Understand OOP concepts",
          "Explore libraries (Pandas, NumPy)",
          "Work on small projects",
          "Contribute to open-source"
        ]
      },
      "SQL": {
        steps: [
          "Learn basic SQL commands",
          "Understand database design",
          "Practice complex queries",
          "Work with real databases",
          "Optimize database performance"
        ]
      },
      "Large Language Models": {
        steps: [
          "Understand NLP fundamentals",
          "Study transformer architecture",
          "Experiment with pre-trained models",
          "Fine-tune models for specific tasks",
          "Deploy models in applications"
        ]
      },
      // Add custom skills/tools dynamically
      ...customSkills
    }
  }
  
  return (
    <MainLayout>
    <div className="roadmap-container">
      <h1 className="roadmap-title">{decodeURIComponent(name)} Roadmap</h1>
      <p className="roadmap-category">Category: {category}</p>
      
      {roadmapData[category] && roadmapData[category][name] ? (
        <>
          {/* Progress Bar */}
          <div className="progress-section" style={{ margin: '2rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Progress</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                  {Object.values(completedSteps).filter(Boolean).length} / {roadmapData[category][name].steps.length} completed
                </span>
                <button
                  onClick={clearProgress}
                  style={{
                    padding: '0.4rem 0.8rem',
                    cursor: 'pointer',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.85rem'
                  }}
                  title="Clear all progress"
                >
                  🗑️ Reset
                </button>
              </div>
            </div>
            <div style={{
              width: '100%',
              height: '30px',
              backgroundColor: '#e0e0e0',
              borderRadius: '15px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${calculateProgress(roadmapData[category][name].steps.length)}%`,
                height: '100%',
                backgroundColor: '#4caf50',
                transition: 'width 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                {calculateProgress(roadmapData[category][name].steps.length)}%
              </div>
            </div>
          </div>

          {/* Roadmap Steps */}
          <div className="roadmap-steps">
            <ol style={{ listStyle: 'none', padding: 0 }}>
              {roadmapData[category][name].steps.map((step, index) => {
                // Check if this is a custom item (exists in custom arrays)
                const isCustomItem = customProjects[name] || customRoles[name] || customSkills[name];
                const stepKey = isCustomItem ? `Milestone ${index + 1}` : index;
                
                return (
                <li
                  key={index}
                  className="individual-step"
                  onClick={() => toggleStep(stepKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    margin: '0.5rem 0',
                    backgroundColor: completedSteps[stepKey] ? '#e8f5e9' : '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textDecoration: completedSteps[stepKey] ? 'line-through' : 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={completedSteps[stepKey] || false}
                    onChange={() => toggleStep(stepKey)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ flex: 1, color: completedSteps[stepKey] ? '#666' : '#000' }}>
                    {step}
                  </span>
                  {completedSteps[stepKey] && <span style={{ color: '#4caf50' }}>✓</span>}
                </li>
              )})}
            </ol>
          </div>
        </>
      ) : (
        <p>No roadmap data available for this item.</p>
      )}
    </div>
    </MainLayout>
  );
}

export default RoadmapPage;
