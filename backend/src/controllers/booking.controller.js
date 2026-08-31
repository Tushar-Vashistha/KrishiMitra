const prisma = require('../config/db');
const { generateTokenNumber } = require('../services/queue.service');
const { logAction } = require('../services/audit.service');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const createBooking = async (req, res, next) => {
  try {
    const { cropId, weight, centreId, date, slotTime, vehicleNumber, vehicleType } = req.body;
    const farmerId = req.user.farmerProfile.id;

    // 1. Verify farmer status is VERIFIED
    if (req.user.farmerProfile.status !== 'VERIFIED') {
      throw new BadRequestError('Farmer profile must be VERIFIED to book a slot');
    }

    // Blacklist check: if trust score is below 25, prevent booking
    if (req.user.farmerProfile.trustScore < 25) {
      throw new BadRequestError('Booking blocked: Your Trust Score is below 25. You are currently blacklisted.');
    }

    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    const bookingResult = await prisma.$transaction(async (tx) => {
      // 2. Verify centre exists and is open
      const centre = await tx.procurementCentre.findUnique({
        where: { id: centreId },
        include: { slotConfigs: true },
      });
      if (!centre) {
        throw new NotFoundError('Procurement centre not found');
      }
      if (!centre.open) {
        throw new BadRequestError('Procurement centre is closed');
      }

      // 3. Verify crop exists
      const crop = await tx.crop.findUnique({
        where: { id: cropId },
      });
      if (!crop) {
        throw new NotFoundError('Crop not found');
      }

      // 4. Verify active season
      const season = await tx.procurementSeason.findFirst({
        where: {
          active: true,
          startDate: { lte: queryDate },
          endDate: { gte: queryDate },
        },
      });
      if (!season) {
        throw new BadRequestError('No active procurement season found for the selected date');
      }

      // 5. Verify slot configuration exists for centre
      const slotConfig = centre.slotConfigs.find((s) => s.slotTime === slotTime);
      if (!slotConfig) {
        throw new BadRequestError(`Slot time ${slotTime} is not supported by this centre`);
      }

      // 6. Check slot capacity and prevent overbooking
      const bookedCount = await tx.procurementBooking.count({
        where: {
          centreId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          slotTime,
          status: {
            not: 'CANCELLED',
          },
        },
      });

      if (bookedCount >= slotConfig.capacity) {
        throw new BadRequestError('This slot is fully booked');
      }

      // 7. Prevent duplicate active bookings for the same farmer on the same day for the same crop
      const duplicateBooking = await tx.procurementBooking.findFirst({
        where: {
          farmerProfileId: farmerId,
          cropId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            not: 'CANCELLED',
          },
        },
      });
      if (duplicateBooking) {
        throw new BadRequestError('You already have an active booking for this crop on the selected date');
      }

      // 8. Generate unique Booking ID: BK-YYYYMMDD-XXXX
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const bookingId = `BK-${dateStr}-${randomCode}`;

      // 9. Create booking
      const booking = await tx.procurementBooking.create({
        data: {
          id: bookingId,
          farmerProfileId: farmerId,
          centreId,
          cropId,
          seasonId: season.id,
          weight,
          date: queryDate,
          slotTime,
          vehicleNumber,
          vehicleType,
          status: 'BOOKED',
        },
      });

      // 10. Generate Queue Token immediately
      const tokenNumber = await generateTokenNumber(tx, centreId, queryDate);
      
      const peopleAhead = await tx.queueToken.count({
        where: {
          centreId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'WAITING',
        },
      });

      const token = await tx.queueToken.create({
        data: {
          bookingId: booking.id,
          tokenNumber,
          centreId,
          status: 'WAITING',
          queuePosition: peopleAhead + 1,
        },
      });

      await tx.tokenStatusHistory.create({
        data: {
          tokenId: token.id,
          status: 'WAITING',
        },
      });

      return { booking, token };
    });

    await logAction({
      userId: req.user.id,
      action: 'CREATE_BOOKING',
      entity: 'ProcurementBooking',
      entityId: bookingResult.booking.id,
      metadata: { tokenNumber: bookingResult.token.tokenNumber },
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: bookingResult.booking,
        token: bookingResult.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createTatkaalBooking = async (req, res, next) => {
  try {
    const { cropId, weight, centreId, date, slotTime, vehicleNumber, vehicleType } = req.body;
    const farmerId = req.user.farmerProfile.id;

    if (req.user.farmerProfile.status !== 'VERIFIED') {
      throw new BadRequestError('Farmer profile must be VERIFIED to book Tatkaal slots');
    }

    // Blacklist check
    if (req.user.farmerProfile.trustScore < 25) {
      throw new BadRequestError('Booking blocked: Your Trust Score is below 25. You are currently blacklisted.');
    }

    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Get Tatkaal fee from setting, default to 50.0
    const feeSetting = await prisma.systemSetting.findUnique({
      where: { key: 'tatkaal_fee' },
    });
    const tatkaalFee = feeSetting ? parseFloat(feeSetting.value) : 50.0;

    const bookingResult = await prisma.$transaction(async (tx) => {
      // Verify centre exists and is open
      const centre = await tx.procurementCentre.findUnique({
        where: { id: centreId },
      });
      if (!centre) {
        throw new NotFoundError('Procurement centre not found');
      }

      // Verify active season
      const season = await tx.procurementSeason.findFirst({
        where: {
          active: true,
          startDate: { lte: queryDate },
          endDate: { gte: queryDate },
        },
      });
      if (!season) {
        throw new BadRequestError('No active procurement season found for the selected date');
      }

      // Prevent duplicate active Tatkaal booking on the same day
      const duplicateBooking = await tx.procurementBooking.findFirst({
        where: {
          farmerProfileId: farmerId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          isTatkaal: true,
          status: {
            not: 'CANCELLED',
          },
        },
      });
      if (duplicateBooking) {
        throw new BadRequestError('You already have an active Tatkaal booking on the selected date');
      }

      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const bookingId = `BK-TAT-${dateStr}-${randomCode}`;

      const booking = await tx.procurementBooking.create({
        data: {
          id: bookingId,
          farmerProfileId: farmerId,
          centreId,
          cropId,
          seasonId: season.id,
          weight,
          date: queryDate,
          slotTime,
          vehicleNumber,
          vehicleType,
          status: 'BOOKED',
          isTatkaal: true,
          tatkaalFeePaid: tatkaalFee,
        },
      });

      const tokenNumber = await generateTokenNumber(tx, centreId, queryDate);
      
      const token = await tx.queueToken.create({
        data: {
          bookingId: booking.id,
          tokenNumber,
          centreId,
          status: 'WAITING',
          queuePosition: 1, // Tatkaal jumps to high priority
        },
      });

      await tx.tokenStatusHistory.create({
        data: {
          tokenId: token.id,
          status: 'WAITING',
        },
      });

      return { booking, token };
    });

    await logAction({
      userId: req.user.id,
      action: 'CREATE_TATKAAL_BOOKING',
      entity: 'ProcurementBooking',
      entityId: bookingResult.booking.id,
      metadata: { tatkaalFeePaid: tatkaalFee },
    });

    res.status(201).json({
      success: true,
      message: 'Tatkaal booking created successfully',
      data: {
        booking: bookingResult.booking,
        token: bookingResult.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await prisma.procurementBooking.findUnique({
      where: { id: req.params.id },
      include: {
        crop: true,
        centre: true,
        queueToken: true,
        farmerProfile: true,
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Role-based access check
    if (req.user.role === 'FARMER' && booking.farmerProfile.userId !== req.user.id) {
      throw new BadRequestError('You are not authorized to view this booking');
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    const booking = await prisma.procurementBooking.findUnique({
      where: { id: bookingId },
      include: {
        farmerProfile: true,
        queueToken: true,
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check authorization: farmer can only cancel their own booking
    if (req.user.role === 'FARMER' && booking.farmerProfile.userId !== req.user.id) {
      throw new BadRequestError('You can only cancel your own bookings');
    }

    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot cancel a booking in ${booking.status} status`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.procurementBooking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      });

      if (booking.queueToken) {
        await tx.queueToken.update({
          where: { id: booking.queueToken.id },
          data: { status: 'CANCELLED' },
        });

        await tx.tokenStatusHistory.create({
          data: {
            tokenId: booking.queueToken.id,
            status: 'CANCELLED',
          },
        });
      }
    });

    await logAction({
      userId: req.user.id,
      action: 'CANCEL_BOOKING',
      entity: 'ProcurementBooking',
      entityId: bookingId,
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!farmer) {
      throw new NotFoundError('Farmer profile not found');
    }

    const bookings = await prisma.procurementBooking.findMany({
      where: { farmerProfileId: farmer.id },
      include: {
        crop: true,
        centre: true,
        queueToken: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

const getTatkaalAvailability = async (req, res, next) => {
  try {
    const { centreId, date } = req.query;
    if (!centreId || !date) {
      throw new BadRequestError('centreId and date (YYYY-MM-DD) query parameters are required');
    }

    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Get active Tatkaal bookings today for this centre
    const bookings = await prisma.procurementBooking.findMany({
      where: {
        centreId: parseInt(centreId),
        date: { gte: startOfDay, lte: endOfDay },
        isTatkaal: true,
        status: { not: 'CANCELLED' },
      },
    });

    const feeSetting = await prisma.systemSetting.findUnique({
      where: { key: 'tatkaal_fee' },
    });
    const tatkaalFee = feeSetting ? parseFloat(feeSetting.value) : 50.0;

    // Define standard Tatkaal slots: usually 4 slots per centre with capacity 2 each
    const slots = [
      { id: 'T1', time: '09:00 - 10:00', fee: tatkaalFee },
      { id: 'T2', time: '11:00 - 12:00', fee: tatkaalFee },
      { id: 'T3', time: '14:00 - 15:00', fee: tatkaalFee },
      { id: 'T4', time: '16:00 - 17:00', fee: tatkaalFee },
    ].map(s => {
      const bookedCount = bookings.filter(b => b.slotTime === s.time).length;
      const capacity = 2; // limit to 2 tatkaal bookings per slot
      const remaining = Math.max(0, capacity - bookedCount);
      return {
        ...s,
        capacity,
        bookedCount,
        remainingCount: remaining,
        available: remaining > 0,
      };
    });

    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  createTatkaalBooking,
  getBookingById,
  cancelBooking,
  getMyBookings,
  getTatkaalAvailability,
};
