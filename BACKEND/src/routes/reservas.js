const express = require('express');

const reservaController = require('../controllers/reservaController');
const { authenticate, requireRoles } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.post('/', authenticate, requireRoles('usuario'), asyncHandler(reservaController.createReservation));
router.get('/minhas', authenticate, requireRoles('usuario'), asyncHandler(reservaController.listMyReservations));
router.get('/proprietario', authenticate, requireRoles('proprietario'), asyncHandler(reservaController.listOwnerReservations));
router.get('/todas', authenticate, requireRoles('admin'), asyncHandler(reservaController.listAllReservations));
router.patch('/:id/status', authenticate, requireRoles('proprietario', 'admin'), asyncHandler(reservaController.updateStatus));
router.patch('/:id/cancelar', authenticate, asyncHandler(reservaController.cancelReservation));

module.exports = router;
