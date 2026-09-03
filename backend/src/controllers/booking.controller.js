const prisma = require('../config/db');
const { generateTokenNumber } = require('../services/queue.service');
const { logAction } = require('../services/audit.service');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const formatTokenCode = (centre, date, tokenNumber) => {
  const codePrefix = centre?.centreId
    ? centre.centreId.split('-').pop()
    : (centre?.name ? centre.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() : 'KM');
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(-2);
  const seq = String(tokenNumber).padStart(3, '0');
  return `${codePrefix}-${d}${m}${y}-${seq}`;
};

const createBooking = async (req, res, next) => {
  try {
    const { cropId, weight, centreId, date, slotTime, vehicleNumber, vehicleType } = req.body;
    const farmerId = req.user.farmerProfile.id;

    // 1. Verify farmer status (auto-verify in DB if pending)
    if (req.user.farmerProfile.status !== 'VERIFIED') {
      await prisma.farmerProfile.update({
        where: { id: farmerId },
        data: { status: 'VERIFIED' },
      });
      req.user.farmerProfile.status = 'VERIFIED';
    }

    // Blacklist check: if trust score is below 25, prevent booking
    if (req.user.farmerProfile.trustScore < 25) {
      throw new BadRequestError('Booking blocked: Your Trust Score is below 25. You are currently blacklisted.');
    }

    // 2. Validate booking date: Same-day booking NOT allowed. Must be at least 1 day in advance.
    const bookingDateObj = new Date(date);
    if (isNaN(bookingDateObj.getTime())) {
      throw new BadRequestError('Invalid booking date provided');
    }

    const today = new Date();
    // Normalize to date-only strings YYYY-MM-DD in local time
    const todayLocalStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const bookingDateStr = new Date(bookingDateObj.getTime() - bookingDateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    if (bookingDateStr <= todayLocalStr) {
      throw new BadRequestError('Booking must be made at least 1 day in advance. Same-day booking is not allowed. For urgent same-day booking, please use Tatkaal Booking.');
    }

    // Prepare immutable startOfDay and endOfDay bounds without mutating queryDate
    const queryDate = new Date(bookingDateStr + 'T12:00:00.000Z');
    const startOfDay = new Date(bookingDateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(bookingDateStr + 'T23:59:59.999Z');

    // Clean slot time (strip '(⚡ Tatkaal)' or extra annotations if present)
    const cleanSlotTime = (slotTime || '').split('(')[0].trim();

    const bookingResult = await prisma.$transaction(async (tx) => {
      // 3. Verify centre exists and is open
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

      // 4. Verify crop exists
      const crop = await tx.crop.findUnique({
        where: { id: cropId },
      });
      if (!crop) {
        throw new NotFoundError('Crop not found');
      }

      // 5. Verify active season (or auto-find/create fallback for current year)
      let season = await tx.procurementSeason.findFirst({
        where: {
          active: true,
          startDate: { lte: queryDate },
          endDate: { gte: queryDate },
        },
      });
      if (!season) {
        season = await tx.procurementSeason.findFirst({
          where: { active: true },
        });
      }
      if (!season) {
        season = await tx.procurementSeason.create({
          data: {
            name: `Procurement Season ${queryDate.getFullYear()}`,
            startDate: new Date(`${queryDate.getFullYear()}-01-01`),
            endDate: new Date(`${queryDate.getFullYear()}-12-31`),
            active: true,
          },
        });
      }

      // 6. Verify slot configuration exists for centre
      let slotConfig = centre.slotConfigs.find(
        (s) => s.slotTime === cleanSlotTime || cleanSlotTime.includes(s.slotTime) || s.slotTime.includes(cleanSlotTime)
      );
      if (!slotConfig) {
        // Fallback default slot config if not configured in DB
        slotConfig = { capacity: 20, slotTime: cleanSlotTime };
      }

      // 7. Check slot capacity and prevent overbooking
      const bookedCount = await tx.procurementBooking.count({
        where: {
          centreId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          slotTime: {
            startsWith: cleanSlotTime.substring(0, 5),
          },
          status: {
            notIn: ['CANCELLED', 'ABSENT'],
          },
        },
      });

      const maxCapacity = slotConfig.capacity || 20;
      if (bookedCount >= maxCapacity) {
        throw new BadRequestError('This slot is fully booked. Please select another slot.');
      }

      // 8. Prevent duplicate active bookings for the same farmer on the same day & slot
      const duplicateBooking = await tx.procurementBooking.findFirst({
        where: {
          farmerProfileId: farmerId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            notIn: ['CANCELLED', 'ABSENT', 'COMPLETED'],
          },
        },
      });

      if (duplicateBooking) {
        throw new BadRequestError('You already have an active booking on this date. Please cancel your existing booking before scheduling a new slot.');
      }

      // 9. Generate unique Booking ID: BK-YYYYMMDD-XXXX
      const dateStr = bookingDateStr.replace(/-/g, '');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const bookingId = `BK-${dateStr}-${randomCode}`;

      // 10. Create booking in database
      const booking = await tx.procurementBooking.create({
        data: {
          id: bookingId,
          farmerProfileId: farmerId,
          centreId,
          cropId,
          seasonId: season.id,
          weight,
          date: queryDate,
          slotTime: cleanSlotTime,
          vehicleNumber,
          vehicleType,
          status: 'BOOKED',
        },
        include: {
          crop: true,
          centre: true,
          farmerProfile: true,
        },
      });

      // 11. Generate Queue Token and formatted token code
      const tokenNumber = await generateTokenNumber(tx, centreId, queryDate);
      const tokenCode = formatTokenCode(centre, queryDate, tokenNumber);

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

      return { booking, token, tokenCode };
    });

    await logAction({
      userId: req.user.id,
      action: 'CREATE_BOOKING',
      entity: 'ProcurementBooking',
      entityId: bookingResult.booking.id,
      metadata: {
        tokenNumber: bookingResult.token.tokenNumber,
        tokenCode: bookingResult.tokenCode,
      },
    });

    const responseBooking = {
      ...bookingResult.booking,
      bookingId: bookingResult.booking.id,
      tokenNumber: bookingResult.tokenCode,
      tokenNumeric: bookingResult.token.tokenNumber,
      farmerId: bookingResult.booking.farmerProfileId,
      farmerName: bookingResult.booking.farmerProfile?.name,
      farmerMobile: bookingResult.booking.farmerProfile?.mobile,
      crop: bookingResult.booking.crop?.name,
      cropName: bookingResult.booking.crop?.name,
      estimatedQuantity: bookingResult.booking.weight,
      procurementCentreId: bookingResult.booking.centreId,
      procurementCentreName: bookingResult.booking.centre?.name,
      bookingDate: bookingResult.booking.date,
      timeSlot: bookingResult.booking.slotTime,
      status: bookingResult.booking.status,
      queueToken: {
        ...bookingResult.token,
        tokenNumber: bookingResult.token.tokenNumber,
        tokenCode: bookingResult.tokenCode,
      },
    };

    res.status(201).json({
      success: true,
      message: 'Slot booked successfully!',
      data: {
        booking: responseBooking,
        token: {
          ...bookingResult.token,
          tokenCode: bookingResult.tokenCode,
        },
      },
      booking: responseBooking,
    });
  } catch (error) {
    next(error);
  }
};


const createTatkaalBooking = async (req, res, next) => {
  try {
    const { cropId, weight, centreId, date, slotTime = 'Immediate', vehicleNumber, vehicleType } = req.body;
    const farmerId = req.user.farmerProfile.id;

    if (req.user.farmerProfile.status !== 'VERIFIED') {
      await prisma.farmerProfile.update({
        where: { id: farmerId },
        data: { status: 'VERIFIED' },
      });
      req.user.farmerProfile.status = 'VERIFIED';
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

const getSlotAvailability = async (req, res, next) => {
  try {
    const { centreId, date } = req.query;
    if (!centreId || !date) {
      throw new BadRequestError('centreId and date (YYYY-MM-DD) query parameters are required');
    }

    const cId = parseInt(centreId);
    const dateStr = date.split('T')[0];
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    const centre = await prisma.procurementCentre.findUnique({
      where: { id: cId },
      include: { slotConfigs: true },
    });

    if (!centre) {
      throw new NotFoundError('Procurement centre not found');
    }

    const bookings = await prisma.procurementBooking.findMany({
      where: {
        centreId: cId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED', 'ABSENT'] },
      },
    });

    const defaultSlots = [
      { id: 1, slotTime: '07:00 AM - 10:00 AM', capacity: 20 },
      { id: 2, slotTime: '10:00 AM - 01:00 PM', capacity: 25 },
      { id: 3, slotTime: '02:00 PM - 05:00 PM', capacity: 20 },
      { id: 4, slotTime: '05:00 PM - 08:00 PM', capacity: 15 },
    ];

    const slotConfigs = (centre.slotConfigs && centre.slotConfigs.length > 0)
      ? centre.slotConfigs
      : defaultSlots;

    const slots = slotConfigs.map((slot, index) => {
      const cleanTime = slot.slotTime.split('(')[0].trim();
      const bookedCount = bookings.filter((b) => b.slotTime.startsWith(cleanTime.substring(0, 5))).length;
      const capacity = slot.capacity || 20;
      const remainingCount = Math.max(0, capacity - bookedCount);

      return {
        id: `SLOT-${slot.id || index + 1}`,
        time: slot.slotTime,
        cleanTime,
        capacity,
        bookedCount,
        remainingCount,
        available: remainingCount > 0,
        status: remainingCount > 0 ? 'available' : 'full',
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

const getTatkaalAvailability = async (req, res, next) => {
  try {
    const { centreId, date } = req.query;
    if (!centreId || !date) {
      throw new BadRequestError('centreId and date (YYYY-MM-DD) query parameters are required');
    }

    const cId = parseInt(centreId);
    const dateStr = date.split('T')[0];
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    const bookings = await prisma.procurementBooking.findMany({
      where: {
        centreId: cId,
        date: { gte: startOfDay, lte: endOfDay },
        isTatkaal: true,
        status: { notIn: ['CANCELLED', 'ABSENT'] },
      },
    });

    const feeSetting = await prisma.systemSetting.findUnique({
      where: { key: 'tatkaal_fee' },
    });
    const tatkaalFee = feeSetting ? parseFloat(feeSetting.value) : 50.0;

    const slots = [
      { id: 'T1', time: '09:00 - 10:00', fee: tatkaalFee },
      { id: 'T2', time: '11:00 - 12:00', fee: tatkaalFee },
      { id: 'T3', time: '14:00 - 15:00', fee: tatkaalFee },
      { id: 'T4', time: '16:00 - 17:00', fee: tatkaalFee },
    ].map(s => {
      const bookedCount = bookings.filter(b => b.slotTime === s.time).length;
      const capacity = 2;
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

const getCentreBookings = async (req, res, next) => {

  try {
    const centreId = parseInt(req.params.centreId);
    const { date, status, slotTime } = req.query;

    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile?.assignments?.some((a) => a.centreId === centreId);
      if (!isAssigned) {
        throw new BadRequestError('You are not authorized to view bookings for this procurement centre');
      }
    }

    const where = { centreId };
    if (date) {
      const dateStr = date.split('T')[0];
      where.date = {
        gte: new Date(dateStr + 'T00:00:00.000Z'),
        lte: new Date(dateStr + 'T23:59:59.999Z'),
      };
    }
    if (status) {
      where.status = status;
    }
    if (slotTime) {
      where.slotTime = { startsWith: slotTime.substring(0, 5) };
    }

    const bookings = await prisma.procurementBooking.findMany({
      where,
      include: {
        farmerProfile: {
          include: { user: true },
        },
        crop: true,
        centre: true,
        queueToken: true,
        transaction: {
          include: { payment: true },
        },
      },
      orderBy: [
        { isTatkaal: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    const formatted = bookings.map((b) => {
      const tokenNumber = b.queueToken?.tokenNumber || 1;
      const tokenCode = formatTokenCode(b.centre, new Date(b.date), tokenNumber);
      return {
        id: b.id,
        bookingId: b.id,
        token: tokenNumber,
        tokenNumber: tokenCode,
        tokenCode,
        queueTokenId: b.queueToken?.id,
        farmerId: b.farmerProfileId,
        farmerName: b.farmerProfile?.name,
        farmerMobile: b.farmerProfile?.mobile,
        farmerAadhaar: b.farmerProfile?.aadhaarMasked,
        crop: b.crop?.name,
        cropName: b.crop?.name,
        cropNameHi: b.crop?.nameHi,
        weight: b.weight,
        estimatedQuantity: b.weight,
        slotTime: b.slotTime,
        bookingDate: b.date,
        status: b.status,
        isTatkaal: b.isTatkaal,
        vehicleNumber: b.vehicleNumber,
        vehicleType: b.vehicleType,
        paymentStatus: b.transaction?.payment?.status || 'Pending',
        createdAt: b.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
      bookings: formatted,
      todayBookings: formatted,
    });
  } catch (error) {
    next(error);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const { status, counterId } = req.body;

    const booking = await prisma.procurementBooking.findUnique({
      where: { id: bookingId },
      include: {
        queueToken: true,
        centre: true,
        farmerProfile: true,
        crop: true,
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile?.assignments?.some((a) => a.centreId === booking.centreId);
      if (!isAssigned) {
        throw new BadRequestError('You are not authorized to manage bookings for this centre');
      }
    }

    // Map status
    let newBookingStatus = status;
    let newQueueStatus = 'WAITING';

    if (status === 'ARRIVED') {
      newBookingStatus = 'ARRIVED';
      newQueueStatus = 'ARRIVED';
    } else if (status === 'PROCESSING') {
      newBookingStatus = 'WEIGHING';
      newQueueStatus = 'PROCESSING';
    } else if (status === 'COMPLETED' || status === 'PROCURED') {
      newBookingStatus = 'COMPLETED';
      newQueueStatus = 'COMPLETED';
    } else if (status === 'CANCELLED') {
      newBookingStatus = 'CANCELLED';
      newQueueStatus = 'CANCELLED';
    } else if (status === 'NO_SHOW' || status === 'ABSENT') {
      newBookingStatus = 'ABSENT';
      newQueueStatus = 'NO_SHOW';
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updBooking = await tx.procurementBooking.update({
        where: { id: bookingId },
        data: { status: newBookingStatus },
        include: {
          crop: true,
          centre: true,
          farmerProfile: true,
          queueToken: true,
        },
      });

      if (booking.queueToken) {
        const tokenData = { status: newQueueStatus };
        if (newQueueStatus === 'ARRIVED') tokenData.arrivedAt = new Date();
        if (newQueueStatus === 'PROCESSING') {
          tokenData.processingStartedAt = new Date();
          if (counterId) tokenData.counterId = parseInt(counterId);
        }
        if (newQueueStatus === 'COMPLETED') tokenData.completedAt = new Date();

        await tx.queueToken.update({
          where: { id: booking.queueToken.id },
          data: tokenData,
        });

        await tx.tokenStatusHistory.create({
          data: {
            tokenId: booking.queueToken.id,
            status: newQueueStatus,
          },
        });
      }

      return updBooking;
    });

    await logAction({
      userId: req.user.id,
      action: `UPDATE_BOOKING_STATUS_${status}`,
      entity: 'ProcurementBooking',
      entityId: bookingId,
      metadata: { newBookingStatus, newQueueStatus },
    });

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${newBookingStatus} successfully`,
      data: updated,
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
  getSlotAvailability,
  getCentreBookings,
  updateBookingStatus,
};

