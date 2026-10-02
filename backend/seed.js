const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Container = require('./models/Container');
const Indent = require('./models/Indent');
const User = require('./models/User');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/defops_sih';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    await Container.deleteMany({});
    await Indent.deleteMany({});
    await User.deleteMany({});

    await User.create([
      {
        serviceNumber: 'IC-10293',
        name: 'Major Vikram Singh',
        rank: 'MAJOR',
        role: 'OFFICER',
        password: 'password123'
      },
      {
        serviceNumber: 'OR-88412',
        name: 'Havildar Rajesh Kumar',
        rank: 'HAVILDAR',
        role: 'OPERATOR',
        password: 'password123'
      }
    ]);

    await Container.create([
      {
        containerId: 'CONT-LEH-01',
        baseName: 'Leh Forward Depot',
        location: { type: 'Point', coordinates: [77.5771, 34.1526] },
        sensors: { temperature: 18.2, humidity: 40, battery: 92 },
        status: 'NORMAL'
      },
      {
        containerId: 'CONT-KARGIL-02',
        baseName: 'Kargil Transit Hub',
        location: { type: 'Point', coordinates: [76.1349, 34.5539] },
        sensors: { temperature: 27.4, humidity: 35, battery: 78 },
        status: 'COLD_CHAIN_BREACH'
      }
    ]);

    await Indent.create([
      {
        unitName: 'Forward Post 42 (Kargil)',
        category: 'AMMUNITION',
        quantity: 500,
        priority: 'CRITICAL',
        status: 'PENDING'
      },
      {
        unitName: 'Siachen Sector Depot',
        category: 'RATIONS',
        quantity: 1200,
        priority: 'HIGH',
        status: 'APPROVED'
      }
    ]);

    console.log('[SUCCESS] Database successfully seeded with military containers, indents, and users!');
    process.exit(0);
  } catch (err) {
    console.error('[ERROR] Seeding failed:', err);
    process.exit(1);
  }
};

seedData();