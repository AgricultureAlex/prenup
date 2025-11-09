import React, { useState } from "react";
import "./Navigation.css";

function NavModeButton() {
  const models = ["xAI", "Claude", "Gemini", "GPT-3.5"];
  const [currentModel, setCurrentModel] = useState(models[0]);

  const handleChange = (e) => {
    setCurrentModel(e.target.value);
    console.log(`Current model: ${e.target.value}`);
  };

  return (
    <div className="nav-mode-container">
      <label htmlFor="model-select" className="nav-mode-label">
        AI Model:
      </label>
      <select
        id="model-select"
        className="nav-mode-select"
        value={currentModel}
        onChange={handleChange}
      >
        {models.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
}

export default NavModeButton;