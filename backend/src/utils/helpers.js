const crypto = require('crypto');

/**
 * Hash a sensitive value (Aadhaar, Account Number) for duplication checking.
 */
const hashSensitive = (value) => {
  if (!value) return '';
  // Normalize value by removing non-alphanumeric characters
  const normalized = value.toString().replace(/[^a-zA-Z0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

/**
 * Mask Aadhaar number to display only the last 4 digits (e.g., XXXX XXXX 1234)
 */
const maskAadhaar = (aadhaar) => {
  if (!aadhaar) return '';
  const cleaned = aadhaar.toString().replace(/\s/g, '');
  if (cleaned.length < 4) return 'XXXX XXXX XXXX';
  const last4 = cleaned.slice(-4);
  return `XXXX XXXX ${last4}`;
};

/**
 * Mask Bank Account Number to display only the last 4 digits (e.g., XXXX XXXX 5678)
 */
const maskBankAccount = (accountNo) => {
  if (!accountNo) return '';
  const cleaned = accountNo.toString().replace(/\s/g, '');
  if (cleaned.length < 4) return 'XXXX XXXX XXXX';
  const last4 = cleaned.slice(-4);
  return `XXXX XXXX ${last4}`;
};

/**
 * Calculate distance between two lat/lng coordinates in kilometers using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return parseFloat(distance.toFixed(2));
};

module.exports = {
  hashSensitive,
  maskAadhaar,
  maskBankAccount,
  calculateDistance,
};
