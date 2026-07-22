const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  active: {
    type: Boolean,
    default: true
  },
  resetOtp: {
    type: String,
    default: ''
  },
  resetOtpExpiryAt: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.resetOtp;
    delete ret.resetOtpExpiryAt;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);