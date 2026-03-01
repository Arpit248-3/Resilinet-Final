const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  name: { type: String, default: 'Anonymous' },
  phone: { type: String, default: '6260055671' },
  message: String,
  category: { 
    type: String, 
    enum: ['MEDICAL', 'FIRE', 'POLICE', 'General'], 
    default: 'General' 
  },
  ai_insight: { type: String, default: 'Analyzing situation...' },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  status: { 
    type: String, 
    enum: ['Active', 'Resolved'], 
    default: 'Active' 
  },
  priorityScore: { type: Number, default: 0 },
  isMeshVerified: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

// Important for geospatial queries (Live Maps)
sosSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('SOS', sosSchema);