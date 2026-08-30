const express = require('express');
const {
  createProcurement,
  getProcurementById,
  registerWeighing,
  registerQualityInspection,
  getMyProcurements,
  getCentreProcurements,
} = require('../controllers/procurement.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { weighingSchema, qualitySchema } = require('../utils/validators');

const router = express.Router();

router.post('/', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), createProcurement);
router.get('/my', protect, restrictTo('FARMER'), getMyProcurements);
router.get('/:id', protect, getProcurementById);
router.get('/centres/:centreId/procurements', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), getCentreProcurements);

router.post('/:id/weighing', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), validate(weighingSchema), registerWeighing);
router.post('/:id/quality', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), validate(qualitySchema), registerQualityInspection);

module.exports = router;
