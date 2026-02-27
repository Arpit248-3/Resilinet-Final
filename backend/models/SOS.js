const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  userId: String,
  severity: { type: String, enum: ['Minor', 'Moderate', 'Critical'] },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  voiceTranscript: String,
  isMeshVerified: { type: Boolean, default: false },
  biometricHash: String,    // For the biometric fallback
  handshakeToken: String,   // For the Cryptographic QR
  status: { type: String, default: 'Active' },
  timestamp: { type: Date, default: Date.now }
});

sosSchema.index({ location: '2dsphere' }); // Crucial for clustering
module.exports = mongoose.model('SOS', sosSchema);