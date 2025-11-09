import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModelProvider } from "./ModelContext.jsx";
import Homepage from "./Homepage.jsx";
import AIChatBot from "./AIChatBot.jsx";
import Roadmap from "./Roadmap.jsx";
import ChallengeQs from "./ChallengeQs.jsx";
import Settings from "./Settings.jsx";
import AITrendsMonitor from "./AITrendsMonitor.jsx";


function App() {
  // Initialize font and font size from localStorage on app load
  useEffect(() => {
    const savedFont = localStorage.getItem('selectedFont');
    const savedFontSize = localStorage.getItem('selectedFontSize');
    
    if (savedFont) {
      document.documentElement.style.setProperty('--global-font', savedFont);
    } else {
      document.documentElement.style.setProperty('--global-font', 'Inter, system-ui, sans-serif');
    }
    
    if (savedFontSize) {
      document.documentElement.style.setProperty('--global-font-size', `${savedFontSize}px`);
    } else {
      document.documentElement.style.setProperty('--global-font-size', '16px');
    }
  }, []);

  return (
    <ModelProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/AIChatBot" element={<AIChatBot />} />
          <Route path="/roadmap/:category/:name" element={<Roadmap />} /> {/* 👈 dynamic route */}
          <Route path="/ChallengeQs" element={<ChallengeQs />} />
          <Route path="/Settings" element={<Settings />} />
          <Route path="/AITrends" element={<AITrendsMonitor />} />
        </Routes>
      </BrowserRouter>
    </ModelProvider>
  );
}

export default App;
