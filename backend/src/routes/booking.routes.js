const express = require('express');
const {
  createBooking,
  getBookingById,
  cancelBooking,
  getMyBookings,
} = require('../controllers/booking.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { bookingSchema } = require('../utils/validators');

const router = express.Router();

router.post('/', protect, restrictTo('FARMER'), validate(bookingSchema), createBooking);
router.get('/my', protect, restrictTo('FARMER'), getMyBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
