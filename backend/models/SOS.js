const mongoose = require('mongoose');

const SOSSchema = new mongoose.Schema({
    userId: { type: String, default: "Anonymous User" },
    message: { type: String, default: "🚨 EMERGENCY SOS TRIGGERED" },
    location: {
        latitude: Number,
        longitude: Number
    },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SOS', SOSSchema);