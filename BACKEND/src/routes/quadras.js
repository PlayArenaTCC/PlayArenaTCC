const express = require('express');

const quadraController = require('../controllers/quadraController');
const { authenticate, requireRoles } = require('../middleware/auth');
<<<<<<< Updated upstream
=======
const { uploadCourtPhotos } = require('../middleware/courtPhotoUpload');
const { uploadDocuments } = require('../middleware/documentUpload');
>>>>>>> Stashed changes
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.get('/', asyncHandler(quadraController.listCourts));
router.get('/minhas', authenticate, requireRoles('proprietario'), asyncHandler(quadraController.listOwnerCourts));
<<<<<<< Updated upstream
=======
router.get('/documentacoes/minhas', authenticate, requireRoles('proprietario'), asyncHandler(quadraController.listOwnerDocumentations));
router.post('/documentos', authenticate, requireRoles('proprietario'), uploadDocuments, asyncHandler(quadraController.uploadDocuments));
router.post('/fotos', authenticate, requireRoles('proprietario', 'admin'), uploadCourtPhotos, asyncHandler(quadraController.uploadPhotos));
>>>>>>> Stashed changes
router.get('/:id/horarios', asyncHandler(quadraController.listSchedules));
router.post('/:id/horarios', authenticate, requireRoles('proprietario', 'admin'), asyncHandler(quadraController.createSchedule));
router.delete('/:quadraId/horarios/:horarioId', authenticate, requireRoles('proprietario', 'admin'), asyncHandler(quadraController.deleteSchedule));
router.get('/:id', asyncHandler(quadraController.getCourt));
router.post('/', authenticate, requireRoles('proprietario', 'admin'), asyncHandler(quadraController.createCourt));
router.put('/:id', authenticate, requireRoles('proprietario', 'admin'), asyncHandler(quadraController.updateCourt));
router.delete('/:id', authenticate, requireRoles('proprietario', 'admin'), asyncHandler(quadraController.deleteCourt));

module.exports = router;
