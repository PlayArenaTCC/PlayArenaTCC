const express = require('express');

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.post('/register', asyncHandler(authController.registerUser));
router.post('/register/proprietario', asyncHandler(authController.registerOwner));
router.post('/login', asyncHandler(authController.login));
router.get('/me', authenticate, authController.me);

module.exports = router;
