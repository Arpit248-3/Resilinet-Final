const mongoose = require('mongoose');

const supplySchema = new mongoose.Schema({
  victimId: { type: mongoose.Schema.Types.ObjectId, ref: 'SOS' },
  verificationMethod: { type: String, enum: ['QR', 'BIOMETRIC', 'BLE_AUTO'] },
  handshakeId: String, // Cryptographic token
  biometricToken: String, // Anonymized fingerprint/face hash
  supplyType: { type: String, default: 'Essential Medical/Food' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Supply', supplySchema);