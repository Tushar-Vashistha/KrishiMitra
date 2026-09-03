const express = require('express');
const {
  createBooking,
  getBookingById,
  cancelBooking,
  getMyBookings,
  getSlotAvailability,
  getCentreBookings,
  updateBookingStatus,
} = require('../controllers/booking.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { bookingSchema } = require('../utils/validators');

const router = express.Router();

// Public / General Availability
router.get('/availability', getSlotAvailability);

// Farmer Routes
router.post('/', protect, restrictTo('FARMER'), validate(bookingSchema), createBooking);
router.get('/my', protect, restrictTo('FARMER'), getMyBookings);

// Centre Staff / Manager / Admin Routes
router.get('/centre/:centreId', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), getCentreBookings);
router.patch('/:id/status', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), updateBookingStatus);

// Common / Specific Booking Routes
router.get('/:id', protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
