const express = require('express');

const quadraController = require('../controllers/quadraController');
const { authenticate, requireRoles } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.get('/', asyncHandler(quadraController.listCourts));
router.get('/minhas', authenticate, requireRoles('proprietario'), asyncHandler(quadraController.listOwnerCourts));
router.get('/:id/horarios', asyncHandler(quadraController.listSchedules));
router.post('/:id/horarios', authenticate, requireRoles('proprietario', 'admin'), asyncHandler(quadraController.createSchedule));
router.delete('/:quadraId/horarios/:horarioId', authenticate, requireRoles('proprietario', 'admin'), asyncHandler(quadraController.deleteSchedule));
router.get('/:id', asyncHandler(quadraController.getCourt));
router.post('/', authenticate, requireRoles('proprietario', 'admin'), asyncHandler(quadraController.createCourt));
router.put('/:id', authenticate, requireRoles('proprietario', 'admin'), asyncHandler(quadraController.updateCourt));
router.delete('/:id', authenticate, requireRoles('proprietario', 'admin'), asyncHandler(quadraController.deleteCourt));

module.exports = router;
