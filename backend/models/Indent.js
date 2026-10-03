const mongoose = require('mongoose');

const IndentSchema = new mongoose.Schema({
  unitName: { type: String, required: true },
  category: { type: String, enum: ['AMMUNITION', 'RATIONS', 'FOL', 'MEDICAL'], required: true },
  quantity: { type: Number, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'HIGH' },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'DISPATCHED', 'DELIVERED'], 
    default: 'PENDING' 
  },
  requestedBy: {
    serviceNumber: { type: String, default: 'OR-88412' },
    name: { type: String, default: 'Havildar Rajesh Kumar' },
    rank: { type: String, default: 'HAVILDAR' },
    role: { type: String, default: 'OPERATOR' }
  },
  approvedBy: {
    serviceNumber: { type: String, default: null },
    name: { type: String, default: null },
    rank: { type: String, default: null },
    role: { type: String, default: null },
    timestamp: { type: Date, default: null },
    remarks: { type: String, default: '' }
  },
  rejectionReason: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Indent', IndentSchema);