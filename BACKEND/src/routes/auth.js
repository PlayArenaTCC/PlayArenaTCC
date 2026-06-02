const express = require('express');

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { uploadProfilePhoto } = require('../middleware/profilePhotoUpload');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.post('/register', asyncHandler(authController.registerUser));
router.post('/register/proprietario', asyncHandler(authController.registerOwner));
router.post('/register/confirm', asyncHandler(authController.confirmRegistration));
router.post('/register/resend', asyncHandler(authController.resendRegistrationCode));
router.post('/login', asyncHandler(authController.login));
router.post('/password/forgot', asyncHandler(authController.requestPasswordReset));
router.post('/password/verify', asyncHandler(authController.verifyPasswordResetCode));
router.post('/password/reset', asyncHandler(authController.resetPassword));
router.get('/me', authenticate, authController.me);
router.patch('/profile', authenticate, uploadProfilePhoto, asyncHandler(authController.updateProfile));

module.exports = router;
