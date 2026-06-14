const express = require('express');

const notificacaoController = require('../controllers/notificacaoController');
const { authenticateWithOptions, requireRoles } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.use(authenticateWithOptions({ allowInactive: true }), requireRoles('usuario', 'proprietario'));
router.get('/', asyncHandler(notificacaoController.listNotifications));
router.patch('/read-all', asyncHandler(notificacaoController.markAllAsRead));
router.patch('/:id/read', asyncHandler(notificacaoController.markAsRead));

module.exports = router;
