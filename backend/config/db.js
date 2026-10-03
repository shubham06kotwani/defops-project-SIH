const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/defops_sih';
    const conn = await mongoose.connect(uri);
    console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[WARN] MongoDB not reachable at ${process.env.MONGO_URI || 'default'}: ${err.message}`);
    console.warn('[INFO] DEFOPS Tactical Server running in Graceful Fallback / Static Serving mode.');
  }
};

module.exports = connectDB;