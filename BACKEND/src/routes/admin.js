const express = require('express');

const adminController = require('../controllers/adminController');
const { authenticate, requireRoles } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.use(authenticate, requireRoles('admin'));

router.get('/dashboard', asyncHandler(adminController.dashboard));
router.get('/usuarios', asyncHandler(adminController.listUsers));
router.patch('/usuarios/:id/bloqueio-temporario', asyncHandler(adminController.blockUserTemporarily));
router.delete('/usuarios/:id/bloqueio-temporario', asyncHandler(adminController.clearUserTemporaryBlock));
router.patch('/usuarios/:id/desbanir', asyncHandler(adminController.unbanUser));
router.delete('/usuarios/:id/deletar-conta', asyncHandler(adminController.deleteUserAccount));
router.delete('/usuarios/:id', asyncHandler(adminController.banUser));
router.get('/proprietarios', asyncHandler(adminController.listOwners));
router.patch('/proprietarios/:id/bloqueio-temporario', asyncHandler(adminController.blockOwnerTemporarily));
router.delete('/proprietarios/:id/bloqueio-temporario', asyncHandler(adminController.clearOwnerTemporaryBlock));
router.patch('/proprietarios/:id/desbanir', asyncHandler(adminController.unbanOwner));
router.delete('/proprietarios/:id/deletar-conta', asyncHandler(adminController.deleteOwnerAccount));
router.delete('/proprietarios/:id', asyncHandler(adminController.banOwner));
router.patch('/proprietarios/:id/aprovacao', asyncHandler(adminController.updateOwnerApproval));
router.get('/documentacoes', asyncHandler(adminController.listDocumentations));
router.patch('/documentacoes/:id/status', asyncHandler(adminController.reviewDocumentation));
router.get('/avisos', asyncHandler(adminController.listAdminAlerts));
router.get('/avisos/:id', asyncHandler(adminController.getAdminAlert));
router.patch('/avisos/:id/status', asyncHandler(adminController.updateAdminAlertStatus));
router.get('/administradores', asyncHandler(adminController.listAdmins));
router.post('/administradores', asyncHandler(adminController.createAdmin));
router.patch('/perfil/senha', asyncHandler(adminController.changeOwnPassword));
router.get('/espacos', asyncHandler(adminController.listSpaces));
router.post('/espacos', asyncHandler(adminController.createSpace));
router.put('/espacos/:id', asyncHandler(adminController.updateSpace));
router.patch('/espacos/:id/desativacao', asyncHandler(adminController.deactivateSpace));
router.delete('/espacos/:id/desativacao', asyncHandler(adminController.clearSpaceDeactivation));
router.delete('/espacos/:id', asyncHandler(adminController.deleteSpace));

module.exports = router;
