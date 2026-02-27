import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cpu, Flame, Map as MapIcon, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

// Fix for default Leaflet icon markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const HeatmapLayer = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || points.length === 0) return;
    
    // Safety check for heatmap coordinates
    const heatData = points
      .map(p => {
        const lat = p.location?.latitude || (p.location?.coordinates && p.location.coordinates[1]);
        const lng = p.location?.longitude || (p.location?.coordinates && p.location.coordinates[0]);
        return [lat, lng, p.priorityScore ? p.priorityScore / 3 : 0.5];
      })
      .filter(coord => typeof coord[0] === 'number' && typeof coord[1] === 'number');

    const heatLayer = L.heatLayer(heatData, {
      radius: 30, blur: 20, maxZoom: 10,
      gradient: { 0.2: 'blue', 0.4: 'cyan', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
    }).addTo(map);

    return () => { map.removeLayer(heatLayer); };
  }, [map, points]);
  return null;
};

const Dashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('http://172.16.14.31:5000/api/alerts');
      const activeAlerts = res.data.filter(a => a.status !== 'Resolved');
      setAlerts(activeAlerts.sort((a, b) => b.priorityScore - a.priorityScore));
    } catch (err) { console.error("Dashboard Fetch Error:", err); }
  };

  const resolveAlert = async (id) => {
    try {
      await axios.put(`http://172.16.14.31:5000/api/sos/resolve/${id}`);
      fetchAlerts();
    } catch (err) { alert("Error resolving alert"); }
  };

  // NEW: Clear All functionality
  const clearAllData = async () => {
    if (window.confirm("Are you sure you want to wipe all alert data? This cannot be undone.")) {
      try {
        await axios.delete('http://172.16.14.31:5000/api/danger/wipe-all');
        fetchAlerts();
        alert("Database cleared successfully.");
      } catch (err) {
        alert("Failed to clear database.");
      }
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapIcon size={20} color="#00ff41" /> 
            <h2 style={styles.headerTitle}>RESILINET HUB</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={clearAllData} 
              style={{...styles.iconBtn, backgroundColor: '#333'}}
              title="Clear Database"
            >
              <Trash2 size={18} color="#e63946" />
            </button>
            <button 
              onClick={() => setShowHeatmap(!showHeatmap)} 
              style={{...styles.iconBtn, backgroundColor: showHeatmap ? '#e63946' : '#333'}}
            >
              <Flame size={18} color="white" />
            </button>
          </div>
        </div>

        <div style={styles.feed}>
          {alerts.length === 0 ? (
            <p style={styles.emptyText}>No active emergencies detected.</p>
          ) : (
            alerts.map(alert => {
              const isHighPriority = alert.priorityScore >= 3;
              return (
                <div key={alert._id} style={{
                  ...styles.alertCard,
                  borderColor: isHighPriority ? '#00ff41' : '#e63946'
                }}>
                  <div style={styles.cardTop}>
                    <span style={styles.victimName}>{alert.name}</span>
                    {isHighPriority && <div style={styles.aiBadge}><Cpu size={12} /> AI VERIFIED</div>}
                  </div>
                  <p style={styles.categoryText}>{alert.category} Emergency</p>
                  <p style={styles.msgText}>"{alert.message}"</p>
                  {alert.ai_insight && (
                    <div style={styles.insightTag}>
                      <span style={styles.insightLabel}>AI Insight: {alert.ai_insight}</span>
                    </div>
                  )}
                  <button onClick={() => resolveAlert(alert._id)} style={styles.resolveBtn}>
                    DISPATCH & RESOLVE
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={styles.mapContainer}>
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {showHeatmap && <HeatmapLayer points={alerts} />}
          {alerts.map(alert => {
            // SAFE COORDINATE EXTRACTION
            const lat = alert.location?.latitude || (alert.location?.coordinates && alert.location.coordinates[1]);
            const lng = alert.location?.longitude || (alert.location?.coordinates && alert.location.coordinates[0]);

            // Skip rendering if coordinates are invalid
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;

            return (
              <Marker key={alert._id} position={[lat, lng]}>
                <Popup>
                  <div style={styles.popup}>
                    <h4 style={{margin: 0}}>{alert.name}</h4>
                    <p style={{margin: '5px 0'}}>{alert.category}</p>
                    <button onClick={() => resolveAlert(alert._id)}>Resolve</button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#000', overflow: 'hidden' },
  sidebar: { width: '400px', backgroundColor: '#0a0a0a', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#00ff41', margin: 0, fontSize: '1.2rem', letterSpacing: '1px' },
  iconBtn: { border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  feed: { flex: 1, padding: '15px', overflowY: 'auto' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: '50px' },
  alertCard: { background: '#111', borderLeft: '5px solid', padding: '15px', marginBottom: '15px', borderRadius: '4px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  victimName: { color: '#fff', fontWeight: 'bold', fontSize: '1rem' },
  aiBadge: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#00ff41', color: '#000', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '900' },
  categoryText: { color: '#aaa', fontSize: '0.8rem', margin: '5px 0' },
  msgText: { color: '#eee', fontSize: '0.9rem', fontStyle: 'italic', margin: '10px 0' },
  insightTag: { backgroundColor: '#003311', padding: '6px', borderRadius: '4px', marginBottom: '10px' },
  insightLabel: { color: '#00ff41', fontSize: '0.75rem', fontWeight: 'bold' },
  resolveBtn: { width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  mapContainer: { flex: 1, position: 'relative' },
  popup: { color: '#000', fontFamily: 'sans-serif' }
};

export default Dashboard;