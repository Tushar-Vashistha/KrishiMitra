const prisma = require('../config/db');
const { NotFoundError } = require('../utils/errors');

/**
 * Calculate the procurement rate and total amount server-side.
 */
const calculateProcurementPrice = async ({ cropId, centreId, gradeName, quantity, date }) => {
  const queryDate = date ? new Date(date) : new Date();

  // Find the effective crop price for the selected crop and centre (or global price if centreId is null)
  const priceRecord = await prisma.cropPrice.findFirst({
    where: {
      cropId,
      effectiveDate: { lte: queryDate },
      OR: [
        { centreId },
        { centreId: null }
      ]
    },
    orderBy: [
      { centreId: 'desc' }, // prioritize centre-specific price
      { effectiveDate: 'desc' }
    ]
  });

  if (!priceRecord) {
    throw new NotFoundError('No active price record found for this crop and centre');
  }

  // Base rate is the Minimum Support Price (MSP)
  let rate = priceRecord.mspPrice;

  // Apply grade price adjustment if applicable
  if (gradeName) {
    const grade = await prisma.cropGrade.findFirst({
      where: {
        cropId,
        name: { equals: gradeName, mode: 'insensitive' }
      }
    });

    if (grade) {
      rate += grade.priceAdjustment;
    }
  }

  const amount = parseFloat((rate * quantity).toFixed(2));

  return {
    baseMspPrice: priceRecord.mspPrice,
    marketPrice: priceRecord.marketPrice,
    rateUsed: rate,
    amount,
  };
};

module.exports = {
  calculateProcurementPrice,
};
