import React from 'react';

const LiveTable = ({ alerts, onSelectVictim }) => {
  // 1. Safety Guard: If alerts is not an array, convert it to one or fallback
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  return (
    <div className="live-table-container" style={{ marginTop: '20px', height: '400px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <div style={{ padding: '15px', borderBottom: '1px solid #2d2d35', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="live-dot" style={{ height: '8px', width: '8px', background: '#4dff88', borderRadius: '50%', marginRight: '10px', display: 'inline-block', boxShadow: '0 0 8px #4dff88' }}></span>
          <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '1px', color: 'var(--text-main)' }}>LIVE INTELLIGENCE FEED</h3>
        </div>
        <span style={{ fontSize: '10px', color: '#64748b' }}>{safeAlerts.length} SIGNALS DETECTED</span>
      </div>

      <div style={{ overflowY: 'auto', height: 'calc(100% - 50px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#1c1c21', color: '#64748b', zIndex: 10 }}>
            <tr>
              <th style={{ padding: '12px' }}>TIME</th>
              <th style={{ padding: '12px' }}>USER ID</th>
              <th style={{ padding: '12px' }}>SEVERITY</th>
              <th style={{ padding: '12px' }}>PRIORITY SCORE</th>
              <th style={{ padding: '12px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {safeAlerts.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#444' }}>
                   📡 Scanning mesh network for active SOS signals...
                </td>
              </tr>
            ) : (
              safeAlerts.map((alert) => (
                <tr 
                  key={alert._id} 
                  onClick={() => onSelectVictim(alert)}
                  className="table-row-hover"
                  style={{ 
                    borderBottom: '1px solid #24242b', 
                    cursor: 'pointer',
                    transition: 'background 0.2s' 
                  }}
                >
                  <td style={{ padding: '12px', color: '#94a3b8' }}>
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td style={{ padding: '12px', fontWeight: '500', color: 'var(--text-main)' }}>
                    {alert.userId}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: alert.severity === 'Critical' ? 'rgba(255, 62, 62, 0.1)' : 'rgba(255, 170, 0, 0.1)', 
                      color: alert.severity === 'Critical' ? '#ff3e3e' : '#ffaa00',
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      fontSize: '11px',
                      border: `1px solid ${alert.severity === 'Critical' ? '#ff3e3e' : '#ffaa00'}`
                    }}>
                      {alert.severity || 'Minor'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      color: alert.priorityScore > 25 ? '#4dff88' : '#94a3b8',
                      fontWeight: 'bold',
                      fontSize: '15px'
                    }}>
                      {alert.priorityScore ? alert.priorityScore.toFixed(1) : "Calculating..."}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button style={{ 
                      background: 'transparent', 
                      border: '1px solid var(--neon-blue)', 
                      color: 'var(--neon-blue)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}>
                      VERIFY AID
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveTable;