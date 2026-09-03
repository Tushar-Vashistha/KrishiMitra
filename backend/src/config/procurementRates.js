/**
 * Configurable Procurement Processing Rates
 * Rates define how fast a procurement centre can handle, inspect, sample,
 * weigh, and unload crops per minute.
 *
 * 1 Quintal (Qtl) = 100 kg.
 * All rates are defined in Quintals per minute (and equivalent kg per minute).
 */

const CROP_PROCESSING_RATES = {
  'Wheat': {
    rateQtlPerMin: 0.5,      // 50 kg/min -> 25 Qtl = 50 mins, 30 Qtl = 60 mins
    rateKgPerMin: 50,
    unit: '₹/Qtl',
    description: 'Wheat (गेहूं) - Standard mechanical unloading & moisture testing',
  },
  'Paddy': {
    rateQtlPerMin: 0.4,      // 40 kg/min -> 25 Qtl = 62.5 (~63 mins)
    rateKgPerMin: 40,
    unit: '₹/Qtl',
    description: 'Paddy (धान) - Moisture, foreign matter & quality analysis',
  },
  'Rice': {
    rateQtlPerMin: 0.4,      // 40 kg/min
    rateKgPerMin: 40,
    unit: '₹/Qtl',
    description: 'Rice (चावल) - Grading & moisture inspection',
  },
  'Mustard': {
    rateQtlPerMin: 0.35,     // 35 kg/min -> 25 Qtl = ~71 mins
    rateKgPerMin: 35,
    unit: '₹/Qtl',
    description: 'Mustard (सरसों) - Oil content sampling & foreign matter checks',
  },
  'Maize': {
    rateQtlPerMin: 0.5,      // 50 kg/min -> 25 Qtl = 50 mins
    rateKgPerMin: 50,
    unit: '₹/Qtl',
    description: 'Maize (मक्का) - Bulk weighing & grain testing',
  },
  'Sugarcane': {
    rateQtlPerMin: 1.0,      // 100 kg/min -> bulk weighbridge rapid unloading
    rateKgPerMin: 100,
    unit: '₹/Qtl',
    description: 'Sugarcane (गन्ना) - Rapid weighbridge discharge',
  },
  'Chana': {
    rateQtlPerMin: 0.4,      // 40 kg/min
    rateKgPerMin: 40,
    unit: '₹/Qtl',
    description: 'Gram / Chana (चना) - Moisture & pest inspection',
  },
  'Soybean': {
    rateQtlPerMin: 0.4,      // 40 kg/min
    rateKgPerMin: 40,
    unit: '₹/Qtl',
    description: 'Soybean (सोयाबीन) - Grain grading & moisture check',
  },
  'Groundnut': {
    rateQtlPerMin: 0.35,     // 35 kg/min
    rateKgPerMin: 35,
    unit: '₹/Qtl',
    description: 'Groundnut (मूंगफली) - Pod inspection & shell quality',
  },
  'DEFAULT': {
    rateQtlPerMin: 0.4,      // 40 kg/min fallback
    rateKgPerMin: 40,
    unit: '₹/Qtl',
    description: 'Standard grain procurement rate',
  },
};

/**
 * Standard slot duration in minutes.
 * Default standard slots are 3 hours = 180 minutes.
 */
const DEFAULT_SLOT_DURATION_MINUTES = 180;

/**
 * Calculate estimated procurement/processing time in minutes.
 * Formula:
 *   Estimated Time = Crop Quantity (in Quintals) ÷ Procurement Processing Rate (Qtl/min)
 * 
 * @param {string} cropName - Crop name (e.g. 'Wheat', 'Paddy', 'Mustard')
 * @param {number} quantity - Quantity of crop
 * @param {string} unit - Unit of quantity ('Quintal' or 'kg', default 'Quintal')
 * @returns {number} Estimated time required in minutes (minimum 5 minutes for valid quantity)
 */
function calculateEstimatedProcessingTime(cropName, quantity, unit = 'Quintal') {
  const qty = parseFloat(quantity) || 0;
  if (qty <= 0) return 0;

  // Convert kg to Quintal if needed (1 Qtl = 100 kg)
  const qtyInQtl = unit && unit.toLowerCase() === 'kg' ? qty / 100 : qty;

  // Lookup rate for crop
  const normalizedCropName = cropName ? cropName.trim() : 'DEFAULT';
  const config = CROP_PROCESSING_RATES[normalizedCropName] || CROP_PROCESSING_RATES['DEFAULT'];
  const rate = config.rateQtlPerMin || 0.4;

  // Time in minutes = Quantity / Processing Rate
  const rawMinutes = qtyInQtl / rate;

  // Round up to nearest whole minute, with a minimum of 5 minutes for setup & weigh-in
  return Math.max(5, Math.ceil(rawMinutes));
}

/**
 * Helper to calculate minutes between two times formatted like "07:00 AM - 10:00 AM"
 * Defaults to 180 if unparseable.
 */
function parseSlotDurationMinutes(slotTimeStr) {
  if (!slotTimeStr || typeof slotTimeStr !== 'string') {
    return DEFAULT_SLOT_DURATION_MINUTES;
  }

  const parts = slotTimeStr.split('-').map(s => s.trim());
  if (parts.length !== 2) {
    return DEFAULT_SLOT_DURATION_MINUTES;
  }

  const parseTime = (timeStr) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridian = match[3] ? match[3].toUpperCase() : null;

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const startMins = parseTime(parts[0]);
  const endMins = parseTime(parts[1]);

  if (startMins !== null && endMins !== null && endMins > startMins) {
    return endMins - startMins;
  }

  return DEFAULT_SLOT_DURATION_MINUTES;
}

module.exports = {
  CROP_PROCESSING_RATES,
  DEFAULT_SLOT_DURATION_MINUTES,
  calculateEstimatedProcessingTime,
  parseSlotDurationMinutes,
};
