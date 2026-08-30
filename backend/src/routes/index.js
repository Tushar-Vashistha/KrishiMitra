const express = require('express');
const authRoutes = require('./auth.routes');
const farmerRoutes = require('./farmer.routes');
const centreRoutes = require('./centre.routes');
const cropRoutes = require('./crop.routes');
const marketRoutes = require('./market.routes');
const bookingRoutes = require('./booking.routes');
const tatkaalRoutes = require('./tatkaal.routes');
const queueRoutes = require('./queue.routes');
const procurementRoutes = require('./procurement.routes');
const paymentRoutes = require('./payment.routes');
const notificationRoutes = require('./notification.routes');
const chatbotRoutes = require('./chatbot.routes');

const router = express.Router();

// Mount modules
router.use('/auth', authRoutes);
router.use('/farmers', farmerRoutes);
router.use('/centres', centreRoutes);
router.use('/crops', cropRoutes);
router.use('/market', marketRoutes);
router.use('/bookings', bookingRoutes);
router.use('/tatkaal', tatkaalRoutes);
router.use('/queue', queueRoutes);
router.use('/procurements', procurementRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chatbot', chatbotRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date(),
  });
});

module.exports = router;
