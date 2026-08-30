const prisma = require('../config/db');
const { getAverageProcessingTime } = require('../services/queue.service');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

const getCentreDashboard = async (req, res, next) => {
  try {
    const centreId = parseInt(req.params.centreId);

    // Verify staff assignment
    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile.assignments.some(
        (a) => a.centreId === centreId
      );
      if (!isAssigned) {
        throw new ForbiddenError('You are not authorized to view the dashboard for this centre');
      }
    }

    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      throw new NotFoundError('Procurement centre not found');
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Gather statistics
    const [
      bookingsCount,
      waitingTokensCount,
      activeTokensCount,
      completedTokensCount,
      counters,
      payments,
      todayBookings,
    ] = await Promise.all([
      // 1. Today's bookings
      prisma.procurementBooking.count({
        where: { centreId, date: { gte: startOfDay, lte: endOfDay }, status: { not: 'CANCELLED' } },
      }),
      // 2. Waiting farmers (WAITING, CALLED, ARRIVED status today)
      prisma.queueToken.count({
        where: { centreId, createdAt: { gte: startOfDay, lte: endOfDay }, status: { in: ['WAITING', 'CALLED', 'ARRIVED'] } },
      }),
      // 3. Active tokens currently processing
      prisma.queueToken.count({
        where: { centreId, createdAt: { gte: startOfDay, lte: endOfDay }, status: 'PROCESSING' },
      }),
      // 4. Completed procurements today
      prisma.queueToken.count({
        where: { centreId, createdAt: { gte: startOfDay, lte: endOfDay }, status: 'COMPLETED' },
      }),
      // 5. Counters
      prisma.counter.findMany({
        where: { centreId },
        include: {
          tokens: {
            where: { status: 'PROCESSING' },
            include: { booking: { include: { farmerProfile: true } } },
          },
        },
      }),
      // 6. Payments
      prisma.payment.findMany({
        where: { transaction: { booking: { centreId } } },
      }),
      // 7. Booking details list
      prisma.procurementBooking.findMany({
        where: { centreId, date: { gte: startOfDay, lte: endOfDay } },
        include: { farmerProfile: true, crop: true, transaction: { include: { payment: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const activeCounters = counters.filter((c) => ['AVAILABLE', 'BUSY'].includes(c.status)).length;
    const totalCounters = counters.length;
    const queueLength = waitingTokensCount;

    const avgProcessingTime = await getAverageProcessingTime(centreId);
    const avgWaitingTime = queueLength * avgProcessingTime;

    const paymentsPending = payments.filter((p) => ['PENDING', 'PROCESSING'].includes(p.status)).length;
    const paymentsCompleted = payments.filter((p) => p.status === 'SUCCESS').length;

    // Format today's bookings for frontend dashboard consumption
    const formattedBookings = todayBookings.map((b) => ({
      id: b.id,
      farmer: b.farmerProfile.name,
      crop: b.crop.name,
      weight: b.weight,
      slot: b.slotTime,
      status: b.status,
      payment: b.transaction?.payment?.status || 'Pending',
      mobile: b.farmerProfile.mobile,
    }));

    // Format counters list for dashboard
    const formattedCounters = counters.map((c) => {
      const activeToken = c.tokens[0];
      return {
        id: c.id,
        counterNumber: c.counterNumber,
        token: activeToken ? activeToken.tokenNumber : null,
        farmer: activeToken ? activeToken.booking.farmerProfile.name : null,
        status: c.status,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          todayBookings: bookingsCount,
          waitingFarmers: waitingTokensCount,
          activeTokens: activeTokensCount,
          completedProcurements: completedTokensCount,
          averageProcessingTime: `${avgProcessingTime} mins`,
          averageWaitingTime: `${avgWaitingTime} mins`,
          activeCounters,
          totalCounters,
          queueLength,
          paymentsPending,
          paymentsCompleted,
        },
        bookings: formattedBookings,
        counters: formattedCounters,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCentreDashboard,
};
