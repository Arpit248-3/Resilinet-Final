require('dotenv').config();
const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

// --- UTILS & MODELS ---
const { calculatePriority } = require('./utils/priorityEngine');
const SOS = require('./models/SOS');
const Responder = require('./models/Responder');
const SafeZone = require('./models/SafeZone'); // Added SafeZone Model

const app = express();
const server = http.createServer(app); 
const io = new Server(server, { 
    cors: { 
        origin: "*", 
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] 
    } 
});

app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resilinet')
  .then(() => console.log("✅ Tactical Database Connected"))
  .catch(err => console.error("❌ DB Connection Failed:", err));

// --- SIMULATION: SMART BATTERY & SECTOR SYNC ---
setInterval(async () => {
    try {
        const responders = await Responder.find();
        let globalUpdateNeeded = false;

        for (let res of responders) {
            let newBattery = res.batteryLevel;
            let statusChanged = false;
            
            if (res.status === 'Busy' && res.batteryLevel > 0) {
                newBattery = Math.max(0, res.batteryLevel - (Math.floor(Math.random() * 2) + 1));
                statusChanged = true;
            } else if (res.status === 'Available' && res.batteryLevel < 100) {
                newBattery = Math.min(100, res.batteryLevel + 2);
                statusChanged = true;
            }

            if (statusChanged) {
                await Responder.findByIdAndUpdate(res._id, { batteryLevel: newBattery });
                globalUpdateNeeded = true;
            }
        }

        if (globalUpdateNeeded) {
            const updatedList = await Responder.find();
            io.emit('units-update', updatedList); 
        }
    } catch (err) { console.error("Tactical Sync Error:", err.message); }
}, 10000);

// --- ROUTES ---

// 1. Get All Alerts (Enriched with Priority Scores)
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await SOS.find().sort({ timestamp: -1 });
        const enrichedAlerts = alerts.map(alert => ({
            ...alert._doc,
            dynamicScore: calculatePriority(alert, 0)
        }));
        res.json(enrichedAlerts);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Submit New SOS
app.post('/api/sos', async (req, res) => {
    try {
        const { phone, latitude, longitude, category, name, email, heartRate, sector } = req.body;
        
        const newSOS = new SOS({
            name: name || "Unknown Citizen",
            email: email || "N/A",
            phone,
            category: (category || 'General').toUpperCase(),
            heartRate: heartRate || 80,
            location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
            status: 'Active',
            sector: sector || 'Local',
            timestamp: new Date()
        });

        newSOS.priority = (newSOS.heartRate > 120) ? "Critical" : "High";

        await newSOS.save();
        io.emit('new-sos', newSOS); 
        res.status(201).json({ success: true, data: newSOS });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Responder Telemetry (Updates location via Simulate.js)
app.patch('/api/responders/:id/location', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const updatedUnit = await Responder.findByIdAndUpdate(
            req.params.id,
            { 
                location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                lastUpdated: new Date()
            },
            { new: true }
        );
        
        const allResponders = await Responder.find();
        io.emit('units-update', allResponders);
        res.json({ success: true, data: updatedUnit });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Tactical Dispatch
app.put('/api/sos/dispatch/:id', async (req, res) => {
    try {
        const { responderId, isExternal } = req.body; 
        const sosId = req.params.id;
        const updateData = { 
            status: isExternal ? 'Handed Over' : 'Dispatched',
            assignedResponder: responderId 
        };
        const updatedSOS = await SOS.findByIdAndUpdate(sosId, updateData, { new: true });
        const unit = await Responder.findByIdAndUpdate(responderId, { status: 'Busy' }, { new: true });
        const allResponders = await Responder.find();
        io.emit('units-update', allResponders);
        res.json({ success: true, data: updatedSOS });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Resolve SOS
app.put('/api/sos/resolve/:id', async (req, res) => {
    try {
        const sos = await SOS.findById(req.params.id);
        if (sos.assignedResponder) {
            await Responder.findByIdAndUpdate(sos.assignedResponder, { status: 'Available' });
        }
        await SOS.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
        const allResponders = await Responder.find();
        io.emit('units-update', allResponders);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Get Responders
app.get('/api/responders', async (req, res) => {
    try {
        const list = await Responder.find();
        res.json(list);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. NEW: Get All Safe Zones (For Frontend Icons)
app.get('/api/safe-zones', async (req, res) => {
    try {
        const zones = await SafeZone.find();
        res.json(zones);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    -------------------------------------------
    🛡️  RESILINET BACKEND: OPERATIONAL
    📡 Handshake Port: ${PORT}
    🏠 Safe Zones: INDORE INFRASTRUCTURE LOADED
    -------------------------------------------
    `);
});