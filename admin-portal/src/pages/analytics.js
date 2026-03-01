import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileText, Download, Send } from 'lucide-react';

// Component to handle the Heatmap Layer on the Leaflet Map
const PredictiveLayer = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !Array.isArray(points) || points.length === 0) return;
    
    const heatData = points.map(p => {
      // 1. Try to get coords from the nested location object (Standard)
      // 2. Try to get coords from the point itself (Aggregated)
      const lat = p.location?.coordinates?.[1] || p._id?.lat || 0;
      const lng = p.location?.coordinates?.[0] || p._id?.lng || 0;
      
      // Only return if coordinates are valid (not 0,0)
      return [lat, lng, 0.7]; 
    }).filter(coord => coord[0] !== 0);

    const layer = L.heatLayer(heatData, {
      radius: 35, 
      blur: 15, 
      maxZoom: 10,
      gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
    }).addTo(map);

    // Auto-zoom map to fit the hotspots
    if (heatData.length > 0) {
      const bounds = L.latLngBounds(heatData.map(d => [d[0], d[1]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => map.removeLayer(layer);
  }, [map, points]);
  return null;
};
const Analytics = () => {
  const [chartData, setChartData] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [aiPrediction, setAiPrediction] = useState("Scanning for patterns...");
  const [isSending, setIsSending] = useState(false);
  const reportRef = useRef(); 

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [weekly, predictive] = await Promise.all([
          axios.get('http://172.16.14.31:5000/api/analytics/weekly'),
          axios.get('http://172.16.14.31:5000/api/analytics/predictive')
        ]);

        // Process Weekly Bar Chart Data
        if (weekly.data) {
          setChartData(weekly.data.map(d => ({ name: d._id, value: d.count })));
        }
        
        // Process Predictive Data (Hotspots and AI Text)
        if (predictive.data) {
          // Set the markers for the map
          setRiskZones(predictive.data.hotspots || []);
          // Update the AI summary text box
          setAiPrediction(predictive.data.prediction || "System Stable.");
        }
      } catch (e) { 
        console.error("Analytics fetch failed", e);
        setAiPrediction("Offline: Check Backend Connection");
      }
    };

    fetchAnalytics();
  }, []);

  const generatePDFBlob = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element, { backgroundColor: '#000', useCORS: true, scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('datauristring');
  };

  const exportPDF = async () => {
    const dataUri = await generatePDFBlob();
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `ResiliNet_Report_${new Date().toLocaleDateString()}.pdf`;
    link.click();
  };

  const dispatchReport = async () => {
    setIsSending(true);
    try {
      const pdfBase64 = await generatePDFBlob();
      const res = await axios.post('http://172.16.14.31:5000/api/dispatch-report', {
        pdfBase64,
        recipientEmail: "authority-center@city.gov"
      });
      alert(res.data.message);
    } catch (err) {
      alert("Dispatch failed. Ensure dispatch-report route is configured on backend.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ color: '#fff', fontFamily: 'monospace', padding: '10px' }}>
      {/* Header with Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#00ff41', margin: 0 }}>📊 DISASTER INTELLIGENCE</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportPDF} style={styles.exportBtn}>
            <Download size={16} /> DOWNLOAD PDF
          </button>
          <button 
            onClick={dispatchReport} 
            style={{...styles.exportBtn, backgroundColor: '#e63946'}} 
            disabled={isSending}
          >
            <Send size={16} /> {isSending ? 'SENDING...' : 'DISPATCH TO AUTHORITIES'}
          </button>
        </div>
      </div>
      
      {/* Report Container (Captured by PDF Generator) */}
      <div ref={reportRef} style={{ padding: '20px', backgroundColor: '#000', borderRadius: '15px', border: '1px solid #222' }}>
        <div style={styles.reportHeader}>
          <FileText color="#00ff41" />
          <span style={{ marginLeft: '10px' }}>OFFICIAL INCIDENT SUMMARY | {new Date().toDateString()}</span>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {/* Bar Chart Card */}
          <div style={styles.card}>
            <h3>Incident Distribution (Recent)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ background: '#000', border: '1px solid #333' }} />
                <Bar dataKey="value" fill="#00ff41">
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={['#e63946', '#4dff88', '#ff8c00', '#00ff41'][i % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Prediction Side Card */}
          <div style={styles.riskCard}>
            <h3>AI Prediction</h3>
            <div style={{ padding: '10px', background: '#222', borderRadius: '5px', marginBottom: '15px' }}>
              <p style={{ fontSize: '13px', color: '#00ff41', margin: 0 }}>{aiPrediction}</p>
            </div>
            
            {riskZones.length > 0 ? riskZones.slice(0, 3).map((zone, i) => (
              <div key={i} style={styles.riskItem}>
                <span style={{ color: '#ff8c00', fontWeight: 'bold' }}>Hotspot {i+1}: </span> 
                {zone._id} ({zone.count} Cases)
              </div>
            )) : <p style={{color: '#666'}}>No clusters detected.</p>}
          </div>
        </div>

        {/* Map Box */}
        <div style={styles.mapBox}>
          <h3 style={{ padding: '15px', background: '#111', margin: 0, borderBottom: '1px solid #333' }}>
            Predictive Risk Hotspots (Heatmap)
          </h3>
          <MapContainer center={[20.59, 78.96]} zoom={5} style={{ height: '400px' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <PredictiveLayer points={riskZones} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

const styles = {
  exportBtn: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#00ff41', color: '#000', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  reportHeader: { borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', color: '#888' },
  card: { flex: 2, minWidth: '300px', background: '#111', padding: '20px', borderRadius: '10px' },
  riskCard: { flex: 1, minWidth: '250px', background: '#111', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #ff8c00' },
  riskItem: { marginBottom: '10px', padding: '10px', background: '#1a1a1a', borderRadius: '4px', border: '1px solid #333' },
  mapBox: { borderRadius: '10px', overflow: 'hidden', border: '1px solid #333', marginTop: '20px' }
};

export default Analytics;