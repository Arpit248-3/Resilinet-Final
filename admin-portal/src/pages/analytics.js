import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileText, Download, Send } from 'lucide-react';

const PredictiveLayer = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || points.length === 0) return;
    const heatData = points.map(p => [p._id?.lat || 0, p._id?.lng || 0, p.intensity * 0.5]);
    const layer = L.heatLayer(heatData, {
      radius: 40, blur: 25, 
      gradient: { 0.4: '#6a11cb', 0.7: '#ff8c00', 1.0: '#ff0000' } 
    }).addTo(map);
    return () => map.removeLayer(layer);
  }, [map, points]);
  return null;
};

const Analytics = () => {
  const [chartData, setChartData] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const reportRef = useRef(); 

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [weekly, predictive] = await Promise.all([
          axios.get('http://172.16.14.31:5000/api/analytics/weekly'),
          axios.get('http://172.16.14.31:5000/api/analytics/predictive').catch(() => ({data: []}))
        ]);
        setChartData(weekly.data.map(d => ({ name: d._id, value: d.count })));
        setRiskZones(predictive.data);
      } catch (e) { console.error("Analytics fetch failed", e); }
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
        recipientEmail: "authority-center@city.gov" // Change this to real email
      });
      alert(res.data.message);
    } catch (err) {
      alert("Dispatch failed. Check console.");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ color: '#fff', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#00ff41', margin: 0 }}>📊 DISASTER INTELLIGENCE</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportPDF} style={styles.exportBtn}>
            <Download size={16} /> DOWNLOAD PDF
          </button>
          <button onClick={dispatchReport} style={{...styles.exportBtn, backgroundColor: '#e63946'}} disabled={isSending}>
            <Send size={16} /> {isSending ? 'SENDING...' : 'DISPATCH TO AUTHORITIES'}
          </button>
        </div>
      </div>
      
      <div ref={reportRef} style={{ padding: '20px', backgroundColor: '#000' }}>
        <div style={styles.reportHeader}>
          <FileText color="#00ff41" />
          <span style={{ marginLeft: '10px' }}>OFFICIAL INCIDENT SUMMARY | {new Date().toDateString()}</span>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div style={styles.card}>
            <h3>Incident Distribution (7 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ background: '#000', border: '1px solid #333' }} />
                <Bar dataKey="value" fill="#00ff41">
                  {chartData.map((_, i) => <Cell key={i} fill={['#e63946', '#4dff88', '#ff8c00'][i % 3]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.riskCard}>
            <h3>AI Prediction</h3>
            <p style={{ fontSize: '12px', color: '#aaa' }}>Zones with high repeat SOS activity.</p>
            {riskZones.length > 0 ? riskZones.slice(0, 3).map((zone, i) => (
              <div key={i} style={styles.riskItem}>
                <span style={{ color: '#ff8c00' }}>Zone {i+1}: </span> 
                {zone.intensity > 5 ? 'CRITICAL RISK' : 'MODERATE RISK'}
              </div>
            )) : <p style={{color: '#444'}}>No predictive data yet.</p>}
          </div>
        </div>

        <div style={styles.mapBox}>
          <h3 style={{ padding: '10px', background: '#111', margin: 0 }}>Predictive Risk Hotspots</h3>
          <MapContainer center={[20.59, 78.96]} zoom={5} style={{ height: '350px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
  card: { flex: 1, background: '#111', padding: '20px', borderRadius: '10px' },
  riskCard: { width: '300px', background: '#111', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #ff8c00' },
  riskItem: { marginBottom: '10px', padding: '10px', background: '#222', borderRadius: '4px' },
  mapBox: { borderRadius: '10px', overflow: 'hidden', border: '1px solid #333' }
};

export default Analytics;