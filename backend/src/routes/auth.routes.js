const express = require('express');
const {
  registerFarmer,
  registerCentre,
  login,
  refresh,
  logout,
  getMe,
  handleRequestOTP,
  handleVerifyOTP,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  registerFarmerSchema,
  registerCentreSchema,
  loginSchema,
} = require('../utils/validators');

const router = express.Router();

router.post('/register/farmer', validate(registerFarmerSchema), registerFarmer);
router.post('/register/centre', validate(registerCentreSchema), registerCentre);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

router.post('/otp/request', handleRequestOTP);
router.post('/otp/verify', handleVerifyOTP);

module.exports = router;
