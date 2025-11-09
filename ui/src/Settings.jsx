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
  
  // Phone number and daily challenge settings
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return localStorage.getItem('phoneNumber') || '';
  });
  
  const [dailyChallengeEnabled, setDailyChallengeEnabled] = useState(() => {
    return localStorage.getItem('dailyChallengeEnabled') === 'true';
  });
  
  const [dailyChallengeTime, setDailyChallengeTime] = useState(() => {
    return localStorage.getItem('dailyChallengeTime') || '09:00';
  });
  
  const [sendTestLoading, setSendTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');

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
  
  // Save phone number to localStorage
  useEffect(() => {
    localStorage.setItem('phoneNumber', phoneNumber);
  }, [phoneNumber]);
  
  // Save daily challenge settings to localStorage
  useEffect(() => {
    localStorage.setItem('dailyChallengeEnabled', dailyChallengeEnabled.toString());
  }, [dailyChallengeEnabled]);
  
  useEffect(() => {
    localStorage.setItem('dailyChallengeTime', dailyChallengeTime);
  }, [dailyChallengeTime]);
  
  // Send test iMessage
  const sendTestMessage = async () => {
    if (!phoneNumber.trim()) {
      setTestMessage('⚠️ Please enter a phone number first');
      return;
    }
    
    setSendTestLoading(true);
    setTestMessage('');
    
    try {
      const response = await fetch('http://localhost:8000/send-test-imessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestMessage('✅ Test message sent! Check your iMessage.');
      } else {
        setTestMessage(`❌ Failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      setTestMessage('❌ Could not connect to server. Make sure backend is running.');
    } finally {
      setSendTestLoading(false);
    }
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

        <div className="settings-section">
          <h2 className="settings-section-title">Daily Challenges</h2>
          
          <div className="setting-item">
            <label htmlFor="phone-input" className="setting-label">
              Phone Number (for iMessage challenges)
            </label>
            <input
              id="phone-input"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="phone-input"
            />
            <button
              onClick={sendTestMessage}
              disabled={sendTestLoading || !phoneNumber.trim()}
              className="test-message-button"
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                cursor: phoneNumber.trim() ? 'pointer' : 'not-allowed',
                opacity: phoneNumber.trim() ? 1 : 0.5
              }}
            >
              {sendTestLoading ? '📤 Sending...' : '📱 Send Test Message'}
            </button>
            {testMessage && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: testMessage.includes('✅') ? '#4caf50' : '#f44336' }}>
                {testMessage}
              </p>
            )}
          </div>
          
          <div className="setting-item">
            <label className="setting-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={dailyChallengeEnabled}
                onChange={(e) => setDailyChallengeEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              Enable Daily Challenge
            </label>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              Get a bite-sized coding challenge sent to your iMessage every day
            </p>
          </div>
          
          {dailyChallengeEnabled && (
            <div className="setting-item">
              <label htmlFor="challenge-time" className="setting-label">
                Daily Challenge Time
              </label>
              <input
                id="challenge-time"
                type="time"
                value={dailyChallengeTime}
                onChange={(e) => setDailyChallengeTime(e.target.value)}
                className="time-input"
              />
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                You'll receive a new challenge at {dailyChallengeTime} every day
              </p>
            </div>
          )}
        </div>

        <div className="settings-info">
          <p>💡 Changes are saved automatically and apply across the entire website.</p>
        </div>
      </div>
    </MainLayout>
  );
}

export default Settings;