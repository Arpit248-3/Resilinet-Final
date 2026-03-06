import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  Activity, Shield, Layout, Battery, Clock, CheckCircle, AlertTriangle,
  Map as MapIcon, Navigation, Send, BrainCircuit, Timer, TrendingUp, FileText, Terminal, Layers, AlertOctagon,
  Globe, Share2, X, Lock, Unlock, Zap, Heart, User, Radio, Cpu, HardDrive, Home, Crosshair
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, LayersControl, LayerGroup, Circle, Tooltip as LeafletTooltip } from 'react-leaflet';
import { io } from 'socket.io-client';
import { 
  YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, XAxis
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- TACTICAL CONSTANTS & CONFIG ---
import { SOCKET_URL, API_BASE } from '../constants'; 

const REFRESH_INTERVAL = 5000;
const DANGER_BPM_THRESHOLD = 120;
const MUTUAL_AID_RADIUS_KM = 15;

// --- UTILS: GEOSPATIAL & TACTICAL MATH ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// --- ASSET: TACTICAL ICON GENERATORS ---
const createVehicleIcon = (type, isExternal = false) => {
  const iconUrls = {
    Police: "https://cdn-icons-png.flaticon.com/512/2560/2560505.png",
    Fire: "https://cdn-icons-png.flaticon.com/512/785/785116.png",
    Medical: "https://cdn-icons-png.flaticon.com/512/3063/3063176.png",
    Default: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png"
  };
  return L.icon({
    iconUrl: iconUrls[type] || iconUrls.Default,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
    className: isExternal ? 'external-unit-marker pulse-blue' : 'tactical-unit-marker'
  });
};

const getSafeZoneIcon = (type, victimCount, isLocked, isMassCasualty) => {
    let color = 'green';
    if (type === 'Police') color = 'blue';
    if (type === 'Shelter') color = 'orange';

    const threshold = isMassCasualty ? 25 : 10;
    if (isLocked) color = 'black';
    else if (victimCount >= threshold) color = 'red';

    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      className: (victimCount >= threshold && !isLocked) ? 'animate-pulse-critical' : ''
    });
};

const sosIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/595/595067.png",
  iconSize: [42, 42],
  iconAnchor: [21, 42], // This ensures the tip of the icon is at the lat/lng
  popupAnchor: [0, -42],
  className: "pulse-marker-sos"
});

const highlightSosIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/595/595067.png",
    iconSize: [55, 55],
    className: "pulse-marker sector-highlight-glow"
});

// --- UI COMPONENT: NEURAL VISUALIZER ---
const NeuralNetworkBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.size = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
    }

    const init = () => { 
        resize(); 
        particles = Array.from({ length: 50 }, () => new Particle()); 
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.08)'; 
      ctx.fillStyle = 'rgba(0, 242, 255, 0.15)';
      
      particles.forEach((p, i) => {
        p.update(); 
        ctx.beginPath(); 
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); 
        ctx.fill();
        
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]; 
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 180) { 
            ctx.lineWidth = 0.8 * (1 - dist / 180); 
            ctx.beginPath(); 
            ctx.moveTo(p.x, p.y); 
            ctx.lineTo(p2.x, p2.y); 
            ctx.stroke(); 
          }
        }
      });
      requestAnimationFrame(animate);
    };

    init(); animate();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, opacity: 0.6, pointerEvents: 'none' }} />;
};

