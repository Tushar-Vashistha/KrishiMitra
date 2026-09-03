const logger = require('../utils/logger');

// Simple memory store for OTPs: mobile -> { otp, expiresAt }
const otpStore = new Map();

const cleanMobileNumber = (mobile) => {
  if (!mobile) return '';
  return mobile.toString().replace(/\D/g, '').slice(-10);
};

const getDemoOTP = () => {
  return process.env.DEMO_OTP || '123456';
};

const requestOTP = async (mobile) => {
  const cleanMobile = cleanMobileNumber(mobile);
  const demoOtp = getDemoOTP();
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '15', 10);
  const expiresAt = Date.now() + expiryMinutes * 60 * 1000;

  otpStore.set(cleanMobile, { otp: demoOtp, expiresAt });

  logger.info(`[OTP SERVICE] Generated OTP for ${cleanMobile}: ${demoOtp}`);

  return {
    success: true,
    message: 'OTP sent successfully',
    otp: demoOtp,
  };
};

const verifyOTP = async (mobile, otp) => {
  const cleanMobile = cleanMobileNumber(mobile);
  const cleanOtp = otp ? otp.toString().trim() : '';
  const demoOtp = getDemoOTP();

  if (!cleanOtp) {
    return { valid: false, reason: 'INVALID_OTP', message: 'Invalid OTP' };
  }

  // Master demo OTP (123456) always succeeds for seamless demo/testing
  if (cleanOtp === demoOtp) {
    logger.info(`[OTP SERVICE] Accepted master demo OTP ${demoOtp} for ${cleanMobile}`);
    return { valid: true, message: 'OTP verified successfully' };
  }

  const record = otpStore.get(cleanMobile);

  logger.info(
    `[OTP SERVICE] Verifying for mobile=${cleanMobile}, inputOtp=${cleanOtp}, storedRecord=${record ? record.otp : 'NOT_FOUND'}`
  );

  if (record) {
    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanMobile);
      logger.info(`[OTP SERVICE] OTP expired for ${cleanMobile}`);
      return { valid: false, reason: 'EXPIRED_OTP', message: 'OTP expired' };
    }

    if (cleanOtp === record.otp.toString().trim()) {
      otpStore.delete(cleanMobile);
      logger.info(`[OTP SERVICE] OTP verified successfully for ${cleanMobile}`);
      return { valid: true, message: 'OTP verified successfully' };
    }

    logger.info(`[OTP SERVICE] Invalid OTP attempt for ${cleanMobile}`);
    return { valid: false, reason: 'INVALID_OTP', message: 'Invalid OTP' };
  }

  return { valid: false, reason: 'INVALID_OTP', message: 'Invalid OTP' };
};

module.exports = {
  requestOTP,
  verifyOTP,
  otpStore,
};
