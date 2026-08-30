const prisma = require('../config/db');

const calculateTrustScore = async (farmerProfileId) => {
  const bookings = await prisma.procurementBooking.findMany({
    where: { farmerProfileId },
    include: { queueToken: true },
  });

  const total = bookings.length;
  if (total === 0) {
    return {
      score: 100,
      rating: 'Excellent',
      totalBookings: 0,
      completedBookings: 0,
      onTimeRate: 100,
      cancellationRate: 0,
      noShowRate: 0,
      explanation: 'No bookings completed yet. Trust score is set to default (100).',
    };
  }

  let completed = 0;
  let cancelled = 0;
  let noShow = 0;
  let arrivedOnTime = 0;

  bookings.forEach((booking) => {
    if (booking.status === 'COMPLETED') {
      completed++;
    } else if (booking.status === 'CANCELLED') {
      cancelled++;
    }

    if (booking.queueToken) {
      if (booking.queueToken.status === 'NO_SHOW') {
        noShow++;
      } else if (booking.queueToken.arrivedAt && booking.queueToken.calledAt) {
        // Assume arrived on time if arrivedAt is before or equal to calledAt
        if (booking.queueToken.arrivedAt <= booking.queueToken.calledAt) {
          arrivedOnTime++;
        }
      }
    }
  });

  // Trust score formula
  // Start with 100
  let score = 100;
  // Deduct 2 points for every cancellation
  score -= cancelled * 2;
  // Deduct 10 points for every no-show
  score -= noShow * 10;
  // Cap between 0 and 100
  score = Math.max(0, Math.min(100, score));

  const totalNonCancelled = total - cancelled;
  const onTimeRate = totalNonCancelled > 0 ? Math.round((completed / totalNonCancelled) * 100) : 100;
  const cancellationRate = Math.round((cancelled / total) * 100);
  const noShowRate = Math.round((noShow / total) * 100);

  let rating = 'Excellent';
  if (score < 50) rating = 'Poor';
  else if (score < 70) rating = 'Fair';
  else if (score < 90) rating = 'Good';

  // Save the calculated score to the profile
  await prisma.farmerProfile.update({
    where: { id: farmerProfileId },
    data: { trustScore: parseFloat(score.toFixed(1)) },
  });

  return {
    score: parseFloat(score.toFixed(1)),
    rating,
    totalBookings: total,
    completedBookings: completed,
    onTimeRate,
    cancellationRate,
    noShowRate,
    explanation: `Calculated from ${total} bookings: ${completed} completed, ${cancelled} cancelled, and ${noShow} no-shows.`,
  };
};

module.exports = {
  calculateTrustScore,
};
