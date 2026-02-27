import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { API_ALERTS, API_CLEAR } from '../constants';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CommandCenter = ({ onLogout }) => {
  const [alerts, setAlerts] = useState([]);

  const fetchData = async () => {
    try {
      const res = await fetch(API_ALERTS);
      const data = await res.json();
      setAlerts(data);
    } catch (err) { console.error("Fetch failed", err); }
  };

  const clearData = async () => {
    if (window.confirm("Clear all signals?")) {
      await fetch(API_CLEAR, { method: 'DELETE' });
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      <nav>
        <h2>ResiliNet Live Center</h2>
        <div>
          <button onClick={clearData} className="btn-red">Reset DB</button>
          <button onClick={onLogout}>Logout</button>
        </div>
      </nav>
      <MapContainer center={[20.59, 78.96]} zoom={5} style={{ height: '70vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {alerts.map((alert, idx) => (
          <Marker key={idx} position={[alert.location.latitude, alert.location.longitude]}>
            <Popup>{alert.category} from {alert.userId}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CommandCenter;