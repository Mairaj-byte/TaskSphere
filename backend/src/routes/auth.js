const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact an admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'companysecretkey123',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,

        // Profile Fields
        profilePhoto: user.profilePhoto,
        employeeId: user.employeeId,
        dob: user.dob,
        gender: user.gender,
        department: user.department,
        workLocation: user.workLocation,
        designationRole: user.designationRole
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {

  res.json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      active: req.user.active,

      // Profile Fields
      profilePhoto: req.user.profilePhoto,
      employeeId: req.user.employeeId,
      dob: req.user.dob,
      gender: req.user.gender,
      department: req.user.department,
      workLocation: req.user.workLocation,
      designationRole: req.user.designationRole
    }
  });

});

module.exports = router;