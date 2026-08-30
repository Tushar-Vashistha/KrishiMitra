const logger = require('../utils/logger');

// Simple memory store for OTPs: mobile -> { otp, expiresAt }
const otpStore = new Map();

const requestOTP = async (mobile) => {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

  otpStore.set(mobile, { otp, expiresAt });

  // In production, we'd call an SMS gateway. For now, we print to log.
  logger.info(`[OTP SERVICE] Generated OTP for ${mobile}: ${otp} (Expires in 5 mins)`);
  
  return {
    success: true,
    message: 'OTP sent successfully',
    // In dev environment, we can return the OTP directly for testing convenience
    otp: process.env.NODE_ENV === 'development' ? otp : undefined,
  };
};

const verifyOTP = async (mobile, otp) => {
  const record = otpStore.get(mobile);
  
  if (!record) {
    return false;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(mobile);
    return false;
  }

  if (record.otp !== otp) {
    return false;
  }

  // Clear OTP on successful verification
  otpStore.delete(mobile);
  return true;
};

module.exports = {
  requestOTP,
  verifyOTP,
};
