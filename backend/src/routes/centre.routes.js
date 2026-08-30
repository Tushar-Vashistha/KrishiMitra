const express = require('express');
const {
  getAllCentres,
  getCentreById,
  createCentre,
  updateCentre,
  updateCentreStatus,
  getNearbyCentres,
  getCentreSlotsAvailability,
} = require('../controllers/centre.controller');
const {
  getCentresCounters,
  createCounter,
  updateCounterStatus,
  assignTokenToCounter,
} = require('../controllers/counter.controller');
const { getCentreDashboard } = require('../controllers/dashboard.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', getAllCentres);
router.get('/nearby', getNearbyCentres);
router.get('/:id', getCentreById);
router.get('/:centreId/slots/availability', getCentreSlotsAvailability);

// Protected routes
router.post('/', protect, restrictTo('ADMIN'), createCentre);
router.put('/:id', protect, restrictTo('ADMIN', 'CENTRE_MANAGER'), updateCentre);
router.patch('/:id/status', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), updateCentreStatus);

// Centre Dashboard
router.get('/:centreId/dashboard', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), getCentreDashboard);

// Counters management
router.get('/:centreId/counters', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), getCentresCounters);
router.post('/:centreId/counters', protect, restrictTo('ADMIN', 'CENTRE_MANAGER'), createCounter);
router.patch('/counters/:id/status', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), updateCounterStatus);
router.post('/counters/:id/assign-token', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), assignTokenToCounter);

module.exports = router;
