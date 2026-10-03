const mongoose = require('mongoose');

const ContainerSchema = new mongoose.Schema({
  containerId: { type: String, required: true, unique: true },
  baseName: { type: String, default: 'Forward Transit' },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  sensors: {
    temperature: Number,
    humidity: Number,
    battery: Number,
    tamper: { type: Boolean, default: false }
  },
  status: { 
    type: String, 
    enum: ['NORMAL', 'COLD_CHAIN_BREACH', 'FREEZING_BREACH', 'TAMPERED', 'BATTERY_CRITICAL', 'HUMIDITY_EXCESS'], 
    default: 'NORMAL' 
  },
  history: [{
    coordinates: [Number],
    temperature: Number,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

ContainerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Container', ContainerSchema);