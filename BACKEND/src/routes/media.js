const express = require('express');

const mediaController = require('../controllers/mediaController');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.get('/:id', asyncHandler(mediaController.getMedia));

module.exports = router;
