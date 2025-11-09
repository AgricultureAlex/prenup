import { useParams } from "react-router-dom";
import "./Roadmap.css"
import MainLayout from "./layout";
import Navigation from "./navigation/Navigation";

function RoadmapPage() {
  const { category, name } = useParams();
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
      }
    },
    "Projects": {
      "Mood Tracking App": {
        steps: [
          "Define app features and requirements",
          "Design UI/UX mockups",
          "Set up backend and database",
          "Develop frontend interface",
          "Test and deploy the app"
        ]
      },
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
      }
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
          "Experiment with pre-trained  models",
          "Fine-tune models for specific tasks",
          "Deploy models in applications"
        ]
      }
    }       
  }
  
  return (
    <MainLayout>
    <div className="roadmap-container">
      <h1 className="roadmap-title">{decodeURIComponent(name)} Roadmap</h1>
      <p className="roadmap-category">Category: {category}</p>
        <div className="roadmap-steps"> 
            {roadmapData[category] && roadmapData[category][name] ? (
                <ol>
                    {roadmapData[category][name].steps.map((step, index) => (   
                        <p className = "individual-step" key={index}>{step}</p>
                    ))}
                </ol>
            ) : (
                <p>No roadmap data available for this item.</p>
            )}
        </div>  
    </div>
    </MainLayout>
  );
}

export default RoadmapPage;
