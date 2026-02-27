import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// This helper ensures the map centers when alerts change
function RecenterMap({ coords }) {
    const map = useMap();
    if (coords) map.setView(coords, 13);
    return null;
}

const MapComponent = ({ alerts, onSelectVictim }) => {
    const safeAlerts = Array.isArray(alerts) ? alerts : [];
    const center = [12.9716, 77.5946]; // Default: Bengaluru

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', background: '#1a1a1a' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                {safeAlerts.map((alert) => (
                    <CircleMarker
                        key={alert._id}
                        center={[alert.location.coordinates[1], alert.location.coordinates[0]]}
                        radius={alert.priorityScore > 25 ? 12 : 8}
                        pathOptions={{
                            fillColor: alert.priorityScore > 25 ? '#ff3e3e' : '#4dff88',
                            color: '#fff',
                            weight: 1,
                            fillOpacity: 0.8
                        }}
                        eventHandlers={{
                            click: () => onSelectVictim(alert),
                        }}
                    >
                        <Popup>
                            <div style={{ color: '#000' }}>
                                <strong>{alert.userId}</strong><br/>
                                Score: {alert.priorityScore?.toFixed(1)}<br/>
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