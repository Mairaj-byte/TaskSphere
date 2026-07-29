const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/*
|--------------------------------------------------------------------------
| POST /api/auth/google
|--------------------------------------------------------------------------
*/
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required.'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        googleId, // ✅ Included googleId
        loginProvider: 'google',
        profilePhoto: picture,
        role: 'member',
        active: true
      });
    } else {
      if (!user.loginProvider) user.loginProvider = 'google';
      if (!user.googleId) user.googleId = googleId; // ✅ Preserve googleId
      if (!user.profilePhoto && picture) user.profilePhoto = picture;
      await user.save();
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated.'
      });
    }

    const appToken = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        designationRole: user.designationRole // ✅ Changed from user.position
      },
      process.env.JWT_SECRET || 'companysecretkey123',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );

    return res.json({
      success: true,
      token: appToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        loginProvider: user.loginProvider,
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
    console.error('Google Auth Error:', err);
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired Google Token.'
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/auth/login
|--------------------------------------------------------------------------
*/
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated.'
      });
    }

    // Prevent password login for Google-only accounts
    if (user.loginProvider === 'google' && !user.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Please sign in using Google.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        position: user.position
      },
      process.env.JWT_SECRET || 'companysecretkey123',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );

    return res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        active: user.active,
        loginProvider: user.loginProvider,
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
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/auth/me
|--------------------------------------------------------------------------
*/
router.get('/me', authenticate, async (req, res) => {
  return res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      position: req.user.position,
      active: req.user.active,
      loginProvider: req.user.loginProvider,
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