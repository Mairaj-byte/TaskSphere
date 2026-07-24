const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');
const { upload } = require('../config/cloudinary'); // Import Cloudinary Upload Middleware

// PUBLIC ROUTES
router.post('/send-reset-otp', userController.sendResetOtp);
router.post('/reset-password', userController.resetPassword);
router.post('/register', userController.registerUser);

// PROTECTED ROUTES
router.use(authenticate);

// Profile Routes
router.get('/profile', userController.getProfile);

// Attach multer upload middleware for single image with form field 'profilePhoto'
router.put('/profile', upload.single('profilePhoto'), userController.updateProfile);

// User List
router.get('/', userController.getUsers);

// ADMIN ROUTES
router.use(requireRole('admin'));

router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.patch('/:id/toggle-active', userController.toggleUserActive);

module.exports = router;