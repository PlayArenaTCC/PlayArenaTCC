const express = require('express');

const localizacaoController = require('../controllers/localizacaoController');
const { authenticate, requireRoles } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.use(authenticate, requireRoles('proprietario', 'admin'));
router.get('/cep/:cep', asyncHandler(localizacaoController.lookupCep));
router.get('/geocodificar', asyncHandler(localizacaoController.geocodeAddress));

module.exports = router;
