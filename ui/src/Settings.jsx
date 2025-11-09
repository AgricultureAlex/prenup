import React, { useState, useEffect } from 'react';
import MainLayout from './layout';
import './Settings.css';

function Settings() {
  // Load saved font from localStorage
  const loadFont = () => {
    try {
      const savedFont = localStorage.getItem('selectedFont');
      return savedFont || 'Inter, system-ui, sans-serif';
    } catch (error) {
      console.error('Error loading font:', error);
      return 'Inter, system-ui, sans-serif';
    }
  };

  // Load saved font size from localStorage
  const loadFontSize = () => {
    try {
      const savedSize = localStorage.getItem('selectedFontSize');
      return savedSize || '16';
    } catch (error) {
      console.error('Error loading font size:', error);
      return '16';
    }
  };

  const [selectedFont, setSelectedFont] = useState(loadFont);
  const [selectedFontSize, setSelectedFontSize] = useState(loadFontSize);

  // Available fonts
  const fonts = [
    { name: 'Inter', value: 'Inter, system-ui, sans-serif' },
    { name: 'Monospace', value: 'monospace' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
    { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Courier New', value: '"Courier New", Courier, monospace' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
    { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
    { name: 'Impact', value: 'Impact, sans-serif' },
    { name: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
    { name: 'Garamond', value: 'Garamond, serif' },
    { name: 'Bookman', value: '"Bookman Old Style", serif' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' },
    { name: 'Lucida Sans', value: '"Lucida Sans Unicode", "Lucida Grande", sans-serif' },
  ];

  // Apply font when it changes
  useEffect(() => {
    try {
      localStorage.setItem('selectedFont', selectedFont);
      document.documentElement.style.setProperty('--global-font', selectedFont);
    } catch (error) {
      console.error('Error saving font:', error);
    }
  }, [selectedFont]);

  // Apply font size when it changes
  useEffect(() => {
    try {
      localStorage.setItem('selectedFontSize', selectedFontSize);
      document.documentElement.style.setProperty('--global-font-size', `${selectedFontSize}px`);
    } catch (error) {
      console.error('Error saving font size:', error);
    }
  }, [selectedFontSize]);

  // Apply font and font size on mount
  useEffect(() => {
    document.documentElement.style.setProperty('--global-font', selectedFont);
    document.documentElement.style.setProperty('--global-font-size', `${selectedFontSize}px`);
  }, []);

  const handleFontChange = (e) => {
    setSelectedFont(e.target.value);
  };

  const handleFontSizeChange = (e) => {
    setSelectedFontSize(e.target.value);
  };

  return (
    <MainLayout>
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>
        
        <div className="settings-section">
          <h2 className="settings-section-title">Appearance</h2>
          
          <div className="setting-item">
            <label htmlFor="font-select" className="setting-label">
              Font Family
            </label>
            <select
              id="font-select"
              value={selectedFont}
              onChange={handleFontChange}
              className="font-select"
              style={{ fontFamily: selectedFont }}
            >
              {fonts.map((font) => (
                <option
                  key={font.value}
                  value={font.value}
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="font-size-slider" className="setting-label">
              Font Size: {selectedFontSize}px
            </label>
            <div className="font-size-control">
              <span className="font-size-label">A</span>
              <input
                id="font-size-slider"
                type="range"
                min="12"
                max="24"
                step="1"
                value={selectedFontSize}
                onChange={handleFontSizeChange}
                className="font-size-slider"
              />
              <span className="font-size-label large">A</span>
            </div>
          </div>

          <div className="font-preview">
            <h3>Preview</h3>
            <p style={{ fontFamily: selectedFont, fontSize: `${selectedFontSize}px` }}>
              The quick brown fox jumps over the lazy dog.
            </p>
            <p style={{ fontFamily: selectedFont, fontSize: `${selectedFontSize}px` }}>
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </p>
            <p style={{ fontFamily: selectedFont, fontSize: `${selectedFontSize}px` }}>
              abcdefghijklmnopqrstuvwxyz
            </p>
            <p style={{ fontFamily: selectedFont, fontSize: `${selectedFontSize}px` }}>
              0123456789 !@#$%^&*()
            </p>
          </div>
        </div>

        <div className="settings-info">
          <p>💡 Changes are saved automatically and apply across the entire website.</p>
        </div>
      </div>
    </MainLayout>
  );
}

export default Settings;