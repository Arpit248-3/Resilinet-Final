const mongoose = require('mongoose');
const SOS = require('./models/SOS');

mongoose.connect('mongodb://127.0.0.1:27017/resilinet')
  .then(async () => {
    console.log("Connected to seed database...");
    await SOS.deleteMany({}); // Wipe old data

    const mockData = [
      {
        userId: "Victim_Alpha_01",
        severity: "Critical",
        location: { type: "Point", coordinates: [77.5946, 12.9716] }, 
        isMeshVerified: true,
        status: "Active",
        timestamp: new Date(Date.now() - 45 * 60000)
      },
      {
        userId: "Victim_Beta_02",
        severity: "Moderate",
        location: { type: "Point", coordinates: [77.5948, 12.9718] }, 
        isMeshVerified: false,
        status: "Active",
        timestamp: new Date(Date.now() - 10 * 60000)
      }
    ];

    await SOS.insertMany(mockData);
    console.log("✅ Database Seeded Successfully!");
    process.exit();
  })
  .catch(err => console.error(err));