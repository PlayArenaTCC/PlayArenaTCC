const express = require('express');

const adminController = require('../controllers/adminController');
const { authenticate, requireRoles } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.use(authenticate, requireRoles('admin'));

router.get('/dashboard', asyncHandler(adminController.dashboard));
router.get('/usuarios', asyncHandler(adminController.listUsers));
router.patch('/usuarios/:id/status', asyncHandler(adminController.updateUserStatus));
router.get('/proprietarios', asyncHandler(adminController.listOwners));
router.patch('/proprietarios/:id/aprovacao', asyncHandler(adminController.updateOwnerApproval));
router.get('/administradores', asyncHandler(adminController.listAdmins));

module.exports = router;
