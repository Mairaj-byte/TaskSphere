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

  // --- Optional Profile Fields ---
  profilePhoto: {
    type: String, // URL or file path
    default: ''
  },
  employeeId: {
    type: String,
    trim: true,
    default: ''
  },
  dob: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''],
    default: ''
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  workLocation: {
    type: String,
    trim: true,
    default: ''
  },
  designationRole: { // Work job title (distinct from access level 'role')
    type: String,
    trim: true,
    default: ''
  },

  // --- Reset Password Credentials ---
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