const prisma = require('../config/db');

/**
 * Calculate dynamic trust score based on history logs.
 */
const calculateTrustScore = async (farmerProfileId) => {
  const history = await prisma.trustScoreHistory.findMany({
    where: { farmerProfileId },
  });

  // Calculate score starting from 100
  let score = 100.0;
  history.forEach((log) => {
    score += log.points;
  });

  // Cap between 0 and 100
  score = Math.max(0.0, Math.min(100.0, score));

  // Fetch stats for the breakdown
  const bookings = await prisma.procurementBooking.findMany({
    where: { farmerProfileId },
    include: { queueToken: true },
  });

  const total = bookings.length;
  let completed = 0;
  let cancelled = 0;
  let noShow = 0;

  bookings.forEach((b) => {
    if (b.status === 'COMPLETED') completed++;
    else if (b.status === 'CANCELLED') cancelled++;
    
    if (b.queueToken && b.queueToken.status === 'NO_SHOW') {
      noShow++;
    }
  });

  const totalNonCancelled = total - cancelled;
  const onTimeRate = totalNonCancelled > 0 ? Math.round((completed / totalNonCancelled) * 100) : 100;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
  const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;

  let rating = 'Excellent';
  if (score < 50) rating = 'Poor';
  else if (score < 70) rating = 'Fair';
  else if (score < 90) rating = 'Good';

  // Save the calculated score to the farmer profile
  await prisma.farmerProfile.update({
    where: { id: farmerProfileId },
    data: { trustScore: score },
  });

  // Format log history for the dashboard log
  const historyLog = history.map((h) => ({
    id: h.id,
    event: h.event,
    points: h.points >= 0 ? `+${h.points}` : `${h.points}`,
    date: h.date.toISOString().split('T')[0],
  }));

  return {
    score,
    rating,
    totalBookings: total,
    completedBookings: completed,
    onTimeRate,
    cancellationRate,
    noShowRate,
    explanation: score < 25 ? 'Your score is below 25. You are blacklisted from booking slots.' : 'Keep up the good work!',
    history: historyLog,
  };
};

/**
 * Record a new trust score event (e.g. +10 on time, -25 absent)
 */
const addTrustEvent = async (farmerProfileId, event, points) => {
  const log = await prisma.trustScoreHistory.create({
    data: {
      farmerProfileId,
      event,
      points,
    },
  });

  // Re-calculate and save
  await calculateTrustScore(farmerProfileId);
  return log;
};

module.exports = {
  calculateTrustScore,
  addTrustEvent,
};
