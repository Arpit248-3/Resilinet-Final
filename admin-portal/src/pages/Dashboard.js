import React, { useState } from 'react';
import LiveTable from '../components/LiveTable';
import RescueVerify from '../components/RescueVerify';
import MapComponent from '../components/MapComponent';

const Dashboard = ({ alerts, refreshData, runVisualTriage, isTriageLoading }) => {
    const [selectedVictim, setSelectedVictim] = useState(null);

    return (
        <div className="dashboard-container">
            <header className="command-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>📍 TACTICAL COMMAND MAP</h2>
                <button 
                    className="btn-triage" 
                    onClick={runVisualTriage}
                    disabled={isTriageLoading}
                    style={{ background: isTriageLoading ? '#333' : 'var(--neon-blue)', color: '#000' }}
                >
                    {isTriageLoading ? "⌛ ANALYZING..." : "📸 CAMERA VISUAL TRIAGE"}
                </button>
            </header>

            <div className="main-layout" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1.5fr 1fr', 
                gap: '20px',
                height: 'calc(100vh - 200px)' 
            }}>
                {/* Left: Feed */}
                <LiveTable alerts={alerts} onSelectVictim={setSelectedVictim} />

                {/* Center: Interactive Map */}
                <MapComponent alerts={alerts} onSelectVictim={setSelectedVictim} />

                {/* Right: Action Panel */}
                <aside className="action-panel">
                    {selectedVictim ? (
                        <RescueVerify 
                            victim={selectedVictim} 
                            onComplete={() => {
                                setSelectedVictim(null);
                                refreshData();
                            }} 
                        />
                    ) : (
                        <div className="empty-state">Select a signal to begin.</div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;