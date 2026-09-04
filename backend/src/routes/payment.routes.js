const express = require('express');
const {
  getMyPayments,
  getPaymentById,
  triggerPayment,
  updatePaymentStatus,
  syncPaymentStatus,
} = require('../controllers/payment.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { paymentStatusSchema } = require('../utils/validators');

const router = express.Router();

router.get('/my', protect, restrictTo('FARMER'), getMyPayments);
router.get('/:id', protect, getPaymentById);
router.post('/', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), triggerPayment);
router.post('/sync', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), syncPaymentStatus);
router.patch('/:id/status', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), validate(paymentStatusSchema), updatePaymentStatus);

module.exports = router;
