const express = require('express');
const {
  createTatkaalBooking,
  getTatkaalAvailability,
} = require('../controllers/booking.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { tatkaalBookingSchema } = require('../utils/validators');

const router = express.Router();

router.post('/bookings', protect, restrictTo('FARMER'), validate(tatkaalBookingSchema), createTatkaalBooking);
router.get('/availability', protect, restrictTo('FARMER'), getTatkaalAvailability);

module.exports = router;
