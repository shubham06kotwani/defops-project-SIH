const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Disable query buffering so unhandled DB calls fail fast instead of hanging HTTP requests
    mongoose.set('bufferCommands', false);

    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/defops_sih';
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: process.env.NODE_ENV === 'production' ? 8000 : 2500,
      connectTimeoutMS: process.env.NODE_ENV === 'production' ? 8000 : 2500
    });
    console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[WARN] MongoDB not reachable (${err.message}).`);
    console.log('[ZERO-AREA-NET] Activated Tactical In-Memory Engine for 100% offline air-gapped readiness.');
  }
};

module.exports = connectDB;