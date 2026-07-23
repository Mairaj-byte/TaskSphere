const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');

// PUBLIC ROUTES (No auth required)
router.post('/send-reset-otp', userController.sendResetOtp);
router.post('/reset-password', userController.resetPassword);
router.post('/register', userController.registerUser);


// PROTECTED ROUTES (Authentication required)
router.use(authenticate);
router.get('/', userController.getUsers);

// ADMIN-ONLY ROUTES
router.use(requireRole('admin'));

router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.patch('/:id/toggle-active', userController.toggleUserActive);

module.exports = router;