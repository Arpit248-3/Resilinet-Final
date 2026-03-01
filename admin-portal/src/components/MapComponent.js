import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({ alerts, onSelectVictim }) => {
    // Move the conditional check inside useMemo or keep it stable
    const center = [12.9716, 77.5946];

    // AI Predictive Logic: Identify High-Risk Clusters
    const riskZones = useMemo(() => {
        const safeAlerts = Array.isArray(alerts) ? alerts : []; //
        const clusters = [];
        const threshold = 0.01; 

        safeAlerts.filter(a => a.status === 'Active').forEach(alert => {
            const [lng, lat] = alert.location.coordinates;
            let existing = clusters.find(c => 
                Math.abs(c.lat - lat) < threshold && Math.abs(c.lng - lng) < threshold
            );

            if (existing) {
                existing.intensity += 1;
            } else {
                clusters.push({ lat, lng, intensity: 1 });
            }
        });
        return clusters;
    }, [alerts]); // Dependency is now the 'alerts' prop directly

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', background: '#1a1a1a' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                
                {/* LAYER 1: Predictive Risk Zones */}
                {riskZones.map((zone, idx) => (
                    <Circle 
                        key={`zone-${idx}`}
                        center={[zone.lat, zone.lng]}
                        radius={500 + (zone.intensity * 200)}
                        pathOptions={{ fillColor: '#ff3e3e', fillOpacity: 0.15, color: 'transparent' }}
                    />
                ))}

                {/* LAYER 2: Live SOS Markers */}
                {(Array.isArray(alerts) ? alerts : []).map((alert) => (
                    <CircleMarker
                        key={alert._id}
                        center={[alert.location.coordinates[1], alert.location.coordinates[0]]}
                        radius={alert.status === 'Active' ? 10 : 8}
                        pathOptions={{
                            fillColor: alert.status === 'Active' ? '#ff3e3e' : '#4dff88',
                            color: '#fff',
                            weight: 1,
                            fillOpacity: 0.8
                        }}
                        eventHandlers={{ click: () => onSelectVictim(alert) }}
                    >
                        <Popup>
                            <div style={{ color: '#000' }}>
                                <strong>{alert.category}</strong><br/>
                                <button onClick={() => onSelectVictim(alert)}>Select Unit</button>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapComponent;