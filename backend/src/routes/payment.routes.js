const express = require('express');
const {
  getMyPayments,
  getPaymentById,
  triggerPayment,
  updatePaymentStatus,
} = require('../controllers/payment.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { paymentStatusSchema } = require('../utils/validators');

const router = express.Router();

router.get('/my', protect, restrictTo('FARMER'), getMyPayments);
router.get('/:id', protect, getPaymentById);
router.post('/', protect, restrictTo('ADMIN', 'CENTRE_MANAGER'), triggerPayment);
router.patch('/:id/status', protect, restrictTo('ADMIN', 'CENTRE_MANAGER'), validate(paymentStatusSchema), updatePaymentStatus);

module.exports = router;
