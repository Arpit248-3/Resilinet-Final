require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const os = require('os'); 

const app = express();
app.use(express.json());

// --- UPDATED CORS CONFIG ---
// Explicitly allowing DELETE and POST methods for React
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}
const CURRENT_IP = getLocalIP();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🚀 DATABASE: Connected Successfully!"))
  .catch(err => console.log("❌ DATABASE ERROR:", err.message));

const sosSchema = new mongoose.Schema({
  userId: String,
  priority: { type: Number, default: 1 }, 
  category: { type: String, default: "General" },
  location: { latitude: Number, longitude: Number },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: "Pending" }
});
const SOS = mongoose.model('SOS', sosSchema);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  }
});

app.get('/', (req, res) => {
    res.send(`<h1>ResiliNet Backend is Live!</h1><p>Connect to: <b>http://${CURRENT_IP}:5000</b></p>`);
});

app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await SOS.find().sort({ timestamp: -1 });
    res.json(alerts);
  } catch (err) { res.status(500).json({error: err.message}); }
});

app.post('/api/sos', async (req, res) => {
  try {
    const { userId, location, priority, category } = req.body;
    const newSOS = new SOS({
      userId: userId || "Anonymous User",
      priority: priority || 1,
      category: category || "General",
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      }
    });

    await newSOS.save();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMERGENCY_CONTACT_EMAIL,
      subject: `🚨 EMERGENCY: ${newSOS.category} Alert from ${newSOS.userId}`,
      text: `An SOS signal was triggered!\n\nUser: ${newSOS.userId}\nCategory: ${newSOS.category}\nLocation: https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    };

    transporter.sendMail(mailOptions);
    res.status(201).json({ message: "SOS Logged", data: newSOS });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clear-alerts', async (req, res) => {
  try {
    await SOS.deleteMany({});
    console.log("🧹 DATABASE CLEANED"); 
    res.status(200).json({ message: "Database cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear database" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 SERVER ACTIVE ON: http://${CURRENT_IP}:${PORT}`);
});