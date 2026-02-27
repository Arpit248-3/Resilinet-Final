import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import LiveTable from '../components/LiveTable';
import { API_CLEAR } from '../constants';
import 'leaflet/dist/leaflet.css';

// FIX: Leaflet marker icon loading issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Blinking Pulse Icon for High Priority
const createPulseIcon = (priority) => {
  const color = priority >= 3 ? '#ff3e3e' : '#2196f3';
  return L.divIcon({
    html: `<div class="pulse-marker" style="background-color: ${color}; box-shadow: 0 0 0 rgba(${priority >= 3 ? '255,62,62' : '33,150,243'}, 0.4);"></div>`,
    className: 'custom-div-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const Dashboard = ({ alerts, refreshData }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h2 style={{ color: '#00f2ff' }}>📍 STRATEGIC COMMAND MAP</h2>
        <button 
          onClick={async () => { if(window.confirm("Wipe DB?")) { await fetch(API_CLEAR, {method:'DELETE'}); refreshData(); }}} 
          className="btn-clear"
        >
          CLEAR ALL SIGNALS
        </button>
      </div>

      <div style={{ flex: 1, minHeight: '400px', border: '1px solid #2d2d35', borderRadius: '12px', overflow: 'hidden' }}>
        <MapContainer center={[20.59, 78.96]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {alerts.map((a, i) => (
            <Marker 
              key={i} 
              position={[a.location.latitude, a.location.longitude]}
              icon={createPulseIcon(a.priority)}
            >
              <Popup>
                <strong>{a.category}</strong><br/>
                User: {a.userId} <br/>
                Priority: Level {a.priority}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Improved alignment for the table section */}
      <div style={{ marginTop: '20px' }}>
        <LiveTable alerts={alerts} />
      </div>
    </div>
  );
};

export default Dashboard;