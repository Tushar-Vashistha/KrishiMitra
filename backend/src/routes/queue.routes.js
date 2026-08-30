const express = require('express');
const {
  getTokenById,
  getMyTokens,
  getCentreQueue,
  callToken,
  arriveToken,
  startToken,
  completeToken,
  noShowToken,
  cancelToken,
} = require('../controllers/queue.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/my', protect, restrictTo('FARMER'), getMyTokens);
router.get('/tokens/:id', protect, getTokenById);
router.get('/centres/:centreId/queue', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), getCentreQueue);

// Staff token action routes
router.post('/:id/call', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), callToken);
router.post('/:id/arrive', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), arriveToken);
router.post('/:id/start', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), startToken);
router.post('/:id/complete', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), completeToken);
router.post('/:id/no-show', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), noShowToken);
router.post('/:id/cancel', protect, restrictTo('ADMIN', 'CENTRE_MANAGER', 'CENTRE_STAFF'), cancelToken);

module.exports = router;
