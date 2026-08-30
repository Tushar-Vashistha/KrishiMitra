const express = require('express');
const { getAllCrops, getCropById } = require('../controllers/crop.controller');

const router = express.Router();

router.get('/', getAllCrops);
router.get('/:id', getCropById);

module.exports = router;
