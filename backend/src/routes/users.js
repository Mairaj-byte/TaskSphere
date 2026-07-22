const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// GET /api/users - List all users (Admins see all; Members see general profile metadata like ID/name for assignment selection)
router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const users = await User.find().sort({ name: 1 });
      res.json(users);
    } else {
      // Members can only see active user names, emails and IDs to help assign tasks or mention them
      const users = await User.find({ active: true }, '_id name email role').sort({ name: 1 });
      res.json(users);
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Admin-only endpoints below
router.use(requireRole('admin'));

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Please provide all required fields (name, email, password, role).' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
      role
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

    // Check unique email if changing email
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email });
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

// PATCH /api/users/:id/toggle-active - Quick toggle user state
router.patch('/:id/toggle-active', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Cannot deactivate yourself
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
