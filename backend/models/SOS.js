const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  name: String,
  phone: String,
  message: String,
  category: { type: String, default: 'Medical' }, // Medical, Fire, Security
  ai_insight: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  status: { type: String, default: 'Active' }, // Active, Resolved
  priorityScore: { type: Number, default: 0 },
  isMeshVerified: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

sosSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('SOS', sosSchema);