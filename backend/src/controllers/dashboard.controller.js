const prisma = require('../config/db');
const { getAverageProcessingTime } = require('../services/queue.service');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

const getCentreDashboard = async (req, res, next) => {
  try {
    const centreId = parseInt(req.params.centreId);

    // Verify staff assignment safely
    if (req.user.role !== 'ADMIN' && req.user.role !== 'CENTRE_MANAGER') {
      const assignments = req.user.staffProfile?.assignments || [];
      const isAssigned = assignments.some(
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

    // Optional date filter from query parameters if requested
    let dateWhereClause = { gte: startOfDay, lte: endOfDay };
    if (req.query.date) {
      const qDate = new Date(req.query.date);
      const qStart = new Date(qDate.setHours(0, 0, 0, 0));
      const qEnd = new Date(qDate.setHours(23, 59, 59, 999));
      dateWhereClause = { gte: qStart, lte: qEnd };
    }

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
      // 1. Bookings count
      prisma.procurementBooking.count({
        where: { centreId, status: { not: 'CANCELLED' } },
      }),
      // 2. Waiting farmers (WAITING, CALLED, ARRIVED status)
      prisma.queueToken.count({
        where: { centreId, status: { in: ['WAITING', 'CALLED', 'ARRIVED'] } },
      }),
      // 3. Active tokens currently processing
      prisma.queueToken.count({
        where: { centreId, status: 'PROCESSING' },
      }),
      // 4. Completed procurements
      prisma.queueToken.count({
        where: { centreId, status: 'COMPLETED' },
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
      // 7. Booking details list for this centre
      prisma.procurementBooking.findMany({
        where: { centreId },
        include: { 
          farmerProfile: {
            include: { user: true }
          }, 
          crop: true, 
          queueToken: true,
          transaction: { include: { payment: true } } 
        },
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

    // Format bookings for frontend dashboard consumption
    const formattedBookings = todayBookings.map((b) => {
      const farmerName = b.farmerProfile?.user?.name || b.farmerProfile?.name || 'Farmer';
      const farmerMobile = b.farmerProfile?.user?.mobile || b.farmerProfile?.mobile || '';
      const farmerAadhaar = b.farmerProfile?.user?.aadhaar || b.farmerProfile?.aadhaarMasked || 'XXXX-XXXX-1234';
      const tokenNum = b.queueToken?.tokenNumber || b.id.slice(-4);
      const queueTokenId = b.queueToken?.id || null;

      return {
        id: b.id,
        token: tokenNum,
        queueTokenId,
        farmer: farmerName,
        farmerName,
        farmerMobile,
        mobile: farmerMobile,
        farmerAadhaar,
        aadhaar: farmerAadhaar,
        crop: b.crop?.name || 'Wheat',
        cropName: b.crop?.name || 'Wheat',
        cropNameHi: b.crop?.nameHi || b.crop?.name || 'गेहूं',
        cropHi: b.crop?.nameHi || b.crop?.name || 'गेहूं',
        weight: b.weight,
        slotTime: b.slotTime,
        slot: b.slotTime,
        status: b.status,
        cancelReason: b.cancelReason || null,
        isTatkaal: b.isTatkaal || false,
        payment: b.transaction?.payment?.status || 'Pending',
        paymentStatus: b.transaction?.payment?.status || 'Due',
        date: b.date,
      };
    });

    // Format counters list for dashboard
    const formattedCounters = counters.map((c) => {
      const activeToken = c.tokens[0];
      return {
        id: c.id,
        counterNumber: c.counterNumber,
        token: activeToken ? activeToken.tokenNumber : null,
        farmer: activeToken ? activeToken.booking?.farmerProfile?.name || activeToken.booking?.farmerProfile?.user?.name : null,
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
        todayBookings: formattedBookings,
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
