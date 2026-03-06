const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Models
const SOS = require('./models/SOS'); 
const Responder = require('./models/Responder');
const Supply = require('./models/Supply');
const SafeZone = require('./models/SafeZone');

/**
 * TACTICAL DATA SEEDER v3.0 (Master Integrated Version)
 * Orchestrates: Responders, SOS Alerts, Supplies, and Indore SafeZones.
 */
mongoose.connect('mongodb://127.0.0.1:27017/resilinet')
  .then(() => console.log("🚀 TACTICAL SEEDING INITIALIZED: Preparing Mission Environment..."))
  .catch(err => console.error("❌ Connection failed", err));

const mockUsers = [
    { name: "Arpit Jham", email: "arpitjham1@gmail.com", phone: "+919876543210" },
    { name: "John Doe", email: "john.d@example.com", phone: "+15550102030" },
    { name: "Sarah Connor", email: "s.connor@sky.net", phone: "+447700900123" }
];

const seedData = async () => {
    try {
        // 1. Wipe old mission data to prevent coordinate conflicts
        await SOS.deleteMany({}); 
        await Responder.deleteMany({});
        await Supply.deleteMany({});
        await SafeZone.deleteMany({});
        console.log("🧹 DATABASE PURGED: Previous mission data cleared.");

        // 2. Seed Indore Safe Zones from JSON
        const safeZonePath = path.join(__dirname, 'data', 'SafeZones.json');
        if (fs.existsSync(safeZonePath)) {
            const rawData = fs.readFileSync(safeZonePath);
            const jsonData = JSON.parse(rawData);

            for (const zone of jsonData) {
                await SafeZone.create({
                    id: zone.id,
                    name: zone.name,
                    type: zone.type,
                    location: { 
                        type: 'Point', 
                        coordinates: [zone.longitude, zone.latitude] // [Lon, Lat]
                    }
                });
            }
            console.log(`🏠 ${jsonData.length} Safe Zones established in Indore.`);
        } else {
            console.warn("⚠️ SafeZones.json not found in backend/data. Skipping zone seeding.");
        }

        // 3. Seed Responders
        const responders = await Responder.insertMany([
            { 
                name: "MEDIC-BRAVO-1", type: "Medical", batteryLevel: 85, 
                sector: "Local", status: "Available",
                location: { type: 'Point', coordinates: [75.8900, 22.7500] } // Centered near Vijay Nagar
            },
            { 
                name: "REGIONAL-AIR-X", type: "Medical", batteryLevel: 100, 
                sector: "Sector-B", status: "Available",
                location: { type: 'Point', coordinates: [75.8600, 22.7200] } // Centered near Rajwada
            }
        ]);
        console.log(`✅ ${responders.length} Responders Deployed.`);

        // 4. Seed SOS Alerts
        const activeSOS = [];
        for(let i = 0; i < 5; i++) {
            const user = mockUsers[i % mockUsers.length];
            const sos = await SOS.create({
                name: user.name,
                phone: user.phone,
                category: 'MEDICAL',
                heartRate: 110 + (i * 5),
                priority: i === 0 ? 'Critical' : 'High',
                location: { 
                    type: 'Point', 
                    coordinates: [75.8700 + (i * 0.01), 22.7300 + (i * 0.01)] 
                },
                status: 'Active',
                sector: "Local"
            });
            activeSOS.push(sos);
        }
        console.log("✅ 5 SOS Records generated.");

        // 5. Seed Mock Supply Requests
        await Supply.create([
            {
                victimId: activeSOS[0]._id,
                responderId: responders[0]._id,
                supplyType: "Blood Plasma & IV Kit",
                status: "In-Transit",
                verificationMethod: "QR",
                handshakeId: "TX-ALPHA-99",
                timestamp: new Date()
            },
            {
                victimId: activeSOS[1]._id,
                responderId: responders[1]._id,
                supplyType: "Ration Pack - 48hr",
                status: "Pending",
                verificationMethod: "BIOMETRIC",
                handshakeId: "TX-BETA-101",
                timestamp: new Date()
            }
        ]);
        console.log("📦 Supply Handshakes seeded.");

    } catch (err) {
        console.error("❌ SEEDING FAILED:", err.message);
    } finally {
        console.log("🔌 MISSION COMPLETE: Closing database stream...");
        mongoose.connection.close();
    }
};

seedData();