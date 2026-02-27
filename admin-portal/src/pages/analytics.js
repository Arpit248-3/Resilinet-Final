import React from 'react';

const Analytics = ({ alerts }) => {
    // 1. Safety Guard: Ensure alerts is always an array
    const safeAlerts = Array.isArray(alerts) ? alerts : [];

    // 2. Safe Calculation for Severity Distribution
    const severityData = safeAlerts.reduce((acc, alert) => {
        const sev = alert.severity || 'Minor';
        acc[sev] = (acc[sev] || 0) + 1;
        return acc;
    }, {});

    // 3. Safe Calculation for Priority Average
    const avgPriority = safeAlerts.length 
        ? (safeAlerts.reduce((sum, a) => sum + (a.priorityScore || 0), 0) / safeAlerts.length).toFixed(1) 
        : 0;

    return (
        <div className="analytics-container">
            <h2 style={{ color: 'var(--neon-blue)', marginBottom: '20px' }}>📈 SYSTEM INTELLIGENCE ANALYTICS</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                {/* Stat Card 1 */}
                <div className="stat-card" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <small style={{ color: '#64748b' }}>TOTAL ACTIVE SIGNALS</small>
                    <h1 style={{ margin: '10px 0', color: '#fff' }}>{safeAlerts.length}</h1>
                </div>

                {/* Stat Card 2 */}
                <div className="stat-card" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <small style={{ color: '#64748b' }}>AVG CLUSTER PRIORITY</small>
                    <h1 style={{ margin: '10px 0', color: '#4dff88' }}>{avgPriority}</h1>
                </div>

                {/* Stat Card 3 */}
                <div className="stat-card" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <small style={{ color: '#64748b' }}>MESH RELIABILITY</small>
                    <h1 style={{ margin: '10px 0', color: 'var(--neon-blue)' }}>
                        {safeAlerts.filter(a => a.isMeshVerified).length} / {safeAlerts.length}
                    </h1>
                </div>
            </div>

            <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3>SEVERITY DISTRIBUTION</h3>
                {safeAlerts.length === 0 ? (
                    <p style={{ color: '#444' }}>No data available for visualization.</p>
                ) : (
                    <div style={{ marginTop: '20px' }}>
                        {Object.entries(severityData).map(([key, val]) => (
                            <div key={key} style={{ marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span>{key}</span>
                                    <span>{val} victims</span>
                                </div>
                                <div style={{ width: '100%', background: '#222', height: '10px', borderRadius: '5px' }}>
                                    <div style={{ 
                                        width: `${(val / safeAlerts.length) * 100}%`, 
                                        background: key === 'Critical' ? '#ff3e3e' : '#ffaa00', 
                                        height: '100%', 
                                        borderRadius: '5px',
                                        boxShadow: '0 0 10px rgba(255,255,255,0.1)'
                                    }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;