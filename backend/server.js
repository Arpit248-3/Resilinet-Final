const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const SOS = require('./models/SOS');
const Supply = require('./models/Supply');
const { calculatePriority } = require('./utils/priorityEngine');

const app = express();
app.use(cors());
app.use(express.json());

// Standardized to 127.0.0.1 for Node.js 18+ stability
mongoose.connect('mongodb://127.0.0.1:27017/resilinet')
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch(err => console.error("Database Connection Error:", err));

// GET: Fetch all alerts with priority scoring
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await SOS.find({ status: 'Active' });
        
        const smartAlerts = await Promise.all(alerts.map(async (alert) => {
            // Using $geoWithin with $centerSphere is more efficient for counting 
            // and doesn't require the strict sorting that $near does.
            const clusterCount = await SOS.countDocuments({
                _id: { $ne: alert._id },
                status: 'Active',
                location: {
                    $geoWithin: {
                        $centerSphere: [
                            [alert.location.coordinates[0], alert.location.coordinates[1]], 
                            0.1 / 6378.1 // 100 meters converted to radians
                        ]
                    }
                }
            });

            return {
                ...alert._doc,
                priorityScore: calculatePriority(alert, clusterCount)
            };
        }));

        res.json(smartAlerts.sort((a, b) => b.priorityScore - a.priorityScore));
    } catch (err) {
        console.error("Geospatial Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// POST: Trigger Visual Triage Escalation
app.post('/api/trigger-cluster-escalation', async (req, res) => {
    try {
        await SOS.updateMany({ status: 'Active' }, { $set: { isMeshVerified: true } });
        res.json({ message: "Visual Triage Successful: Mesh reliability updated." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Aid Distribution
app.post('/api/distribute-aid', async (req, res) => {
    const { victimId, method, authData } = req.body;
    try {
        const victim = await SOS.findById(victimId);
        if (!victim) return res.status(404).json({ error: "Victim not found" });

        const newSupply = new Supply({
            victimId,
            verificationMethod: method,
            handshakeId: method === 'QR' ? authData : null,
            biometricToken: method === 'BIOMETRIC' ? authData : null
        });
        await newSupply.save();

        victim.status = 'Resolved';
        await victim.save();
        res.json({ status: "Success", message: `Aid verified via ${method}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST: Create a new SOS Alert from Mobile
app.post('/api/sos', async (req, res) => {
    try {
        const { name, phone, message, location } = req.body;
        
        const newSOS = new SOS({
            name,
            phone,
            message,
            location: {
                type: 'Point',
                coordinates: [location.longitude, location.latitude] // Ensure GeoJSON order: [Lng, Lat]
            },
            status: 'Active',
            timestamp: new Date()
        });

        await newSOS.save();
        console.log(`🚨 SOS Received from ${name} at ${location.latitude}, ${location.longitude}`);
        res.status(201).json({ success: true, message: "SOS Alert received by command center." });
    } catch (err) {
        console.error("SOS Save Error:", err);
        res.status(500).json({ error: "Failed to process SOS signal." });
    }
});
// backend/server.js
const PORT = 5000;
// Passing '0.0.0.0' allows the server to accept connections from your phone/emulator
app.listen(PORT, '0.0.0.0', () => {
    console.log(`ResiliNet Core Hub active on http://172.16.14.31:${PORT}`);
});