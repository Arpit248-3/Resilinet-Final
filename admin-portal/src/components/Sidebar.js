import React from 'react';

// Added isDark and toggleTheme to the props
const Sidebar = ({ setActiveTab, activeTab, onLogout, isDark, toggleTheme }) => {
  const tabs = [
    { id: 'map', label: '📍 Command Map' },
    { id: 'analytics', label: '📊 Data Analytics' }
  ];

  return (
    <div style={{ 
      width: '260px', 
      background: 'var(--sidebar-bg)', // Uses variable from App.css
      borderRight: '1px solid var(--border-color)', 
      color: 'var(--text-main)', 
      padding: '30px 20px', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      transition: 'all 0.3s ease' 
    }}>
      {/* Brand Header */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '20px', 
          color: 'var(--danger-neon)', 
          letterSpacing: '2px', 
          margin: 0,
          textShadow: isDark ? '0 0 10px rgba(255, 62, 62, 0.3)' : 'none'
        }}>
          RESILINET
        </h1>
        <small style={{ color: 'var(--text-dim)', fontWeight: 'bold' }}>v2.0 STABLE</small>
      </div>
      
      {/* Navigation Tabs */}
      <div style={{ flex: 1 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              width: '100%', 
              padding: '14px', 
              marginBottom: '12px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              textAlign: 'left',
              background: activeTab === tab.id ? 'rgba(0, 242, 255, 0.1)' : 'transparent', 
              color: activeTab === tab.id ? 'var(--accent-neon)' : 'var(--text-dim)', 
              border: activeTab === tab.id ? '1px solid var(--accent-neon)' : '1px solid transparent',
              fontWeight: 'bold', 
              transition: '0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- THEME TOGGLE BUTTON --- */}
      <button 
        onClick={toggleTheme}
        style={{
          background: 'var(--card-bg)',
          color: 'var(--text-main)',
          border: '1px solid var(--border-color)',
          padding: '12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginBottom: '15px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          transition: '0.3s'
        }}
      >
        {isDark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
      </button>
      
      {/* Session Termination */}
      <button 
        onClick={onLogout} 
        style={{ 
          background: 'transparent', 
          color: 'var(--danger-neon)', 
          border: '1px solid var(--danger-neon)', 
          padding: '12px', 
          borderRadius: '8px', 
          cursor: 'pointer', 
          fontWeight: 'bold',
          transition: '0.3s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--danger-neon)';
          e.currentTarget.style.color = 'white';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--danger-neon)';
        }}
      >
        TERMINATE SESSION
      </button>
    </div>
  );
};

export default Sidebar;