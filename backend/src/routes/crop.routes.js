const express = require('express');
const { getAllCrops, getCropById, getProcessingRates } = require('../controllers/crop.controller');

const router = express.Router();

router.get('/processing-rates', getProcessingRates);
router.get('/', getAllCrops);
router.get('/:id', getCropById);

module.exports = router;
