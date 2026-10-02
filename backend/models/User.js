const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  serviceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  rank: {
    type: String,
    default: 'Officer'
  },
  role: {
    type: String,
    enum: ['ADMIN', 'COMMANDER', 'LOGISTICS_OFFICER', 'DEPOT_MANAGER', 'OPERATOR', 'USER'],
    default: 'OPERATOR'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
