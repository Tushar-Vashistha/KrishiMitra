const prisma = require('../config/db');

/**
 * Generate a unique token number for a centre on a specific date and slot.
 * MUST be called inside a Prisma transaction to prevent duplicate token numbers.
 */
const generateTokenNumber = async (tx, centreId, date, slotTime = null) => {
  const queryDate = new Date(date);
  const startOfDay = new Date(queryDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(queryDate);
  endOfDay.setHours(23, 59, 59, 999);

  const whereClause = {
    centreId,
    date: {
      gte: startOfDay,
      lte: endOfDay,
    },
  };
  if (slotTime) {
    whereClause.slotTime = slotTime;
  }

  const lastBooking = await tx.procurementBooking.findFirst({
    where: whereClause,
    orderBy: {
      tokenNumber: 'desc',
    },
    select: {
      tokenNumber: true,
    },
  });

  return lastBooking && lastBooking.tokenNumber ? lastBooking.tokenNumber + 1 : 1;
};

/**
 * Calculate the average processing time (in minutes) for a centre based on completed tokens.
 */
const getAverageProcessingTime = async (centreId) => {
  const completedTokens = await prisma.queueToken.findMany({
    where: {
      centreId,
      status: 'COMPLETED',
      processingStartedAt: { not: null },
      completedAt: { not: null },
    },
    orderBy: {
      completedAt: 'desc',
    },
    take: 10, // Average over the last 10 completed tokens
  });

  if (completedTokens.length === 0) {
    return 15; // default 15 minutes per token if no data
  }

  let totalMinutes = 0;
  completedTokens.forEach((token) => {
    const diffMs = new Date(token.completedAt) - new Date(token.processingStartedAt);
    totalMinutes += diffMs / (1000 * 60);
  });

  return Math.max(5, Math.round(totalMinutes / completedTokens.length)); // minimum 5 mins
};

/**
 * Calculate the queue position and estimated waiting time for a token.
 */
const getQueueTrackingDetails = async (tokenId) => {
  const token = await prisma.queueToken.findUnique({
    where: { id: tokenId },
    include: {
      booking: {
        include: {
          centre: true,
          crop: true,
        },
      },
      counter: true,
    },
  });

  if (!token) return null;

  if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(token.status)) {
    return {
      token,
      queuePosition: 0,
      peopleAhead: 0,
      estimatedWaitingTime: 0,
    };
  }

  const startOfDay = new Date(token.createdAt);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(token.createdAt);
  endOfDay.setHours(23, 59, 59, 999);

  // Count how many WAITING or CALLED tokens are ahead of this one
  const peopleAhead = await prisma.queueToken.count({
    where: {
      centreId: token.centreId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ['WAITING', 'CALLED'],
      },
      tokenNumber: {
        lt: token.tokenNumber,
      },
    },
  });

  const avgProcTime = await getAverageProcessingTime(token.centreId);
  const estimatedWaitingTime = (peopleAhead + (token.status === 'WAITING' ? 1 : 0)) * avgProcTime;

  return {
    token,
    queuePosition: peopleAhead + 1,
    peopleAhead,
    estimatedWaitingTime,
  };
};

module.exports = {
  generateTokenNumber,
  getAverageProcessingTime,
  getQueueTrackingDetails,
};
