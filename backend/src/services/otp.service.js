const logger = require('../utils/logger');

// Simple memory store for OTPs: mobile -> { otp, expiresAt }
const otpStore = new Map();

const requestOTP = async (mobile) => {
  const cleanMobile = mobile ? mobile.toString().trim() : '';
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

  otpStore.set(cleanMobile, { otp, expiresAt });

  logger.info(`[OTP SERVICE] Generated OTP for ${cleanMobile}: ${otp} (Expires in 5 mins)`);
  
  return {
    success: true,
    message: 'OTP sent successfully',
    otp: process.env.NODE_ENV === 'development' ? otp : undefined,
  };
};

const verifyOTP = async (mobile, otp) => {
  const cleanMobile = mobile ? mobile.toString().trim() : '';
  const cleanOtp = otp ? otp.toString().trim() : '';

  // In development, accept 123456 as universal master demo OTP
  if (process.env.NODE_ENV === 'development' && cleanOtp === '123456') {
    logger.info(`[OTP SERVICE] Accepted master demo OTP 123456 for ${cleanMobile}`);
    return true;
  }

  const record = otpStore.get(cleanMobile);
  
  logger.info(`[OTP SERVICE] Verifying for mobile=${cleanMobile}, inputOtp=${cleanOtp}, storedRecord=${record ? record.otp : 'NOT_FOUND'}`);

  if (!record) {
    return false;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanMobile);
    return false;
  }

  if (record.otp.toString().trim() !== cleanOtp) {
    return false;
  }

  // Clear OTP on successful verification
  otpStore.delete(cleanMobile);
  return true;
};

module.exports = {
  requestOTP,
  verifyOTP,
};
