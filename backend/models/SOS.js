// backend/models/SOS.js
const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  userId: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  severity: String,
  status: { type: String, default: 'Active' },
  isMeshVerified: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

// CRITICAL: This line creates the index required for $near queries
sosSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('SOS', sosSchema);