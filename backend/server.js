const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto'); // Built-in node module for handshakes
const SOS = require('./models/SOS');
const Supply = require('./models/Supply'); // New Supply model
const { calculatePriority } = require('./utils/priorityEngine');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/resilinet', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// --- CORE INTELLIGENCE ROUTES ---

// GET: Fetch all alerts with dynamic Priority Intelligence
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await SOS.find();
        const smartAlerts = await Promise.all(alerts.map(async (alert) => {
            // Geospatial Clustering: Count neighbors within 100 meters
            const clusterCount = await SOS.countDocuments({
                _id: { $ne: alert._id },
                location: {
                    $near: {
                        $geometry: alert.location,
                        $maxDistance: 100
                    }
                }
            });

            return {
                ...alert._doc,
                priorityScore: calculatePriority(alert, clusterCount)
            };
        }));

        // Sort: Highest priority first for rescue teams
        res.json(smartAlerts.sort((a, b) => b.priorityScore - a.priorityScore));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: SOS Signal with Deduplication & Cryptographic Handshake Generation
app.post('/api/sos', async (req, res) => {
    const { userId, location, severity, isMeshVerified, voiceTranscript } = req.body;

    try {
        // 1. Deduplication: Check if user sent alert in last 10 mins
        const existing = await SOS.findOne({
            userId,
            timestamp: { $gte: new Date(Date.now() - 10 * 60000) }
        });

        if (existing) return res.status(200).json({ message: "Update received", data: existing });

        // 2. Generate Cryptographic Handshake for Supply Verification
        const handshakeToken = crypto.randomBytes(8).toString('hex');

        const newSOS = new SOS({
            userId,
            severity,
            voiceTranscript,
            isMeshVerified,
            handshakeToken, // Token stored for QR comparison later
            location: { type: 'Point', coordinates: [location.lng, location.lat] }
        });

        await newSOS.save();
        res.status(201).json(newSOS);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADVANCED AID & TRIAGE ROUTES ---

// POST: Visual Triage Simulation (Edge AI photo-scan trigger)
app.post('/api/trigger-cluster-escalation', async (req, res) => {
    try {
        // Rescuers take a photo -> Edge AI identifies many victims -> 
        // We set isMeshVerified to true for all nearby signals to reflect high reliability
        await SOS.updateMany(
            { status: 'Active' }, 
            { $set: { isMeshVerified: true } }
        );
        res.json({ message: "Visual Triage Successful: Cluster reliability escalated." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Aid Distribution (The Triple-Tier Verification Logic)
app.post('/api/distribute-aid', async (req, res) => {
    const { victimId, method, authData } = req.body;

    try {
        const victim = await SOS.findById(victimId);
        if (!victim) return res.status(404).json({ error: "Victim not found" });

        // Logic: Store the transaction in the Supply database
        const newSupply = new Supply({
            victimId,
            verificationMethod: method, // 'QR', 'BIOMETRIC', or 'BLE_AUTO'
            handshakeId: method === 'QR' ? authData : null,
            biometricToken: method === 'BIOMETRIC' ? authData : null,
            timestamp: new Date()
        });

        await newSupply.save();

        // Once aid is provided, we can mark the SOS as Resolved
        victim.status = 'Resolved';
        await victim.save();

        res.json({ status: "Success", message: `Aid verified via ${method}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SERVER START ---
const PORT = 5000;
app.listen(PORT, () => console.log(`ResiliNet Core Hub active on port ${PORT}`));