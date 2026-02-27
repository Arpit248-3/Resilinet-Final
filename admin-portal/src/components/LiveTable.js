import React from 'react';

const LiveTable = ({ alerts }) => {
  return (
    <div className="live-table-container" style={{ marginTop: '20px', height: '300px' }}>
      <div style={{ padding: '15px', borderBottom: '1px solid #2d2d35', display: 'flex', alignItems: 'center' }}>
        <span className="live-dot"></span>
        <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '1px' }}>LIVE INTELLIGENCE FEED</h3>
      </div>
      <div style={{ overflowY: 'auto', height: 'calc(100% - 50px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#1c1c21', color: '#64748b' }}>
            <tr>
              <th style={{ padding: '12px' }}>TIME</th>
              <th style={{ padding: '12px' }}>USER</th>
              <th style={{ padding: '12px' }}>CATEGORY</th>
              <th style={{ padding: '12px' }}>PRIORITY</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#444' }}>Waiting for signals...</td></tr>
            ) : (
              alerts.map((alert, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #24242b' }}>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>{new Date(alert.timestamp).toLocaleTimeString()}</td>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{alert.userId}</td>
                  <td style={{ padding: '12px' }}><span style={{ background: '#222', padding: '2px 8px', borderRadius: '4px' }}>{alert.category}</span></td>
                  <td style={{ padding: '12px' }}>
                    <span className={alert.priority >= 3 ? 'priority-high' : alert.priority === 2 ? 'priority-med' : 'priority-low'}>
                      Level {alert.priority || 1}
                    </span>
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