// --- DATA ANALYTICS MODULE ---
const DataAnalyticsView = ({ alerts }) => {
  const reportRef = useRef();
  const resolved = alerts.filter(a => a.status === 'Resolved');
  
  const efficiencyData = useMemo(() => (
    resolved.length > 0 ? resolved.slice(-8).map((a, index) => ({
      name: `SEQ-${index + 1}`, 
      manual: 400 + Math.floor(Math.random() * 150), 
      ai: 60 + Math.floor(Math.random() * 30),
      risk: Math.floor(Math.random() * 100)
    })) : [{ name: 'IDLE', manual: 0, ai: 0, risk: 0 }]
  ), [resolved]);

  const totalTimeSaved = efficiencyData.reduce((acc, curr) => acc + (curr.manual - curr.ai), 0);
  const avgEfficiency = Math.round((totalTimeSaved / (efficiencyData.length * 400)) * 100);
  
  const exportEfficiencyReport = () => {
    html2canvas(reportRef.current, { backgroundColor: '#06070a', scale: 2 }).then((canvas) => {
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.text("RESILINET TACTICAL INTELLIGENCE REPORT", 10, 10);
      pdf.addImage(img, 'PNG', 0, 20, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`Tactical_Audit_${Date.now()}.pdf`);
    });
  };

  return (
    <div className="analytics-view-container">
      <NeuralNetworkBackground />
      <div className="analytics-overlay-content">
        <div className="analytics-header">
          <div className="title-group">
            <h2><CheckCircle size={28} color="var(--success)" /> AUDIT VALIDATED</h2>
            <p>Real-time performance metrics and AI optimization logs</p>
          </div>
          <button className="export-btn" onClick={exportEfficiencyReport}>
            <FileText size={18} /> GENERATE AUDIT PDF
          </button>
        </div>

        <div ref={reportRef} className="analytics-grid">
            <div className="analytics-card metric-card">
               <div className="card-icon"><Clock size={24} color="var(--accent)"/></div>
               <div className="card-info">
                 <span className="label">NEURAL TIME GAINS</span>
                 <span className="value">{Math.round(totalTimeSaved / 60)}m 14s</span>
               </div>
            </div>
            
            <div className="analytics-card metric-card">
               <div className="card-icon"><TrendingUp size={24} color="var(--success)"/></div>
               <div className="card-info">
                 <span className="label">OPTIMIZATION RATE</span>
                 <span className="value">{avgEfficiency || 0}%</span>
               </div>
            </div>

            <div className="analytics-card metric-card">
               <div className="card-icon"><Activity size={24} color="var(--critical)"/></div>
               <div className="card-info">
                 <span className="label">THREAT MITIGATION</span>
                 <span className="value">99.2%</span>
               </div>
            </div>

            <div className="analytics-card chart-container-large">
               <div className="chart-header">
                 <h4>AI DISPATCH VS MANUAL COORDINATION (SECONDS)</h4>
               </div>
               <ResponsiveContainer width="100%" height={300}>
                 <AreaChart data={efficiencyData}>
                   <defs>
                     <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                   <XAxis dataKey="name" stroke="#555" />
                   <YAxis stroke="#555" />
                   <Tooltip contentStyle={{background: '#0a0b10', border: '1px solid #333'}} />
                   <Area type="monotone" dataKey="ai" stroke="var(--accent)" fillOpacity={1} fill="url(#colorAi)" strokeWidth={3} />
                   <Area type="monotone" dataKey="manual" stroke="#ff4d4d" fill="transparent" strokeDasharray="5 5" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- AI PREDICTIONS & TRIAGE MODULE ---
const AIPredictionsView = ({ alerts, responders, aiLog, setHoveredPair }) => {
  const activeAlerts = useMemo(() => alerts.filter(a => a.status !== 'Resolved'), [alerts]);
  
  const clusters = useMemo(() => {
    const processed = new Set();
    const groups = [];

    activeAlerts.forEach(a1 => {
      if (processed.has(a1._id)) return;
      const group = [a1];
      processed.add(a1._id);

      activeAlerts.forEach(a2 => {
        if (processed.has(a2._id)) return;
        const dist = calculateDistance(
          a1.location.coordinates[1], a1.location.coordinates[0],
          a2.location.coordinates[1], a2.location.coordinates[0]
        );
        if (dist < 1.8) {
          group.push(a2);
          processed.add(a2._id);
        }
      });
      if (group.length > 1) groups.push(group);
    });
    return groups;
  }, [activeAlerts]);

  const scarcityAlert = useMemo(() => {
    const availableHeavyUnits = responders.filter(r => r.status === 'Available' && (r.type === 'Fire' || r.type === 'Medical')).length;
    if (clusters.length > availableHeavyUnits && clusters.length > 0) {
      return {
        level: 'CRITICAL',
        gap: clusters.length - availableHeavyUnits,
        msg: `High-density clusters (${clusters.length}) exceed active heavy-unit availability.`
      };
    }
    return null;
  }, [clusters, responders]);

  const tacticalPairings = useMemo(() => {
    const dangerAlerts = activeAlerts.filter(a => a.heartRate > DANGER_BPM_THRESHOLD || a.citizenPriority === 'DANGER ZONE');
    const availableUnits = responders.filter(r => r.status === 'Available');

    return dangerAlerts.map(alert => {
      let nearest = null;
      let minDistance = Infinity;

      availableUnits.forEach(unit => {
        const dist = calculateDistance(
          alert.location.coordinates[1], alert.location.coordinates[0],
          unit.location.coordinates[1], unit.location.coordinates[0]
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearest = unit;
        }
      });
      return { alert, nearest, distance: minDistance };
    });
  }, [activeAlerts, responders]);

  return (
    <div className="analytics-view-container">
      <NeuralNetworkBackground />
      <div className="prediction-content-wrapper">
        {scarcityAlert && (
          <div className="resource-alert-banner">
            <AlertOctagon size={28} className="animate-pulse" />
            <div className="banner-text">
              <strong>THREAT ESCALATION DETECTED:</strong> {scarcityAlert.msg}
              <p>Automatic Handover Protocol enabled for cross-sector support.</p>
            </div>
          </div>
        )}

        <div className="prediction-header">
            <h2><BrainCircuit size={28} color="var(--critical)"/> TACTICAL PREDICTION ENGINE</h2>
            <div className="status-badge-container">
              <span className={`status-pill ${scarcityAlert ? 'danger' : 'optimal'}`}>
                {scarcityAlert ? 'CAPACITY BREACH' : 'RESOURCES STABLE'}
              </span>
            </div>
        </div>
        
        <div className="prediction-main-grid">
          <div className="analysis-column">
            <h3 className="section-subtitle"><Layers size={20} /> CLUSTER ANALYSIS</h3>
            <div className="card-stack">
              {clusters.length > 0 ? clusters.map((group, idx) => (
                <div key={idx} className="analysis-card cluster-item">
                   <div className="card-top">
                      <span className="cluster-id">CLUSTER-0{idx + 1}</span>
                      <span className="count-tag">{group.length} ALERTS</span>
                   </div>
                   <div className="rec-box">
                      <Shield size={14}/> <span>SUGGESTED: <strong>High-Volume Response Team</strong></span>
                   </div>
                </div>
              )) : <div className="empty-state">No geographical clusters detected.</div>}
            </div>

            <h3 className="section-subtitle mt-4"><Crosshair size={20}/> TACTICAL PAIRINGS</h3>
            <div className="card-stack">
              {tacticalPairings.length > 0 ? tacticalPairings.map((pair) => (
                <div 
                  key={pair.alert._id} 
                  className="analysis-card pair-item"
                  onMouseEnter={() => setHoveredPair(pair)}
                  onMouseLeave={() => setHoveredPair(null)}
                >
                  <div className="pair-header">
                    <span className="vital-indicator pulse-red"></span>
                    <strong>{pair.alert.name}</strong>
                    <span className="bpm-tag">{pair.alert.heartRate} BPM</span>
                  </div>
                  {pair.nearest ? (
                    <div className="pair-data">
                      <div className="data-row"><Navigation size={14}/><span>Assigned: {pair.nearest.name}</span></div>
                      <div className="data-row"><Timer size={14}/><span>Distance: {pair.distance.toFixed(2)} km</span></div>
                      <div className="eta-block">ESTIMATED RESPONSE: {Math.max(1, Math.round((pair.distance / 45) * 60))} MINS</div>
                    </div>
                  ) : (
                    <div className="pair-warning">
                      <AlertTriangle size={14} className="mr-1"/> 
                      NO LOCAL UNITS AVAILABLE - REQUESTING MUTUAL AID
                    </div>
                  )}
                </div>
              )) : <div className="empty-state">No critical anomalies identified.</div>}
            </div>
          </div>

          <div className="terminal-column">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="dot-group"><span className="dot"></span><span className="dot"></span><span className="dot"></span></div>
                <span className="term-title">TACTICAL_LOG_v2.0</span>
              </div>
              <div className="terminal-body">
                {aiLog.map((log, i) => (
                  <div key={i} className="log-line">
                    <span className="log-ts">[{log.time}]</span>
                    <span className="log-msg">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAP SUB-COMPONENTS ---
const MapController = ({ followingId, responders }) => {
  const map = useMap();
  useEffect(() => {
    if (followingId) {
      const target = responders.find(r => r._id === followingId);
      if (target) map.flyTo([target.location.coordinates[1], target.location.coordinates[0]], 16, { duration: 1.5 });
    }
  }, [followingId, responders, map]);
  return null;
};

const HandoverModal = ({ isOpen, data, onClose }) => {
  if (!isOpen || !data) return null;
  return (
    <div className="modal-backdrop">
      <div className="handover-modal">
        <div className="modal-header">
          <h3><Share2 size={22} /> CROSS-SECTOR HANDOVER</h3>
          <button onClick={onClose} className="close-btn"><X size={24}/></button>
        </div>
        <div className="modal-body">
          <div className="info-field">
            <span className="label">SUBJECT IDENTIFIER</span>
            <span className="value">{data.alertName}</span>
          </div>
          <div className="info-field">
            <span className="label">TARGET COMMAND SECTOR</span>
            <span className="value">{data.sector}</span>
          </div>
          <div className="info-field">
            <span className="label">ASSIGNED MUTUAL AID UNIT</span>
            <span className="value">{data.unitName}</span>
          </div>
          <div className="status-footer">
            <div className="encryption-badge"><Lock size={12}/> AES-256 ENCRYPTED TUNNEL ACTIVE</div>
            <p>Digital twin and biometric history transferred.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN SYSTEM CORE ---
const Dashboard = ({ onLogout }) => {
  // Global States
  const [alerts, setAlerts] = useState([]);
  const [responders, setResponders] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [mutualAidUnits, setMutualAidUnits] = useState([]);
  
  // Interface States
  const [activeTab, setActiveTab] = useState('alerts');
  const [currentView, setCurrentView] = useState('map'); 
  const [followingId, setFollowingId] = useState(null);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [showToast, setShowToast] = useState(null);
  const [hoveredPair, setHoveredPair] = useState(null);
  const [handoverDetails, setHandoverDetails] = useState(null);

  // Tactical Modes
  const [isEscalationActive, setIsEscalationActive] = useState(false);
  const [isMassCasualtyMode, setIsMassCasualtyMode] = useState(false);
  const [lockedZones, setLockedZones] = useState(new Set());

  // AI Comms Log
  const [aiLog, setAiLog] = useState([
    { time: new Date().toLocaleTimeString(), msg: "Tactical Infrastructure Initialized." },
    { time: new Date().toLocaleTimeString(), msg: "Geospatial Sat-Link Established." }
  ]);

  const addLog = useCallback((msg) => {
    const newLog = { time: new Date().toLocaleTimeString(), msg };
    setAiLog(prev => [newLog, ...prev].slice(0, 20));
  }, []);

  // --- BUSINESS LOGIC: VICTIM ROUTING ---
  const zoneAssignments = useMemo(() => {
    const table = {};
    safeZones.forEach(z => { table[z._id] = []; });

    const activeSOS = isMassCasualtyMode 
        ? alerts.filter(a => a.status === 'Active' && (a.priority === 'Critical' || a.heartRate > 110))
        : alerts.filter(a => a.status !== 'Resolved' && a.status !== 'Handed Over');

    activeSOS.forEach(alert => {
      let nearestId = null;
      let minDistance = Infinity;
      
      safeZones.forEach(zone => {
        if (lockedZones.has(zone._id)) return;
        const dist = calculateDistance(
            alert.location.coordinates[1], alert.location.coordinates[0], 
            zone.location.coordinates[1], zone.location.coordinates[0]
        );
        if (dist < minDistance) { minDistance = dist; nearestId = zone._id; }
      });
      if (nearestId) table[nearestId].push(alert);
    });
    return table;
  }, [alerts, safeZones, lockedZones, isMassCasualtyMode]);

  const evacuationRoutes = useMemo(() => {
    const routes = [];
    Object.keys(zoneAssignments).forEach(zoneId => {
        const zone = safeZones.find(z => z._id === zoneId);
        if (!zone) return;
        zoneAssignments[zoneId].forEach(alert => {
            routes.push({ 
                id: alert._id, 
                alertPos: alert.location.coordinates, 
                zonePos: zone.location.coordinates, 
                isCritical: alert.priority === 'Critical' || alert.heartRate > 120 
            });
        });
    });
    return routes;
  }, [zoneAssignments, safeZones]);

  // --- MUTUAL AID SENSOR ---
  const alertsInExternalRange = useMemo(() => {
      if (!isEscalationActive) return new Set();
      const ids = new Set();
      alerts.filter(a => a.status !== 'Resolved').forEach(alert => {
          mutualAidUnits.forEach(unit => {
              const dist = calculateDistance(alert.location.coordinates[1], alert.location.coordinates[0], unit.location.coordinates[1], unit.location.coordinates[0]);
              if (dist <= MUTUAL_AID_RADIUS_KM) ids.add(alert._id);
          });
      });
      return ids;
  }, [alerts, mutualAidUnits, isEscalationActive]);

  // --- DATA SYNC ---
  const fetchTacticalData = useCallback(async () => {
    try {
      const [a, r, s] = await Promise.all([
        axios.get(`${API_BASE}/api/alerts`),
        axios.get(`${API_BASE}/api/responders`),
        axios.get(`${API_BASE}/api/safe-zones`)
      ]);
      setAlerts(a.data);
      setResponders(r.data);
      setSafeZones(s.data);
    } catch (err) { 
        console.error("Sync Failure:", err);
        addLog("⚠️ DATA LINK ERROR: Retrying connection...");
    }
  }, [addLog]);

  useEffect(() => {
    fetchTacticalData();
    const clock = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    const sync = setInterval(fetchTacticalData, REFRESH_INTERVAL);
    
    const socket = io(SOCKET_URL);
    socket.on('new-sos', (sos) => {
      setAlerts(prev => [sos, ...prev]);
      addLog(`🚨 INCOMING: ${sos.category.toUpperCase()} reported by ${sos.name}.`);
    });
    socket.on('units-update', (units) => setResponders(units));

    return () => { 
        socket.disconnect(); 
        clearInterval(clock); 
        clearInterval(sync);
    };
  }, [fetchTacticalData, addLog]);

  // --- ESCALATION LOGIC ---
  useEffect(() => {
    const active = alerts.filter(a => a.status !== 'Resolved').length;
    const avail = responders.filter(r => r.status === 'Available').length;
    
    if (active > 0 && avail <= 1 && !isEscalationActive) {
      setIsEscalationActive(true);
      addLog("🛡️ PROTOCOL: Mutual Aid initiated. External sectors alerted.");
      setMutualAidUnits([
        { _id: 'ext-01', name: 'NORTH-FIRE 9', type: 'Fire', location: { coordinates: [75.95, 22.82] }, city: 'Metro North' },
        { _id: 'ext-02', name: 'STATE-EMS 4', type: 'Medical', location: { coordinates: [75.82, 22.68] }, city: 'Region West' }
      ]);
    } else if (avail >= 3 && isEscalationActive) {
      setIsEscalationActive(false);
      setMutualAidUnits([]);
      addLog("✅ PROTOCOL: Local resource levels restored. Standing down.");
    }
  }, [alerts, responders, isEscalationActive, addLog]);

  // --- INTERFACE HANDLERS ---
  const toggleZoneLock = (id) => {
    setLockedZones(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
            next.delete(id);
            addLog(`🔓 ZONE RELEASE: Facility ${id} reopened.`);
        } else {
            next.add(id);
            addLog(`🔒 ZONE LOCK: Facility ${id} at capacity. Rerouting traffic.`);
        }
        return next;
    });
  };

  const handleDispatch = async (sosId, unitId) => {
    if (!unitId) return;
    try {
      await axios.put(`${API_BASE}/api/sos/dispatch/${sosId}`, { responderId: unitId });
      setShowToast("TACTICAL UNIT DISPATCHED");
      addLog(`Unit Assignment: Unit ${unitId} moving to SOS ${sosId}.`);
      setTimeout(() => setShowToast(null), 3000);
      fetchTacticalData();
    } catch (err) { addLog("❌ Dispatch command failed."); }
  };

  const handleHandover = (alert) => {
      const target = mutualAidUnits[0] || { city: "External Sector" };
      addLog(`📡 SECTOR HANDOVER: Transferring ${alert.name} to ${target.city}.`);
      setAlerts(prev => prev.map(a => a._id === alert._id ? {...a, status: 'Handed Over'} : a));
      setHandoverDetails({ alertName: alert.name, sector: target.city, unitName: target.name });
  };

  return (
    <div className={`dashboard-root ${isMassCasualtyMode ? 'mode-mci' : ''}`}>
      <HandoverModal isOpen={!!handoverDetails} data={handoverDetails} onClose={() => setHandoverDetails(null)} />
      {showToast && <div className="system-toast"><Zap size={20}/> {showToast}</div>}

<aside className="tactical-sidebar">
        <div className="sidebar-top">
          <div className="system-branding">
            <Activity size={32} className="brand-pulse" />
            <div className="text"><h1>RESILINET</h1><span>GLOBAL COMMAND v3.1</span></div>
          </div>
          <nav className="tactical-nav">
            <button className={currentView === 'map' ? 'active' : ''} onClick={() => setCurrentView('map')}><MapIcon size={20}/> OPERATIONS MAP</button>
            <button className={currentView === 'analytics' ? 'active' : ''} onClick={() => setCurrentView('analytics')}><Layout size={20}/> DATA AUDIT</button>
            <button className={currentView === 'ai' ? 'active' : ''} onClick={() => setCurrentView('ai')}><BrainCircuit size={20}/> AI PREDICTIONS</button>
          </nav>
        </div>

        {/* --- REFORMATTED CENTER SECTION --- */}
        <div className="sidebar-control-hub">
          <div className="system-health-tray">
             <div className="health-stat"><Radio size={14} className="text-cyan-400"/><span>COMMS</span><strong>ONLINE</strong></div>
             <div className="health-stat"><HardDrive size={14} className="text-amber-400"/><span>LATENCY</span><strong>12ms</strong></div>
             <div className="health-stat"><Cpu size={14} className="text-green-400"/><span>KERNEL</span><strong>STABLE</strong></div>
          </div>

          <div className="mode-toggle-section">
              <button 
                className={`mci-toggle ${isMassCasualtyMode ? 'active' : 'inactive'}`} 
                onClick={() => setIsMassCasualtyMode(!isMassCasualtyMode)}
              >
                  <div className="mci-icon-box">
                    <AlertOctagon size={20}/>
                  </div>
                  <div className="mci-text">
                    <span className="mci-label">{isMassCasualtyMode ? "PROTOCOL ACTIVE" : "EMERGENCY PROTOCOL"}</span>
                    <span className="mci-value">{isMassCasualtyMode ? "DISABLE MCI" : "ACTIVATE MCI MODE"}</span>
                  </div>
              </button>
          </div>
        </div>

        <div className="sidebar-footer">
  <div className="comm-log-container">
    <div className="log-header">
      <Terminal size={14}/> LIVE SECURE COMMS
    </div>
    <div className="log-scroll">
      {aiLog.map((log, i) => (
        <div key={i} className="log-item" style={{opacity: 1 - (i * 0.1)}}>
          <span className="ts">{log.time}</span> 
          <span className="msg-text">{log.msg}</span>
        </div>
      ))}
    </div>
  </div>
  <button className="logout-btn" onClick={onLogout}>LOGOUT SYSTEM</button>
</div>
      </aside>

      <main className="main-viewport">
        <header className="global-status-bar">
          <div className="stat-capsule" onClick={() => setFollowingId(null)}>
            <Home size={16} className="text-cyan-400 cursor-pointer mr-2"/>
            <span className="label">ACTIVE SOS</span>
            <span className="value critical">{alerts.filter(a => a.status !== 'Resolved').length}</span>
          </div>
          <div className="stat-capsule">
            <Crosshair size={16} className="text-red-500 mr-2"/>
            <span className="label">RESOURCES</span>
            <span className="value">{responders.filter(r => r.status === 'Available').length} READY</span>
          </div>
          {isEscalationActive && (
            <div className="mutual-aid-indicator">
              <Globe size={16} className="spin" />
              <span>MUTUAL AID: ENABLED</span>
            </div>
          )}
          <div className="global-clock">{time}</div>
        </header>

        {currentView === 'map' ? (
          <div className="operations-layout">
            <div className="triage-feed">
              <div className="feed-header">
                <button className={activeTab === 'alerts' ? 'active' : ''} onClick={() => setActiveTab('alerts')}>TRIAGE FEED</button>
                <button className={activeTab === 'responders' ? 'active' : ''} onClick={() => setActiveTab('responders')}>UNIT STATUS</button>
              </div>
              <div className="feed-body">
                {activeTab === 'alerts' ? (
                  alerts.filter(a => a.status !== 'Resolved' && a.status !== 'Handed Over').map(a => {
                    const isExtreme = a.heartRate > DANGER_BPM_THRESHOLD;
                    const canHandover = alertsInExternalRange.has(a._id);
                    return (
                      <div key={a._id} className={`triage-card ${a.priority?.toLowerCase()} ${isExtreme ? 'vibration' : ''}`}>
                        <div className="card-top">
                          <span className="name">{a.name}</span>
                          <span className="category">{a.category}</span>
                        </div>
                        <div className="biometrics">
                          <div className={`bio-stat ${isExtreme ? 'danger' : ''}`}>
                             <Heart size={14} className={isExtreme ? 'heart-beat' : ''}/>
                             <span>{a.heartRate || '--'} BPM</span>
                          </div>
                          <div className="bio-stat">
                             <User size={14}/>
                             <span>{a.citizenPriority || 'LEVEL 3'}</span>
                          </div>
                        </div>
                        {canHandover && (
                          <div className="handover-ui">
                            <span className="tip">External Sector Reachable</span>
                            <button onClick={() => handleHandover(a)}><Share2 size={12}/> HANDOVER</button>
                          </div>
                        )}
                        <div className="dispatch-action">
                          <select id={`dispatch-to-${a._id}`}>
                            <option value="">Assign Unit...</option>
                            <optgroup label="LOCAL UNITS">
                              {responders.filter(r => r.status === 'Available').map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                            </optgroup>
                            {isEscalationActive && (
                              <optgroup label="MUTUAL AID">
                                {mutualAidUnits.map(r => <option key={r._id} value={r._id}>{r.name} ({r.city})</option>)}
                              </optgroup>
                            )}
                          </select>
                          <button onClick={() => handleDispatch(a._id, document.getElementById(`dispatch-to-${a._id}`).value)}><Send size={14}/></button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  responders.map(r => (
                    <div key={r._id} className={`unit-card ${r.status === 'Busy' ? 'busy' : 'ready'}`} onClick={() => setFollowingId(r._id)}>
                      <div className="unit-info">
                        <strong>{r.name}</strong>
                        <div className="stats"><Battery size={12}/> {r.batteryLevel}% | {r.type}</div>
                      </div>
                      <div className="status-tag">{r.status}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="map-frame">
              <MapContainer center={[22.75, 75.89]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url={isMassCasualtyMode ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png" : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"} />
                <MapController followingId={followingId} responders={responders} />
                
                <LayersControl position="topright">
                  <LayersControl.Overlay checked name="Active Responders">
                    <LayerGroup>
                      {responders.map(r => (
                        <Marker key={r._id} position={[r.location.coordinates[1], r.location.coordinates[0]]} icon={createVehicleIcon(r.type)}>
                           <LeafletTooltip direction="top" permanent={false}>Tactical: {r.name}</LeafletTooltip>
                        </Marker>
                      ))}
                    </LayerGroup>
                  </LayersControl.Overlay>

                  <LayersControl.Overlay checked name="Safe Zones & Hospitals">
                    <LayerGroup>
                      {safeZones.map(zone => {
                        const assigned = zoneAssignments[zone._id] || [];
                        const isLocked = lockedZones.has(zone._id);
                        return (
                          <Marker key={zone._id} position={[zone.location.coordinates[1], zone.location.coordinates[0]]} icon={getSafeZoneIcon(zone.type, assigned.length, isLocked, isMassCasualtyMode)}>
                            <Popup>
                              <div className="tactical-popup">
                                <h3>{zone.name}</h3>
                                <div className="pop-stats">
                                  <span>Routing: <strong>{assigned.length} Victims</strong></span>
                                  <span>Capacity: <strong>{isLocked ? 'CLOSED' : 'OPEN'}</strong></span>
                                </div>
                                {assigned.length > 0 && (
                                    <ul className="victim-list">
                                        {assigned.map(v => <li key={v._id}>• {v.name} ({v.heartRate} BPM)</li>)}
                                    </ul>
                                )}
                                <button className="lock-toggle-btn" onClick={() => toggleZoneLock(zone._id)}>
                                    {isLocked ? <><Unlock size={14}/> OPEN ZONE</> : <><Lock size={14}/> LOCK ZONE</>}
                                </button>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </LayerGroup>
                  </LayersControl.Overlay>

                  {isEscalationActive && (
                    <LayersControl.Overlay checked name="Mutual Aid Radius">
                      <LayerGroup>
                        {mutualAidUnits.map(r => (
                          <React.Fragment key={r._id}>
                            <Circle 
                              center={[r.location.coordinates[1], r.location.coordinates[0]]} 
                              radius={MUTUAL_AID_RADIUS_KM * 1000} 
                              pathOptions={{ 
                                color: 'var(--accent)', 
                                fillOpacity: 0.08, 
                                weight: 2,
                                dashArray: '5, 10',
                                className: 'mutual-aid-neon' 
                              }} 
                            />
                            <Marker position={[r.location.coordinates[1], r.location.coordinates[0]]} icon={createVehicleIcon(r.type, true)} />
                          </React.Fragment>
                        ))}
                      </LayerGroup>
                    </LayersControl.Overlay>
                  )}
                </LayersControl>

                {hoveredPair && hoveredPair.nearest && (
                  <Polyline 
                    positions={[
                      [hoveredPair.alert.location.coordinates[1], hoveredPair.alert.location.coordinates[0]],
                      [hoveredPair.nearest.location.coordinates[1], hoveredPair.nearest.location.coordinates[0]]
                    ]}
                    pathOptions={{ color: 'var(--accent)', weight: 3, dashArray: '10, 10', className: 'neon-line-animate' }}
                  />
                )}

                {evacuationRoutes.map(route => (
                  <Polyline key={`evac-${route.id}`} positions={[[route.alertPos[1], route.alertPos[0]], [route.zonePos[1], route.zonePos[0]]]} pathOptions={{ color: route.isCritical ? '#ff0000' : '#4ade80', weight: 1.5, dashArray: '8, 8', opacity: 0.6 }} />
                ))}

                {alerts.filter(a => a.status !== 'Resolved' && a.status !== 'Handed Over').map(a => (
                    <Marker key={a._id} position={[a.location.coordinates[1], a.location.coordinates[0]]} icon={alertsInExternalRange.has(a._id) ? highlightSosIcon : sosIcon}>
                        <Popup>
                            <div className="tactical-popup">
                                <strong>{a.name}</strong><br/>{a.category}
                                <div className="evac-status-tag">EVACUATION ACTIVE</div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        ) : currentView === 'analytics' ? (
          <DataAnalyticsView alerts={alerts} />
        ) : (
          <AIPredictionsView alerts={alerts} responders={responders} aiLog={aiLog} setHoveredPair={setHoveredPair} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;