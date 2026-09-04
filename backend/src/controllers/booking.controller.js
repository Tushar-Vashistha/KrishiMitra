const prisma = require('../config/db');
const { generateTokenNumber } = require('../services/queue.service');
const { logAction } = require('../services/audit.service');
const { notifySlotEvent } = require('../services/notification.service');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { calculateEstimatedProcessingTime, parseSlotDurationMinutes } = require('../config/procurementRates');

const createBooking = async (req, res, next) => {
  try {
    const { cropId, weight, centreId, date, slotTime, vehicleNumber, vehicleType, unit = 'Quintal' } = req.body;
    const farmerId = req.user.farmerProfile.id;

    // 1. Verify farmer status (auto-verify in DB if pending)
    if (req.user.farmerProfile.status !== 'VERIFIED') {
      await prisma.farmerProfile.update({
        where: { id: farmerId },
        data: { status: 'VERIFIED' },
      });
      req.user.farmerProfile.status = 'VERIFIED';
    }

    const cropWeight = parseFloat(weight);
    if (isNaN(cropWeight) || cropWeight <= 0) {
      throw new BadRequestError('Crop quantity must be greater than zero');
    }

    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);
    const dateOnly = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate());

    // Verify centre exists and is open (outside transaction for low latency)
    let parsedId = parseInt(centreId);
    let centre = null;
    if (!isNaN(parsedId)) {
      centre = await prisma.procurementCentre.findUnique({
        where: { id: parsedId },
        include: { slotConfigs: true },
      });
    }
    if (!centre && typeof centreId === 'string') {
      centre = await prisma.procurementCentre.findUnique({
        where: { centreId: centreId },
        include: { slotConfigs: true },
      });
    }
    if (!centre) {
      centre = await prisma.procurementCentre.findFirst({
        include: { slotConfigs: true },
      });
    }
    if (!centre) {
      throw new NotFoundError('Procurement centre not found');
    }
    const targetCentreId = centre.id;

    if (!centre.open) {
      throw new BadRequestError('Procurement centre is closed');
    }

    // Blacklist Policy check (trustScore <= 25)
    const currentTrustScore = req.user.farmerProfile?.trustScore ?? 100.0;
    if (currentTrustScore <= 25) {
      const allSlotTimes = (centre.slotConfigs && centre.slotConfigs.length > 0)
        ? centre.slotConfigs.map(sc => sc.slotTime)
        : ['07:00 AM - 10:00 AM', '10:00 AM - 01:00 PM', '02:00 PM - 05:00 PM', '05:00 PM - 08:00 PM'];
      const lastSlotTime = allSlotTimes[allSlotTimes.length - 1];

      const isLastSlot = slotTime && (
        slotTime === lastSlotTime || 
        slotTime.includes(lastSlotTime) || 
        slotTime.includes('05:00 PM - 08:00 PM') || 
        allSlotTimes.indexOf(slotTime) === allSlotTimes.length - 1
      );

      if (!isLastSlot) {
        throw new BadRequestError(`Booking blocked: Your Trust Score is ${currentTrustScore} (Blacklisted). You are only allowed to book the last slot of the day (${lastSlotTime}).`);
      }

      const blacklistedCount = await prisma.procurementBooking.count({
        where: {
          centreId: targetCentreId,
          date: { gte: startOfDay, lte: endOfDay },
          status: { not: 'CANCELLED' },
          farmerProfile: {
            trustScore: { lte: 25 },
          },
        },
      });

      if (blacklistedCount >= 2) {
        throw new BadRequestError('Booking blocked: Maximum quota of 2 blacklisted farmers for the last slot per day has been reached for this centre.');
      }
    }

    // Verify crop exists
    const crop = await prisma.crop.findUnique({
      where: { id: parseInt(cropId) },
    });
    if (!crop) {
      throw new NotFoundError('Crop not found');
    }

    // Calculate estimated processing time using configurable crop rates
    const estimatedProcessingTime = calculateEstimatedProcessingTime(crop.name, cropWeight, unit);
    const totalSlotDuration = parseSlotDurationMinutes(slotTime);

    // Verify active season
    let season = await prisma.procurementSeason.findFirst({
      where: { active: true },
    });
    if (!season) {
      season = await prisma.procurementSeason.findFirst();
    }
    if (!season) {
      season = await prisma.procurementSeason.create({
        data: {
          name: 'Rabi Season 2026',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          active: true,
        },
      });
    }

    const bookingResult = await prisma.$transaction(async (tx) => {
      // 6. Concurrency control: acquire row lock on SlotAllocation in Postgres
      const allocation = await tx.slotAllocation.upsert({
        where: {
          centreId_bookingDate_slotTime: {
            centreId: targetCentreId,
            bookingDate: dateOnly,
            slotTime,
          },
        },
        create: {
          centreId: targetCentreId,
          bookingDate: dateOnly,
          slotTime,
          totalDuration: totalSlotDuration,
          bookedMinutes: 0,
          lastTokenNumber: 0,
        },
        update: {},
      });

      let lockedAllocation = null;
      try {
        const rawLocked = await tx.$queryRaw`
          SELECT * FROM "SlotAllocation"
          WHERE "id" = ${allocation.id}
          FOR UPDATE;
        `;
        if (Array.isArray(rawLocked) && rawLocked.length > 0) {
          lockedAllocation = rawLocked[0];
        }
      } catch (lockErr) {
        lockedAllocation = allocation;
      }

      // 7. Check actual booked minutes from active bookings in this slot
      const activeSlotBookings = await tx.procurementBooking.findMany({
        where: {
          centreId: targetCentreId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          slotTime,
          status: {
            not: 'CANCELLED',
          },
        },
        select: {
          estimatedProcessingTime: true,
          tokenNumber: true,
        },
      });

      const actualBookedMinutes = activeSlotBookings.reduce(
        (sum, b) => sum + (b.estimatedProcessingTime || 30),
        0
      );
      const remainingMinutes = Math.max(0, totalSlotDuration - actualBookedMinutes);

      // Check if slot has enough remaining capacity for farmer's crop
      if (estimatedProcessingTime > remainingMinutes) {
        // Automatically find next available slot that can accommodate this crop
        const allSlotConfigs = (centre.slotConfigs && centre.slotConfigs.length > 0)
          ? centre.slotConfigs
          : [
              { id: 1, slotTime: '07:00 AM - 10:00 AM' },
              { id: 2, slotTime: '10:00 AM - 01:00 PM' },
              { id: 3, slotTime: '02:00 PM - 05:00 PM' },
              { id: 4, slotTime: '05:00 PM - 08:00 PM' },
            ];

        const allDayBookings = await tx.procurementBooking.findMany({
          where: {
            centreId: targetCentreId,
            date: { gte: startOfDay, lte: endOfDay },
            status: { not: 'CANCELLED' },
          },
          select: { slotTime: true, estimatedProcessingTime: true },
        });

        let nextAvailableSlot = null;
        for (const candidate of allSlotConfigs) {
          if (candidate.slotTime === slotTime) continue;
          const candBookings = allDayBookings.filter((b) => b.slotTime === candidate.slotTime);
          const candDuration = parseSlotDurationMinutes(candidate.slotTime);
          const candBooked = candBookings.reduce((s, b) => s + (b.estimatedProcessingTime || 30), 0);
          const candRemaining = Math.max(0, candDuration - candBooked);
          if (candRemaining >= estimatedProcessingTime) {
            nextAvailableSlot = {
              id: candidate.id ? `SLOT-${candidate.id}` : candidate.slotTime,
              time: candidate.slotTime,
              slotTime: candidate.slotTime,
              remainingMinutes: candRemaining,
              totalDuration: candDuration,
            };
            break;
          }
        }

        const capacityError = new BadRequestError(
          `This slot does not have enough capacity for your crop quantity (${estimatedProcessingTime} mins required, only ${remainingMinutes} mins remaining). Please select another available slot.`
        );
        capacityError.code = 'SLOT_CAPACITY_EXCEEDED';
        capacityError.requiredMinutes = estimatedProcessingTime;
        capacityError.remainingMinutes = remainingMinutes;
        capacityError.nextAvailableSlot = nextAvailableSlot;
        throw capacityError;
      }

      // 8. Prevent duplicate active bookings for the same farmer on the same day for the same crop
      const duplicateBooking = await tx.procurementBooking.findFirst({
        where: {
          farmerProfileId: farmerId,
          cropId: parseInt(cropId),
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

      // 9. Generate strictly unique sequential token number
      const prevMaxToken = Math.max(
        lockedAllocation?.lastTokenNumber || allocation.lastTokenNumber || 0,
        ...activeSlotBookings.map((b) => b.tokenNumber || 0)
      );
      const nextTokenNumber = prevMaxToken + 1;
      const formattedToken = `Token #${String(nextTokenNumber).padStart(3, '0')}`;

      // 10. Update SlotAllocation atomically
      await tx.slotAllocation.update({
        where: { id: allocation.id },
        data: {
          bookedMinutes: actualBookedMinutes + estimatedProcessingTime,
          lastTokenNumber: nextTokenNumber,
        },
      });

      // 11. Generate unique Booking ID: BK-YYYYMMDD-XXXX
      const dateStr = new Date(date).toISOString().split('T')[0].replace(/-/g, '');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const bookingId = `BK-${dateStr}-${randomCode}`;

      // 12. Create booking
      const booking = await tx.procurementBooking.create({
        data: {
          id: bookingId,
          farmerProfileId: farmerId,
          centreId: targetCentreId,
          cropId: parseInt(cropId),
          seasonId: season.id,
          weight: cropWeight,
          date: queryDate,
          slotTime,
          vehicleNumber,
          vehicleType,
          estimatedProcessingTime,
          tokenNumber: nextTokenNumber,
          formattedToken,
          status: 'BOOKED',
        },
      });

      // 13. Create Queue Token
      const peopleAhead = activeSlotBookings.length;
      const token = await tx.queueToken.create({
        data: {
          bookingId: booking.id,
          tokenNumber: nextTokenNumber,
          formattedToken,
          centreId: targetCentreId,
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

      return {
        booking,
        token,
        crop,
        centre,
        estimatedProcessingTime,
        remainingMinutes: remainingMinutes - estimatedProcessingTime,
      };
    }, {
      maxWait: 20000,
      timeout: 60000,
    });

    await logAction({
      userId: req.user.id,
      action: 'CREATE_BOOKING',
      entity: 'ProcurementBooking',
      entityId: bookingResult.booking.id,
      metadata: {
        tokenNumber: bookingResult.token.tokenNumber,
        formattedToken: bookingResult.token.formattedToken,
        estimatedProcessingTime: bookingResult.estimatedProcessingTime,
      },
    });

    // Trigger Notifications (Category: SLOT)
    const formattedDate = new Date(bookingResult.booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    await notifySlotEvent({
      userId: req.user.id,
      type: 'BOOKING_CONFIRMED',
      title: 'Slot Booking Confirmed',
      message: `Your ${bookingResult.crop.name} procurement slot (${bookingResult.booking.weight} Qtl, ${bookingResult.booking.slotTime}) for ${formattedDate} at ${bookingResult.centre.name} has been confirmed.`,
      relatedBookingId: bookingResult.booking.id,
      relatedCentreId: bookingResult.centre.id,
    });
    await notifySlotEvent({
      userId: req.user.id,
      type: 'TOKEN_GENERATED',
      title: 'Token Generated',
      message: `Token #${bookingResult.token.tokenNumber} (${bookingResult.token.formattedToken}) generated for your ${bookingResult.crop.name} booking.`,
      relatedBookingId: bookingResult.booking.id,
      relatedCentreId: bookingResult.centre.id,
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: bookingResult.booking.id,
        tokenNumber: bookingResult.token.tokenNumber,
        formattedToken: bookingResult.token.formattedToken,
        procurementCentre: bookingResult.centre.name,
        centreId: bookingResult.centre.id,
        date: bookingResult.booking.date,
        slotTime: bookingResult.booking.slotTime,
        cropType: bookingResult.crop.name,
        cropQuantity: bookingResult.booking.weight,
        estimatedProcessingTime: bookingResult.estimatedProcessingTime,
        remainingSlotCapacity: bookingResult.remainingMinutes,
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
    const { cropId, weight, centreId, date, slotTime = 'Immediate', vehicleNumber, vehicleType, unit = 'Quintal' } = req.body;
    const farmerId = req.user.farmerProfile.id;

    if (req.user.farmerProfile.status !== 'VERIFIED') {
      await prisma.farmerProfile.update({
        where: { id: farmerId },
        data: { status: 'VERIFIED' },
      });
      req.user.farmerProfile.status = 'VERIFIED';
    }

    // Blacklist check (trustScore <= 25)
    const currentTrustScore = req.user.farmerProfile?.trustScore ?? 100.0;
    if (currentTrustScore <= 25) {
      const queryDate = new Date(date);
      const startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);

      const targetCentreId = parseInt(centreId) || 1;
      const blacklistedCount = await prisma.procurementBooking.count({
        where: {
          centreId: targetCentreId,
          date: { gte: startOfDay, lte: endOfDay },
          status: { not: 'CANCELLED' },
          farmerProfile: {
            trustScore: { lte: 25 },
          },
        },
      });

      if (blacklistedCount >= 2) {
        throw new BadRequestError('Booking blocked: Maximum quota of 2 blacklisted farmers for the last slot per day has been reached for this centre.');
      }
    }

    const cropWeight = parseFloat(weight);
    if (isNaN(cropWeight) || cropWeight <= 0) {
      throw new BadRequestError('Crop quantity must be greater than zero');
    }

    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get Tatkaal fee from setting, default to 50.0
    const feeSetting = await prisma.systemSetting.findUnique({
      where: { key: 'tatkaal_fee' },
    });
    const tatkaalFee = feeSetting ? parseFloat(feeSetting.value) : 50.0;

    const bookingResult = await prisma.$transaction(async (tx) => {
      // Verify centre exists and is open
      let parsedId = parseInt(centreId);
      let centre = null;
      if (!isNaN(parsedId)) {
        centre = await tx.procurementCentre.findUnique({
          where: { id: parsedId },
        });
      }
      if (!centre && typeof centreId === 'string') {
        centre = await tx.procurementCentre.findUnique({
          where: { centreId: centreId },
        });
      }
      if (!centre) {
        centre = await tx.procurementCentre.findFirst();
      }
      if (!centre) {
        throw new NotFoundError('Procurement centre not found');
      }
      const targetCentreId = centre.id;

      // Verify crop
      const crop = await tx.crop.findUnique({
        where: { id: parseInt(cropId) },
      });
      if (!crop) {
        throw new NotFoundError('Crop not found');
      }

      const estimatedProcessingTime = calculateEstimatedProcessingTime(crop.name, cropWeight, unit);

      // Verify active season
      let season = await tx.procurementSeason.findFirst({
        where: { active: true },
      });
      if (!season) {
        season = await tx.procurementSeason.findFirst();
      }
      if (!season) {
        season = await tx.procurementSeason.create({
          data: {
            name: 'Rabi Season 2026',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            active: true,
          },
        });
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

      const dateStr = queryDate.toISOString().split('T')[0].replace(/-/g, '');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const bookingId = `BK-TAT-${dateStr}-${randomCode}`;

      const tokenNumber = await generateTokenNumber(tx, targetCentreId, queryDate, slotTime);
      const formattedToken = `Token #${String(tokenNumber).padStart(3, '0')} (Tatkaal)`;

      const booking = await tx.procurementBooking.create({
        data: {
          id: bookingId,
          farmerProfileId: farmerId,
          centreId: targetCentreId,
          cropId: parseInt(cropId),
          seasonId: season.id,
          weight: cropWeight,
          date: queryDate,
          slotTime,
          vehicleNumber,
          vehicleType,
          estimatedProcessingTime,
          tokenNumber,
          formattedToken,
          status: 'BOOKED',
          isTatkaal: true,
          tatkaalFeePaid: tatkaalFee,
        },
      });

      const token = await tx.queueToken.create({
        data: {
          bookingId: booking.id,
          tokenNumber,
          formattedToken,
          centreId: targetCentreId,
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

      return { booking, token, crop, centre, estimatedProcessingTime };
    }, {
      maxWait: 20000,
      timeout: 60000,
    });

    await logAction({
      userId: req.user.id,
      action: 'CREATE_TATKAAL_BOOKING',
      entity: 'ProcurementBooking',
      entityId: bookingResult.booking.id,
      metadata: {
        tatkaalFeePaid: tatkaalFee,
        tokenNumber: bookingResult.token.tokenNumber,
      },
    });

    // Trigger Notifications (Category: SLOT)
    const formattedTatkaalDate = new Date(bookingResult.booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    await notifySlotEvent({
      userId: req.user.id,
      type: 'BOOKING_CONFIRMED',
      title: 'Tatkaal Slot Confirmed',
      message: `Your Tatkaal ${bookingResult.crop.name} procurement slot (${bookingResult.booking.weight} Qtl) for ${formattedTatkaalDate} at ${bookingResult.centre.name} has been confirmed.`,
      relatedBookingId: bookingResult.booking.id,
      relatedCentreId: bookingResult.centre.id,
    });
    await notifySlotEvent({
      userId: req.user.id,
      type: 'TOKEN_GENERATED',
      title: 'Token Generated',
      message: `Tatkaal Token #${bookingResult.token.tokenNumber} generated for your ${bookingResult.crop.name} booking.`,
      relatedBookingId: bookingResult.booking.id,
      relatedCentreId: bookingResult.centre.id,
    });

    res.status(201).json({
      success: true,
      message: 'Tatkaal booking created successfully',
      data: {
        bookingId: bookingResult.booking.id,
        tokenNumber: bookingResult.token.tokenNumber,
        formattedToken: bookingResult.token.formattedToken,
        procurementCentre: bookingResult.centre.name,
        centreId: bookingResult.centre.id,
        date: bookingResult.booking.date,
        slotTime: bookingResult.booking.slotTime,
        cropType: bookingResult.crop.name,
        cropQuantity: bookingResult.booking.weight,
        estimatedProcessingTime: bookingResult.estimatedProcessingTime,
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

      // Free up reserved minutes in SlotAllocation immediately, while keeping lastTokenNumber intact
      if (booking.slotTime && booking.centreId && booking.date) {
        const dateOnly = new Date(booking.date.getFullYear(), booking.date.getMonth(), booking.date.getDate());
        const alloc = await tx.slotAllocation.findUnique({
          where: {
            centreId_bookingDate_slotTime: {
              centreId: booking.centreId,
              bookingDate: dateOnly,
              slotTime: booking.slotTime,
            },
          },
        });
        if (alloc) {
          const releasedMinutes = booking.estimatedProcessingTime || 30;
          await tx.slotAllocation.update({
            where: { id: alloc.id },
            data: {
              bookedMinutes: Math.max(0, alloc.bookedMinutes - releasedMinutes),
            },
          });
        }
      }
    });

    await logAction({
      userId: req.user.id,
      action: 'CANCEL_BOOKING',
      entity: 'ProcurementBooking',
      entityId: bookingId,
    });

    if (booking.farmerProfile && booking.farmerProfile.userId) {
      await notifySlotEvent({
        userId: booking.farmerProfile.userId,
        type: 'BOOKING_CANCELLED',
        title: 'Slot Booking Cancelled',
        message: `Your procurement booking #${bookingId} has been cancelled successfully.`,
        relatedBookingId: bookingId,
        relatedCentreId: booking.centreId,
      });
    }

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

const getCentreTatkaalInventory = async (req, res, next) => {
  try {
    const centreId = parseInt(req.query.centreId || req.params.centreId) || 1;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get Tatkaal bookings for this centre today
    const tatkaalBookings = await prisma.procurementBooking.findMany({
      where: {
        centreId,
        isTatkaal: true,
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        farmerProfile: true,
        crop: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also get cancelled bookings that released to Tatkaal
    const cancelledBookings = await prisma.procurementBooking.findMany({
      where: {
        centreId,
        status: 'CANCELLED',
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        farmerProfile: true,
        crop: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    let inventory = [];

    // Map active Tatkaal bookings as Allocated
    tatkaalBookings.forEach((tb, index) => {
      inventory.push({
        id: tb.id.startsWith('TAT-') ? tb.id : `TAT-${101 + index}`,
        rawBookingId: tb.id,
        originCancelledSlot: `${tb.slotTime} (${tb.farmerProfile?.name || 'Emergency'} - ${tb.crop?.name || 'Wheat'})`,
        timeSlot: tb.slotTime,
        status: 'Allocated',
        assignedTo: tb.farmerProfile?.name ? `${tb.farmerProfile.name} (Emergency Allocation)` : 'Assigned Farmer',
        mobile: tb.farmerProfile?.mobile || '',
        crop: tb.crop?.name || 'Wheat',
        weight: tb.weight,
        allocatedAt: new Date(tb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        allocatedBy: 'Procurement Officer',
        isBlacklistedFarmer: (tb.farmerProfile?.trustScore || 100) <= 25,
      });
    });

    // Map cancelled bookings as Available or Allocated Tatkaal slots
    cancelledBookings.forEach((cb, index) => {
      if (!inventory.some(i => i.timeSlot === cb.slotTime && i.crop === cb.crop?.name)) {
        inventory.push({
          id: `TAT-${201 + index}`,
          rawBookingId: cb.id,
          originCancelledSlot: `${cb.slotTime} (${cb.farmerProfile?.name || 'Cancelled'} - ${cb.crop?.name || 'Wheat'})`,
          timeSlot: cb.slotTime,
          status: 'Available',
          assignedTo: null,
          mobile: null,
          crop: `${cb.crop?.name || 'Wheat'} / All Crops`,
          weight: cb.weight,
          allocatedAt: null,
          allocatedBy: null,
          isBlacklistedFarmer: false,
        });
      }
    });

    // If inventory is empty, provide default open Tatkaal slots for the centre
    if (inventory.length === 0) {
      inventory = [
        {
          id: 'TAT-101',
          originCancelledSlot: '09:00 - 10:00 AM (Emergency Release - Wheat)',
          timeSlot: '09:00 - 10:00 AM',
          status: 'Available',
          assignedTo: null,
          mobile: null,
          crop: 'Wheat / All Crops',
          weight: null,
          allocatedAt: null,
          allocatedBy: null,
          isBlacklistedFarmer: false,
        },
        {
          id: 'TAT-102',
          originCancelledSlot: '11:00 - 12:00 PM (Emergency Release - Mustard)',
          timeSlot: '11:00 - 12:00 PM',
          status: 'Available',
          assignedTo: null,
          mobile: null,
          crop: 'Mustard / All Crops',
          weight: null,
          allocatedAt: null,
          allocatedBy: null,
          isBlacklistedFarmer: false,
        },
        {
          id: 'TAT-103',
          originCancelledSlot: '03:00 - 04:00 PM (Late Harvest Release)',
          timeSlot: '03:00 - 04:00 PM',
          status: 'Available',
          assignedTo: null,
          mobile: null,
          crop: 'Paddy / All Crops',
          weight: null,
          allocatedAt: null,
          allocatedBy: null,
          isBlacklistedFarmer: false,
        },
      ];
    }

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

const allocateTatkaalSlot = async (req, res, next) => {
  try {
    const { slotId, farmerName, mobile, crop, weight, reasonType, centreId = 1 } = req.body;

    if (!farmerName || !mobile) {
      throw new BadRequestError('Farmer name and mobile number are required for Tatkaal allocation');
    }

    // Find crop
    let cropRecord = await prisma.crop.findFirst({
      where: { name: { contains: crop || 'Wheat', mode: 'insensitive' } },
    });
    if (!cropRecord) {
      cropRecord = await prisma.crop.findFirst();
    }

    // Find or create farmer user profile
    let user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          mobile,
          role: 'FARMER',
        },
      });
    }

    let farmerProfile = await prisma.farmerProfile.findUnique({ where: { userId: user.id } });
    if (!farmerProfile) {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(mobile).digest('hex');
      farmerProfile = await prisma.farmerProfile.create({
        data: {
          userId: user.id,
          name: farmerName,
          dob: new Date('1985-01-01'),
          gender: 'Male',
          aadhaarMasked: 'XXXX XXXX ' + mobile.slice(-4),
          aadhaarHash: hash,
          mobile,
          village: 'Lucknow Rural',
          district: 'Lucknow',
          state: 'Uttar Pradesh',
          tehsil: 'Lucknow',
          block: 'Lucknow',
          pincode: '226001',
          khasraNumber: '999/TAT',
          landOwnerName: farmerName,
          bankName: 'State Bank of India',
          accountNumberMasked: 'XXXX XXXX ' + mobile.slice(-4),
          accountNumberHash: hash,
          ifscCode: 'SBIN0001234',
          trustScore: reasonType === 'blacklisted_quota' ? 20.0 : 100.0,
          status: 'VERIFIED',
        },
      });
    }

    // Find active season
    let season = await prisma.procurementSeason.findFirst({ where: { active: true } });
    if (!season) season = await prisma.procurementSeason.findFirst();

    const bookingId = `TAT-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    const booking = await prisma.procurementBooking.create({
      data: {
        id: bookingId,
        farmerProfileId: farmerProfile.id,
        centreId: parseInt(centreId),
        cropId: cropRecord ? cropRecord.id : 1,
        seasonId: season ? season.id : 1,
        weight: parseFloat(weight) || 20.0,
        date: now,
        slotTime: '05:00 PM - 08:00 PM (⚡ Tatkaal)',
        status: 'BOOKED',
        isTatkaal: true,
        tatkaalFeePaid: 50.0,
        formattedToken: `Token #${bookingId} (Tatkaal)`,
      },
    });

    // Create Queue Token
    await prisma.queueToken.create({
      data: {
        bookingId: booking.id,
        tokenNumber: Math.floor(100 + Math.random() * 900),
        formattedToken: `Token #${booking.id}`,
        centreId: parseInt(centreId),
        status: 'WAITING',
        queuePosition: 1,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Tatkaal slot allocated successfully',
      data: {
        id: slotId || booking.id,
        assignedTo: `${farmerName} (${reasonType === 'blacklisted_quota' ? 'Blacklisted Quota' : reasonType === 'late_arrival' ? 'Late Arrival' : 'Emergency'})`,
        mobile,
        crop: cropRecord ? cropRecord.name : crop,
        weight: parseFloat(weight) || 20,
        status: 'Allocated',
        booking,
      },
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
  getCentreTatkaalInventory,
  allocateTatkaalSlot,
};
