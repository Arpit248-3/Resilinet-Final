// backend/quick-seed.js
const mongoose = require('mongoose');
const SOS = require('./models/SOS'); 

mongoose.connect('mongodb://127.0.0.1:27017/resilinet')
  .then(() => console.log("Connected to MongoDB for seeding..."))
  .catch(err => console.error("Could not connect to MongoDB", err));

const seedToday = async () => {
    try {
        await SOS.deleteMany({}); 
        
        // FIXED: Using the exact Enum values your schema expects
        const categories = ['FIRE', 'MEDICAL', 'POLICE', 'General'];
        
        for(let i = 0; i < 10; i++) {
            await SOS.create({
                name: `Emergency Case #${i + 1}`,
                phone: "9876543210",
                category: categories[i % 4], // This will now match: FIRE, MEDICAL, etc.
                location: { 
                    type: 'Point', 
                    coordinates: [78.9629 + (Math.random() * 0.1), 20.5937 + (Math.random() * 0.1)] 
                },
                status: 'Active',
                ai_insight: "Valid enum seed data for testing analytics.",
                priority: i % 2 === 0 ? "High" : "Medium",
                timestamp: new Date() 
            });
        }
        console.log("✅ SUCCESS: 10 new incidents added with correct ENUM values!");
    } catch (err) {
        console.error("❌ Seeding failed:", err.message);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

seedToday();