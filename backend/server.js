const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Expo } = require('expo-server-sdk');
const SOS = require('./models/SOS');

const app = express();
const server = http.createServer(app); 
const io = new Server(server, {
    cors: { origin: "*" } 
});

const expo = new Expo();
let volunteerTokens = []; 

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- DATABASE CONNECTION ---
mongoose.connect('mongodb://127.0.0.1:27017/resilinet')
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("DB Error:", err));

// --- NODEMAILER CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: 'jhamarpit@gmail.com', 
        pass: 'qsufepgbplwuurft' 
    }
});

// --- SOCKET.IO CONNECTION ---
io.on('connection', (socket) => {
    console.log('Web Dashboard Connected:', socket.id);
});

// --- API ROUTES ---

// 1. Get Active Alerts (Feed)
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await SOS.find({ status: 'Active' }).sort({ timestamp: -1 });
        res.json(alerts);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * 2. NEW ANALYTICS ROUTES (Fixes 404 Errors)
 * These routes provide data for the "Incident Distribution" and "AI Prediction" sections.
 */

// Route for Weekly Distribution Chart
app.get('/api/analytics/weekly', async (req, res) => {
    try {
        const data = await SOS.aggregate([
            { 
                $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 } 
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        res.json(data);
    } catch (_err) { 
        res.status(500).json({ error: "Failed to fetch data" }); 
    }
});
// Route for AI Predictive Hotspots
// backend/server.js

app.get('/api/analytics/predictive', async (req, res) => {
    try {
        const hotspots = await SOS.aggregate([
            { $match: { status: 'Active' } },
            { $group: { 
                _id: "$category", 
                count: { $sum: 1 },
                // This is the crucial part: it keeps the location data for the map
                location: { $first: "$location" } 
            }},
            { $sort: { count: -1 } }
        ]);

        const prediction = hotspots.length > 0 
            ? `Warning: ${hotspots[0]._id} cluster detected. Pattern suggests immediate response.`
            : "No significant risk patterns detected.";

        res.json({ hotspots, prediction });
    } catch (err) {
        res.status(500).json({ error: "Analysis failed" });
    }
});// 3. Main SOS Trigger
app.post('/api/sos', async (req, res) => {
    try {
        const { name, phone, location, category, ai_insight, priority } = req.body;
        const mapUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

        const newSOS = new SOS({
            name: name || "Anonymous User",
            phone: phone || "6260055671",
            category: category || "General Emergency",
            ai_insight: ai_insight || "Analyzing patterns...",
            priority: priority || "High",
            location: { 
                type: 'Point', 
                coordinates: [location.longitude, location.latitude] 
            },
            status: 'Active',
            timestamp: new Date()
        });

        await newSOS.save();
        io.emit('new-sos', newSOS); 

        // Send Email
        const mailOptions = {
            from: '"ResiliNet Emergency System" <jhamarpit@gmail.com>',
            to: 'jhamarpit@gmail.com',
            subject: `🚨 SOS ALERT: ${category} 🚨`,
            html: `<h3>Emergency Alert</h3><p>User: ${name}</p><p><a href="${mapUrl}">View Location</a></p>`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) console.log("Email Error:", error);
        });

        res.status(201).json({ success: true, message: "SOS Logged" });
    } catch (err) { 
        res.status(500).json({ error: "Sync Failed", details: err.message }); 
    }
});

// 4. Resolve SOS
app.put('/api/sos/resolve/:id', async (req, res) => {
    try {
        await SOS.findByIdAndUpdate(req.params.id, { status: 'Resolved' });
        io.emit('sos-resolved', req.params.id); 
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Resolve Failed" }); }
});

// 5. Wipe Data
app.delete('/api/danger/wipe-all', async (req, res) => {
    await SOS.deleteMany({});
    io.emit('database-wiped'); 
    res.json({ success: true });
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`ResiliNet Backend Live: http://localhost:${PORT}`);
});