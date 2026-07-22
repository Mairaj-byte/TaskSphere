const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const transporter = require('../utils/nodemailer'); // Adjust path if needed
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (No auth required)
// ==========================================

// POST /api/users/send-reset-otp - Send Password Reset OTP
router.post('/send-reset-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Save OTP + expiry (15 mins)
    user.resetOtp = otp;
    user.resetOtpExpiryAt = Date.now() + 15 * 60 * 1000;

    await user.save();

    // Send email
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Password Reset OTP',
      text: `Hi ${user.name || ''},

Your password reset OTP is: ${otp}

This OTP is valid for 15 minutes.

Best regards,
CollabZoneX Team`
    });

    return res.json({
      success: true,
      message: 'OTP sent to your email'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/users/reset-password - Verify OTP and Reset Password
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email, OTP, and new password are required'
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate OTP
    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (user.resetOtpExpiryAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP Expired'
      });
    }

    // Hash new password using passwordHash field
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetOtp = '';
    user.resetOtpExpiryAt = 0;

    await user.save();

    // Send confirmation email
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Password Reset Successful',
      text: `Hi ${user.name || ''},

Your password has been reset successfully for email: ${user.email}

Best regards,
CollabZoneX Team`
    });

    return res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
});

// POST /api/users/register - Self-registration endpoint for new members
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password.' });
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
      role: 'member'
    });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful', user: newUser });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// PROTECTED ROUTES (Authentication required)
// ==========================================
router.use(authenticate);

// GET /api/users - List all active users
router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const users = await User.find().sort({ name: 1 });
      res.json(users);
    } else {
      const users = await User.find({ active: true }, '_id name email role').sort({ name: 1 });
      res.json(users);
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// ADMIN-ONLY ROUTES
// ==========================================
router.use(requireRole('admin'));

// POST /api/users - Admin creation of any role
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password.' });
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
      role: role || 'member'
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/users/:id - Update user details
router.put('/:id', async (req, res) => {
  const { name, email, password, role, active } = req.body;
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use by another user.' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (active !== undefined) user.active = active;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/users/:id/toggle-active - Quick toggle active status
router.patch('/:id/toggle-active', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }

    user.active = !user.active;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;