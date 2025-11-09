import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./Homepage.jsx";
import AIChatBot from "./AIChatBot.jsx";
import Roadmap from "./Roadmap.jsx";
import ChallengeQs from "./ChallengeQs.jsx";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/AIChatBot" element={<AIChatBot />} />
        <Route path="/roadmap/:category/:name" element={<Roadmap />} /> {/* 👈 dynamic route */}
        <Route path="/ChallengeQs" element={<ChallengeQs />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
