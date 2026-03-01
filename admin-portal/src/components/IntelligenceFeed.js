import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './IntelligenceFeed.css'; // Assuming you have a CSS file for styling

const BACKEND_URL = 'http://172.16.14.31:5000';
const socket = io(BACKEND_URL);

export default function IntelligenceFeed() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial Fetch of Active Alerts
    useEffect(() => {
        fetch(`${BACKEND_URL}/api/alerts`)
            .then(res => res.json())
            .then(data => {
                setAlerts(data);
                setLoading(false);
            })
            .catch(err => console.error("Error fetching alerts:", err));
    }, []);

    // Real-time Socket Listeners
    useEffect(() => {
        socket.on('new-sos', (data) => {
            // Play alert sound if it's a critical emergency
            if (data.priority === 'CRITICAL') {
                playAlertSound();
            }
            // Add new SOS to the top of the list
            setAlerts(prev => [data, ...prev]);
        });

        socket.on('sos-resolved', (id) => {
            // Remove resolved incident from the feed
            setAlerts(prev => prev.filter(alert => alert._id !== id));
        });

        socket.on('database-wiped', () => {
            setAlerts([]);
        });

        return () => {
            socket.off('new-sos');
            socket.off('sos-resolved');
            socket.off('database-wiped');
        };
    }, []);

    const playAlertSound = () => {
        const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3'); 
        audio.play().catch(e => console.log("Audio play blocked by browser"));
    };

    const handleResolve = async (id) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/sos/resolve/${id}`, {
                method: 'PUT'
            });
            if (response.ok) {
                // The socket listener 'sos-resolved' will handle UI removal
                console.log("Incident resolved");
            }
        } catch (err) {
            alert("Failed to resolve incident");
        }
    };

    if (loading) return <div className="feed-loading">Connecting to ResiliNet Intelligence...</div>;

    return (
        <div className="intelligence-container">
            <header className="feed-header">
                <h1>LIVE INTELLIGENCE FEED</h1>
                <div className="status-badge">● SYSTEM LIVE</div>
            </header>

            <div className="alerts-list">
                {alerts.length === 0 ? (
                    <div className="no-alerts">No active emergencies detected.</div>
                ) : (
                    alerts.map((alert) => (
                        <div key={alert._id} className={`alert-card ${alert.priority === 'CRITICAL' ? 'critical-border' : ''}`}>
                            <div className="alert-main">
                                <div className="alert-type">
                                    <span className="priority-dot"></span>
                                    {alert.category} - {alert.priority}
                                </div>
                                <h2 className="victim-name">{alert.name}</h2>
                                <p className="ai-insight">{alert.ai_insight}</p>
                                <p className="location-text">📍 {alert.location.coordinates[1]}, {alert.location.coordinates[0]}</p>
                            </div>
                            
                            <div className="alert-actions">
                                <button className="dispatch-btn" onClick={() => window.open(`https://www.google.com/maps?q=${alert.location.coordinates[1]},${alert.location.coordinates[0]}`)}>
                                    DISPATCH UNIT
                                </button>
                                <button className="resolve-btn" onClick={() => handleResolve(alert._id)}>
                                    MARK RESOLVED
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}