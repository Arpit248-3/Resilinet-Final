import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css'; 
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/analytics';
import { API_ALERTS } from './constants';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [alerts, setAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isDark, setIsDark] = useState(true); // State for theme switching
  const prevAlertCount = useRef(0);

  // useMemo ensures the audio object is only created once
  // Note: Browsers require one user interaction (like a click) before auto-playing audio
  const alertSound = useMemo(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'), []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API_ALERTS);
      const data = await res.json();
      
      // Check if new SOS signals arrived to trigger notification sound
      if (data.length > prevAlertCount.current && prevAlertCount.current !== 0) {
        alertSound.play().catch(e => console.log("Audio play blocked: Click anywhere on the dashboard once to enable sounds."));
      }
      
      prevAlertCount.current = data.length;
      setAlerts(data);
      setLastUpdated(new Date());
    } catch (e) { 
      console.error("Backend Connection Error: Verify your server is running and the IP in constants.js is correct."); 
    }
  }, [alertSound]);

  // Real-time polling: fetches data every 5 seconds
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchData]);

  // Handle User Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Toggle Theme Function passed to Sidebar
  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    // The className dynamic switch triggers the CSS variables in App.css
    <div className={isDark ? 'app-container' : 'app-container light-theme'} style={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* Sidebar now controls Navigation, Logout, and Theme Toggling */}
      <Sidebar 
        setActiveTab={setActiveTab} 
        activeTab={activeTab} 
        onLogout={handleLogout} 
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
      
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto', background: 'var(--bg-color)' }}>
        {/* Dynamic Status Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          color: 'var(--text-dim)', 
          marginBottom: '10px', 
          fontSize: '12px', 
          fontFamily: 'monospace' 
        }}>
          <span>SYSTEM STATUS: <b style={{color: '#4dff88'}}>ACTIVE_ENCRYPTED</b></span>
          <span>LAST SYNC: {lastUpdated.toLocaleTimeString()}</span>
        </div>

        {/* Tab Content Switching */}
        {activeTab === 'map' ? (
          <Dashboard alerts={alerts} refreshData={fetchData} />
        ) : (
          <Analytics alerts={alerts} />
        )}
      </main>
    </div>
  );
}

export default App;