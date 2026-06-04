const express = require('express');

const notificacaoController = require('../controllers/notificacaoController');
const { authenticate, requireRoles } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.use(authenticate, requireRoles('usuario'));
router.get('/', asyncHandler(notificacaoController.listNotifications));
router.patch('/read-all', asyncHandler(notificacaoController.markAllAsRead));
router.patch('/:id/read', asyncHandler(notificacaoController.markAsRead));

module.exports = router;
