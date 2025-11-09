import React, { createContext, useState, useContext } from 'react';

const ModelContext = createContext();

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};

export const ModelProvider = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState('openai');

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  );
};