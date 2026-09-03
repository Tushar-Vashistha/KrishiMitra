const express = require('express');
const {
  createTatkaalBooking,
  getTatkaalAvailability,
  getCentreTatkaalInventory,
  allocateTatkaalSlot,
} = require('../controllers/booking.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { tatkaalBookingSchema } = require('../utils/validators');

const router = express.Router();

router.post('/bookings', protect, restrictTo('FARMER'), validate(tatkaalBookingSchema), createTatkaalBooking);
router.get('/availability', protect, getTatkaalAvailability);
router.get('/centre-inventory', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), getCentreTatkaalInventory);
router.post('/allocate', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), allocateTatkaalSlot);

module.exports = router;
