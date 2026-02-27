import React, { useState, useEffect } from 'react';
import LiveTable from '../components/LiveTable';
import RescueVerify from '../components/RescueVerify';

const Dashboard = ({ alerts, refreshData }) => {
    const [selectedVictim, setSelectedVictim] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    // Simulate Edge AI Visual Triage
    const simulateVisualTriage = async () => {
        setIsScanning(true);
        // Simulating 2 seconds of Edge AI processing (counting people/detecting injuries)
        setTimeout(async () => {
            console.log("Edge AI: Cluster detected. 5+ victims identified. Escalating Priority.");
            
            // Trigger a backend update to simulate real-time cluster risk increase
            await fetch('http://localhost:5000/api/trigger-cluster-escalation', { method: 'POST' });
            
            refreshData();
            setIsScanning(false);
            alert("Visual Triage Complete: Cluster Risk Factor applied to local zone.");
        }, 2000);
    };

    return (
        <div className="dashboard-container">
            <header className="command-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>📍 OPERATIONAL COMMAND MAP</h2>
                <button 
                    className="btn-triage" 
                    onClick={simulateVisualTriage}
                    style={{ background: 'var(--neon-blue)', color: '#000', fontWeight: 'bold' }}
                >
                    {isScanning ? "⌛ ANALYZING SCENE..." : "📸 CAMERA VISUAL TRIAGE"}
                </button>
            </header>

            <div className="main-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                {/* 1. Live Intelligence Feed */}
                <LiveTable alerts={alerts} onSelectVictim={setSelectedVictim} />

                {/* 2. Active Verification Panel (Triple-Tier Logic) */}
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
                        <div className="empty-state">
                            <p>Select a high-priority signal from the table to begin aid verification.</p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;