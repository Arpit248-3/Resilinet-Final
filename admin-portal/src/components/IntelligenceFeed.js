import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './IntelligenceFeed.css'; 

const BACKEND_URL = 'http://172.16.14.31:5000'; 
const socket = io(BACKEND_URL);

export default function IntelligenceFeed() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/api/alerts`);
                const data = await res.json();
                setAlerts(Array.isArray(data) ? data : []);
                setLoading(false);
            } catch (_err) { // Prefixed with _ to satisfy ESLint
                console.error("Connectivity issue with ResiliNet Hub");
                setLoading(false);
            }
        };
        fetchAlerts();
    }, []);

    useEffect(() => {
        socket.on('new-sos', (data) => {
            playAlertSound();
            setAlerts(prev => [data, ...prev]);
        });

        socket.on('sos-resolved', (id) => {
            setAlerts(prev => prev.map(alert => 
                alert._id === id ? { ...alert, status: 'Resolved' } : alert
            ));
        });

        socket.on('database-wiped', () => setAlerts([]));

        return () => {
            socket.off('new-sos');
            socket.off('sos-resolved');
            socket.off('database-wiped');
        };
    }, []);

    const activeAlerts = alerts.filter(a => a.status === 'Active');
    const riskLevel = activeAlerts.length > 5 ? 'CRITICAL' : activeAlerts.length > 2 ? 'ELEVATED' : 'STABLE';

    const playAlertSound = () => {
        const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3'); 
        audio.play().catch(() => {}); // Quietly catch browser block
    };

    const handleResolve = async (id) => {
        try {
            await fetch(`${BACKEND_URL}/api/sos/resolve/${id}`, { method: 'PUT' });
        } catch (_err) {
            alert("Failed to sync resolution with server.");
        }
    };

    if (loading) return <div className="feed-loading">📡 Synchronizing with ResiliNet Satellite Hub...</div>;

    return (
        <div className="intelligence-container">
            <header className="feed-header">
                <div className="title-section">
                    <h1>LIVE INTELLIGENCE FEED</h1>
                    <p>Real-time Emergency Monitoring System</p>
                </div>
                
                <div className={`predictive-status-bar ${riskLevel.toLowerCase()}`}>
                    <div className="status-info">
                        <span className="label">PREDICTIVE RISK LEVEL:</span>
                        <span className="value">{riskLevel}</span>
                    </div>
                    <div className="active-count">
                        {activeAlerts.length} Active Emergencies
                    </div>
                </div>

                <div className="status-badge">
                    <span className="live-pulse"></span> SYSTEM ONLINE
                </div>
            </header>

            <div className="alerts-list">
                {alerts.length === 0 ? (
                    <div className="no-alerts">✅ No active emergencies detected in your region.</div>
                ) : (
                    alerts.map((alert) => (
                        <div key={alert._id} className={`alert-card ${alert.status === 'Active' ? 'active-border' : 'resolved-border'}`}>
                            <div className="alert-main">
                                <div className="alert-meta">
                                    <span className={`status-pill ${alert.status.toLowerCase()}`}>{alert.status}</span>
                                    <span className="timestamp">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="alert-body">
                                    <h2 className="alert-category">{alert.category} EMERGENCY</h2>
                                    <h3 className="victim-info">{alert.name} | {alert.phone}</h3>
                                    <div className="ai-analysis-box">
                                        <div className="ai-tag">AI ANALYSIS</div>
                                        <p className="ai-insight">{alert.ai_insight}</p>
                                    </div>
                                    <p className="location-coordinates">
                                        📍 Coordinates: {alert.location?.coordinates[1]?.toFixed(4)}, {alert.location?.coordinates[0]?.toFixed(4)}
                                    </p>
                                </div>
                            </div>
                            <div className="alert-actions">
                                <button className="dispatch-btn" onClick={() => window.open(`https://www.google.com/maps?q=${alert.location.coordinates[1]},${alert.location.coordinates[0]}`)}>
                                    OPEN LIVE GPS
                                </button>
                                {alert.status === 'Active' && (
                                    <button className="resolve-btn" onClick={() => handleResolve(alert._id)}>MARK RESOLVED</button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}