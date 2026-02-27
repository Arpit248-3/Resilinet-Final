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
  const [isDark, setIsDark] = useState(true);
  const [isTriageLoading, setIsTriageLoading] = useState(false); // Visual Triage State
  const prevAlertCount = useRef(0);

  const alertSound = useMemo(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'), []);

  // Centralized Fetch Data with Priority Intelligence support
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API_ALERTS);
      const data = await res.json();
      
      // Trigger sound if new SOS clusters are detected
      if (data.length > prevAlertCount.current && prevAlertCount.current !== 0) {
        alertSound.play().catch(e => console.log("Audio play blocked: Interaction required."));
      }
      
      prevAlertCount.current = data.length;
      setAlerts(data);
      setLastUpdated(new Date());
    } catch (e) { 
      console.error("Backend Connection Error: Check if server.js is running on Port 5000."); 
    }
  }, [alertSound]);

  // Global Visual Triage Handler: Simulates Edge AI Scanning
  const handleVisualTriage = async () => {
    setIsTriageLoading(true);
    try {
      // Calls the new escalation route we added to server.js
      const response = await fetch('http://localhost:5000/api/trigger-cluster-escalation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      // Re-fetch to update Priority Scores immediately
      await fetchData(); 
      alert("EDGE AI SUCCESS: " + data.message);
    } catch (err) {
      alert("Triage Sync Failed: Verify backend is reachable.");
    } finally {
      setIsTriageLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchData]);

  const handleLogout = () => setIsLoggedIn(false);
  const toggleTheme = () => setIsDark(prev => !prev);

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className={isDark ? 'app-container' : 'app-container light-theme'} style={{ display: 'flex', minHeight: '100vh' }}>
      
      <Sidebar 
        setActiveTab={setActiveTab} 
        activeTab={activeTab} 
        onLogout={handleLogout} 
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
      
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto', background: 'var(--bg-color)' }}>
        {/* System Intelligence Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          color: 'var(--text-dim)', 
          marginBottom: '10px', 
          fontSize: '12px', 
          fontFamily: 'monospace' 
        }}>
          <span>
            NODE STATUS: <b style={{color: '#4dff88'}}>MESH_SYNC_ACTIVE</b> 
            {isTriageLoading && <span style={{marginLeft: '15px', color: 'var(--neon-blue)'}}>📡 ANALYZING CLUSTERS...</span>}
          </span>
          <span>LAST INTEL UPDATE: {lastUpdated.toLocaleTimeString()}</span>
        </div>

        {/* Unified Dashboard with Triage Capability */}
        {activeTab === 'map' ? (
          <Dashboard 
            alerts={alerts} 
            refreshData={fetchData} 
            runVisualTriage={handleVisualTriage}
            isTriageLoading={isTriageLoading} 
          />
        ) : (
          <Analytics alerts={alerts} />
        )}
      </main>
    </div>
  );
}

export default App;