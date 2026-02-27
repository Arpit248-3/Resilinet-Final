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
  const [isTriageLoading, setIsTriageLoading] = useState(false);
  const prevAlertCount = useRef(0);

  const alertSound = useMemo(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'), []);

  const fetchData = useCallback(async () => {
    try {
      // FIXED: Used API_ALERTS constant here to resolve the error
      const res = await fetch(API_ALERTS);
      const data = await res.json();
      
      if (data.length > prevAlertCount.current && prevAlertCount.current !== 0) {
        alertSound.play().catch(e => console.log("Audio play blocked."));
      }
      
      prevAlertCount.current = data.length;
      setAlerts(data);
      setLastUpdated(new Date());
    } catch (e) { 
      console.error("Connection Error to " + API_ALERTS); 
    }
  }, [alertSound]);

  const handleVisualTriage = async () => {
    setIsTriageLoading(true);
    try {
      // Assuming your constant is http://.../api/alerts, we reach the triage endpoint like this:
      const triageUrl = API_ALERTS.replace('/alerts', '/trigger-cluster-escalation');
      await fetch(triageUrl, { method: 'POST' });
      await fetchData(); 
    } catch (err) {
      console.error("Triage Failed", err);
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

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className={isDark ? 'app-container' : 'app-container light-theme'} style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000' }}>
      <Sidebar 
        setActiveTab={setActiveTab} 
        activeTab={activeTab} 
        onLogout={() => setIsLoggedIn(false)} 
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
      />
      
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', marginBottom: '10px', fontSize: '12px', fontFamily: 'monospace' }}>
          <span>NODE: MESH_SYNC_ACTIVE {isTriageLoading && " | 📡 ANALYZING CLUSTERS..."}</span>
          <span>LAST INTEL: {lastUpdated.toLocaleTimeString()}</span>
        </div>

        {activeTab === 'map' ? (
          <Dashboard 
            alerts={alerts} 
            refreshData={fetchData} 
            runVisualTriage={handleVisualTriage}
            isTriageLoading={isTriageLoading} 
          />
        ) : (
          <Analytics />
        )}
      </main>
    </div>
  );
}

export default App;