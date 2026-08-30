const express = require('express');
const { getMarketRates, getMarketRatesByCropId } = require('../controllers/crop.controller');

const router = express.Router();

router.get('/rates', getMarketRates);
router.get('/rates/:cropId', getMarketRatesByCropId);

module.exports = router;
