const express = require('express');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.patch('/:id/read', protect, markAsRead);
router.patch('/read-all', protect, markAllAsRead);

module.exports = router;
