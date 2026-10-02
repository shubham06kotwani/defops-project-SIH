const mongoose = require('mongoose');

const IndentSchema = new mongoose.Schema({
  unitName: { type: String, required: true },
  category: { type: String, enum: ['AMMUNITION', 'RATIONS', 'FOL', 'MEDICAL'], required: true },
  quantity: { type: Number, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'HIGH' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'DISPATCHED', 'DELIVERED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('Indent', IndentSchema);