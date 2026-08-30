const express = require('express');
const {
  getMeProfile,
  updateMeProfile,
  getMeStatistics,
  getMeTrustScore,
  getMeBookings,
  getMePayments,
  getAllFarmers,
  getFarmerById,
  verifyFarmer,
} = require('../controllers/farmer.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Farmer self routes
router.get('/me', protect, restrictTo('FARMER'), getMeProfile);
router.put('/me', protect, restrictTo('FARMER'), updateMeProfile);
router.get('/me/statistics', protect, restrictTo('FARMER'), getMeStatistics);
router.get('/me/trust-score', protect, restrictTo('FARMER'), getMeTrustScore);
router.get('/me/bookings', protect, restrictTo('FARMER'), getMeBookings);
router.get('/me/payments', protect, restrictTo('FARMER'), getMePayments);

// Staff/Admin routes
router.get('/', protect, restrictTo('ADMIN', 'CENTRE_STAFF', 'CENTRE_MANAGER'), getAllFarmers);
router.get('/:id', protect, restrictTo('ADMIN', 'CENTRE_STAFF', 'CENTRE_MANAGER'), getFarmerById);
router.patch('/:id/verification', protect, restrictTo('ADMIN', 'CENTRE_MANAGER'), verifyFarmer);

module.exports = router;
