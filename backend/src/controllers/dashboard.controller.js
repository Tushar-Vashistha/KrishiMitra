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

    const dateParam = req.query.date;
    const today = new Date();
    const targetDateStr = dateParam ? dateParam.split('T')[0] : today.toISOString().split('T')[0];
    const startOfDay = new Date(targetDateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(targetDateStr + 'T23:59:59.999Z');

    // Also support querying all recent & upcoming bookings for the centre if no specific date requested
    const bookingsWhere = { centreId };
    if (dateParam) {
      bookingsWhere.date = { gte: startOfDay, lte: endOfDay };
    }

    // Gather statistics
    const [
      bookingsCount,
      waitingTokensCount,
      activeTokensCount,
      completedTokensCount,
      counters,
      payments,
      centreBookingsList,
    ] = await Promise.all([
      // 1. Today's bookings count
      prisma.procurementBooking.count({
        where: { centreId, date: { gte: startOfDay, lte: endOfDay }, status: { notIn: ['CANCELLED', 'ABSENT'] } },
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
      // 7. Booking details list (with queueToken, farmerProfile, crop)
      prisma.procurementBooking.findMany({
        where: bookingsWhere,
        include: {
          farmerProfile: true,
          crop: true,
          queueToken: true,
          transaction: { include: { payment: true } },
        },
        orderBy: [{ isTatkaal: 'desc' }, { date: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    const activeCounters = counters.filter((c) => ['AVAILABLE', 'BUSY'].includes(c.status)).length;
    const totalCounters = counters.length;
    const queueLength = waitingTokensCount;

    const avgProcessingTime = await getAverageProcessingTime(centreId);
    const avgWaitingTime = queueLength * avgProcessingTime;

    const paymentsPending = payments.filter((p) => ['PENDING', 'PROCESSING'].includes(p.status)).length;
    const paymentsCompleted = payments.filter((p) => p.status === 'SUCCESS').length;

    const codePrefix = centre.centreId
      ? centre.centreId.split('-').pop()
      : (centre.name ? centre.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() : 'BHP');

    // Format bookings for frontend dashboard consumption
    const formattedBookings = centreBookingsList.map((b) => {
      const tokenNum = b.queueToken?.tokenNumber || 1;
      const bDate = new Date(b.date);
      const d = String(bDate.getDate()).padStart(2, '0');
      const m = String(bDate.getMonth() + 1).padStart(2, '0');
      const y = String(bDate.getFullYear()).slice(-2);
      const tokenCode = `${codePrefix}-${d}${m}${y}-${String(tokenNum).padStart(3, '0')}`;

      return {
        id: b.id,
        bookingId: b.id,
        token: tokenNum,
        tokenNumber: tokenCode,
        tokenCode,
        queueTokenId: b.queueToken?.id,
        farmer: b.farmerProfile?.name || 'Farmer',
        farmerName: b.farmerProfile?.name || 'Farmer',
        farmerMobile: b.farmerProfile?.mobile || '',
        mobile: b.farmerProfile?.mobile || '',
        farmerAadhaar: b.farmerProfile?.aadhaarMasked || 'XXXX-XXXX-XXXX',
        crop: b.crop?.name,
        cropName: b.crop?.name,
        cropNameHi: b.crop?.nameHi,
        weight: b.weight,
        estimatedQuantity: b.weight,
        slot: b.slotTime,
        slotTime: b.slotTime,
        status: b.status,
        isTatkaal: b.isTatkaal,
        payment: b.transaction?.payment?.status || 'Pending',
        paymentStatus: b.transaction?.payment?.status || 'Pending',
        date: b.date,
        bookingDate: b.date,
      };
    });

    // Format counters list for dashboard
    const formattedCounters = counters.map((c) => {
      const activeToken = c.tokens[0];
      return {
        id: c.id,
        counterNumber: c.counterNumber,
        token: activeToken ? activeToken.tokenNumber : null,
        farmer: activeToken ? activeToken.booking.farmerProfile?.name : null,
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
