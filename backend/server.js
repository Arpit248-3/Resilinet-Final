const express = require('express');
const http = require('http'); // Required for Socket.io
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Expo } = require('expo-server-sdk');
const SOS = require('./models/SOS');
const { calculatePriority } = require('./utils/priorityEngine');

const app = express();
const server = http.createServer(app); // Wrap express app
const io = new Server(server, {
    cors: { origin: "*" } // Allow web dashboard to connect
});

const expo = new Expo();
let volunteerTokens = [];

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- DATABASE CONNECTION ---
mongoose.connect('mongodb://127.0.0.1:27017/resilinet')
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("DB Error:", err));

// --- NODEMAILER ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'jhamarpit@gmail.com', pass: 'qsufepgbplwuurft' }
});

// --- SOCKET.IO CONNECTION ---
io.on('connection', (socket) => {
    console.log('Web Dashboard Connected:', socket.id);
});

// --- API ROUTES ---

app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await SOS.find({ status: 'Active' });
        res.json(alerts);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/sos', async (req, res) => {
    try {
        const { name, phone, location, category, ai_insight, priority } = req.body;
        
        const newSOS = new SOS({
            name: name || "Anonymous",
            phone: phone || "6260055671",
            category, ai_insight, priority,
            location: { type: 'Point', coordinates: [location.longitude, location.latitude] },
            status: 'Active',
            timestamp: new Date()
        });

        await newSOS.save();

        // --- REAL-TIME EMIT ---
        // This sends the new SOS data to all connected Web Dashboards instantly
        io.emit('new-sos', newSOS); 

        // 1. Expo Push (Volunteers)
        let messages = [];
        for (let token of volunteerTokens) {
            if (Expo.isExpoPushToken(token)) {
                messages.push({ to: token, title: `🚨 SOS: ${category}`, body: `${name} needs help!` });
            }
        }
        let chunks = expo.chunkPushNotifications(messages);
        chunks.forEach(async (c) => await expo.sendPushNotificationsAsync(c));

        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: "Sync Failed" }); }
});

// Resolve and Wipe routes (as previously provided)
app.put('/api/sos/resolve/:id', async (req, res) => {
    await SOS.findByIdAndUpdate(req.params.id, { status: 'Resolved' });
    io.emit('sos-resolved', req.params.id); // Tell web app to remove it from feed
    res.json({ success: true });
});

app.delete('/api/danger/wipe-all', async (req, res) => {
    await SOS.deleteMany({});
    io.emit('database-wiped'); // Tell web app to clear screen
    res.json({ success: true });
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`ResiliNet Real-Time Hub: http://172.16.14.31:${PORT}`);
});