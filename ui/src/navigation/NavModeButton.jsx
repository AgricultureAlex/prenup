import React from "react";
import { useModel } from "../ModelContext";
import "./Navigation.css";

function NavModeButton() {
  const { selectedModel, setSelectedModel } = useModel();
  const models = [
    { value: "openai", label: "GPT-4o" },
    { value: "gemini", label: "Gemini (Latest)" }
  ];

  const handleChange = (e) => {
    setSelectedModel(e.target.value);
    console.log(`Selected AI model: ${e.target.value}`);
  };

  return (
    <div className="nav-mode-container">
      <label htmlFor="model-select" className="nav-mode-label">
        AI Model:
      </label>
      <select
        id="model-select"
        className="nav-mode-select"
        value={selectedModel}
        onChange={handleChange}
      >
        {models.map((model) => (
          <option key={model.value} value={model.value}>
            {model.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default NavModeButton;