const prisma = require('../config/db');
const { generateTokenNumber } = require('../services/queue.service');
const { logAction } = require('../services/audit.service');
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

    // Blacklist check: if trust score is below 25, prevent booking
    if (req.user.farmerProfile.trustScore < 25) {
      throw new BadRequestError('Booking blocked: Your Trust Score is below 25. You are currently blacklisted.');
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

    // Blacklist check
    if (req.user.farmerProfile.trustScore < 25) {
      throw new BadRequestError('Booking blocked: Your Trust Score is below 25. You are currently blacklisted.');
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
