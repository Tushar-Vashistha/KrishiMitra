const prisma = require('../config/db');
const { calculateDistance } = require('../utils/helpers');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { logAction } = require('../services/audit.service');
const memoryCache = require('../utils/cache');
const { calculateEstimatedProcessingTime, parseSlotDurationMinutes } = require('../config/procurementRates');

const getAllCentres = async (req, res, next) => {
  try {
    const cachedCentres = memoryCache.get('all_centres');
    if (cachedCentres) {
      return res.status(200).json({
        success: true,
        data: cachedCentres,
      });
    }

    const centres = await prisma.procurementCentre.findMany({
      include: {
        slotConfigs: true,
      },
    });

    memoryCache.set('all_centres', centres, 120); // 2 minutes cache
    res.status(200).json({
      success: true,
      data: centres,
    });
  } catch (error) {
    next(error);
  }
};

const getCentreById = async (req, res, next) => {
  try {
    const centreId = parseInt(req.params.id);
    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
      include: {
        slotConfigs: true,
      },
    });
    if (!centre) {
      throw new NotFoundError('Procurement Centre not found');
    }
    res.status(200).json({
      success: true,
      data: centre,
    });
  } catch (error) {
    next(error);
  }
};

const createCentre = async (req, res, next) => {
  try {
    const {
      centreId, name, nameHi, type, address, lat, lng, openingTime, closingTime, phone, slots,
      agencyName, licenseNumber, panGstin, managerName, designation, mobile, email,
      state, district, tehsil, village, capacity, maxStorage,
      weighingFacility, qualityTesting, godownStorage, staffCount
    } = req.body;

    const existing = await prisma.procurementCentre.findUnique({
      where: { centreId },
    });
    if (existing) {
      throw new BadRequestError(`Procurement Centre with ID ${centreId} already exists`);
    }

    const centre = await prisma.$transaction(async (tx) => {
      const created = await tx.procurementCentre.create({
        data: {
          centreId, name, nameHi, type, address, lat, lng, openingTime, closingTime, phone,
          agencyName, licenseNumber, panGstin, managerName, designation, mobile, email,
          state, district, tehsil, village,
          capacity: capacity ? parseFloat(capacity) : null,
          maxStorage: maxStorage ? parseFloat(maxStorage) : null,
          weighingFacility: weighingFacility !== undefined ? weighingFacility : true,
          qualityTesting: qualityTesting !== undefined ? qualityTesting : true,
          godownStorage: godownStorage !== undefined ? godownStorage : true,
          staffCount: staffCount ? parseInt(staffCount) : 5,
        },
      });

      // Create slot configurations
      if (slots && Array.isArray(slots)) {
        const slotData = slots.map((s) => ({
          centreId: created.id,
          slotTime: s.time || s.slotTime,
          capacity: s.capacity || 10,
        }));
        await tx.slotConfig.createMany({ data: slotData });
      } else {
        // Fallback default slots (matching the 3-hour blocks in UI)
        const defaultSlots = [
          '07:00 AM - 10:00 AM',
          '10:00 AM - 01:00 PM',
          '02:00 PM - 05:00 PM',
          '05:00 PM - 08:00 PM'
        ];
        const slotData = defaultSlots.map((time) => ({
          centreId: created.id,
          slotTime: time,
          capacity: 10,
        }));
        await tx.slotConfig.createMany({ data: slotData });
      }

      return created;
    });

    await logAction({
      userId: req.user ? req.user.id : null,
      action: 'CREATE_CENTRE',
      entity: 'ProcurementCentre',
      entityId: centre.id,
      metadata: { name, centreId },
    });

    res.status(201).json({
      success: true,
      message: 'Procurement Centre created successfully',
      data: centre,
    });
  } catch (error) {
    next(error);
  }
};

const updateCentre = async (req, res, next) => {
  try {
    const centreId = parseInt(req.params.id);
    const {
      name, nameHi, type, address, lat, lng, openingTime, closingTime, phone, open,
      agencyName, licenseNumber, panGstin, managerName, designation, mobile, email,
      state, district, tehsil, village, capacity, maxStorage,
      weighingFacility, qualityTesting, godownStorage, staffCount
    } = req.body;

    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
    });
    if (!centre) {
      throw new NotFoundError('Procurement Centre not found');
    }

    const updated = await prisma.procurementCentre.update({
      where: { id: centreId },
      data: {
        name, nameHi, type, address, lat, lng, openingTime, closingTime, phone, open,
        agencyName, licenseNumber, panGstin, managerName, designation, mobile, email,
        state, district, tehsil, village,
        capacity: capacity ? parseFloat(capacity) : undefined,
        maxStorage: maxStorage ? parseFloat(maxStorage) : undefined,
        weighingFacility, qualityTesting, godownStorage,
        staffCount: staffCount ? parseInt(staffCount) : undefined,
      },
    });

    await logAction({
      userId: req.user.id,
      action: 'UPDATE_CENTRE',
      entity: 'ProcurementCentre',
      entityId: centreId,
    });

    res.status(200).json({
      success: true,
      message: 'Procurement Centre updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const updateCentreStatus = async (req, res, next) => {
  try {
    const centreId = parseInt(req.params.id);
    const { open } = req.body;

    if (open === undefined) {
      throw new BadRequestError('Open status boolean is required');
    }

    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
    });
    if (!centre) {
      throw new NotFoundError('Procurement Centre not found');
    }

    const updated = await prisma.procurementCentre.update({
      where: { id: centreId },
      data: { open },
    });

    await logAction({
      userId: req.user.id,
      action: `CENTRE_STATUS_${open ? 'OPEN' : 'CLOSED'}`,
      entity: 'ProcurementCentre',
      entityId: centreId,
    });

    res.status(200).json({
      success: true,
      message: `Centre status updated to ${open ? 'Open' : 'Closed'} successfully`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const getNearbyCentres = async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.latitude);
    const lng = parseFloat(req.query.longitude);
    const radius = parseFloat(req.query.radius) || 15; // default to 15 km

    if (isNaN(lat) || isNaN(lng)) {
      throw new BadRequestError('Latitude and longitude parameters are required');
    }

    const centres = await prisma.procurementCentre.findMany({
      include: {
        prices: {
          include: { crop: true },
        },
        slotConfigs: true,
      },
    });

    const nearby = centres
      .map((centre) => {
        const distance = calculateDistance(lat, lng, centre.lat, centre.lng);
        // Find supported crops based on linked prices or fallback to global crops
        const supportedCrops = Array.from(new Set(centre.prices.map((p) => p.crop.name)));
        
        // Sum total available slots today
        const slotsAvailable = centre.slotConfigs.length;

        return {
          id: centre.id,
          centreId: centre.centreId,
          name: centre.name,
          nameHi: centre.nameHi,
          type: centre.type,
          distance: `${distance} km`,
          distanceVal: distance, // for sorting/filtering
          open: centre.open,
          openTime: centre.openingTime,
          closeTime: centre.closingTime,
          slotsAvailable,
          address: centre.address,
          latitude: centre.lat,
          longitude: centre.lng,
          crops: supportedCrops.length > 0 ? supportedCrops : ['Wheat', 'Paddy', 'Mustard', 'Maize'],
          phone: centre.phone,
        };
      })
      .filter((c) => c.distanceVal <= radius)
      .sort((a, b) => a.distanceVal - b.distanceVal);

    res.status(200).json({
      success: true,
      data: nearby,
    });
  } catch (error) {
    next(error);
  }
};

const getCentreSlotsAvailability = async (req, res, next) => {
  try {
    const centreId = parseInt(req.params.centreId);
    const { date, cropId, quantity, unit } = req.query;

    if (!date) {
      throw new BadRequestError('Date parameter (YYYY-MM-DD) is required');
    }

    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
      include: {
        slotConfigs: true,
      },
    });

    if (!centre) {
      throw new NotFoundError('Procurement Centre not found');
    }

    // Determine crop name and farmer required minutes
    let cropName = 'Wheat';
    if (cropId) {
      const crop = await prisma.crop.findUnique({
        where: { id: parseInt(cropId) },
      });
      if (crop) cropName = crop.name;
    }

    const farmerQuantity = parseFloat(quantity) || 0;
    const requiredMinutes = farmerQuantity > 0
      ? calculateEstimatedProcessingTime(cropName, farmerQuantity, unit || 'Quintal')
      : 0;

    // Get all non-cancelled bookings for this centre on this date
    const bookings = await prisma.procurementBooking.findMany({
      where: {
        centreId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: 'CANCELLED',
        },
      },
    });

    const defaultSlotConfigs = [
      { id: 1, slotTime: '07:00 AM - 10:00 AM', capacity: 10 },
      { id: 2, slotTime: '10:00 AM - 01:00 PM', capacity: 10 },
      { id: 3, slotTime: '02:00 PM - 05:00 PM', capacity: 10 },
      { id: 4, slotTime: '05:00 PM - 08:00 PM', capacity: 10 },
    ];

    let slotConfigs = (centre.slotConfigs && centre.slotConfigs.length > 0 && !centre.slotConfigs.some(s => s.slotTime.includes('08:00')))
      ? centre.slotConfigs
      : defaultSlotConfigs;

    let nextAvailableSlot = null;

    const slots = slotConfigs.map((slot) => {
      const slotBookings = bookings.filter((b) => b.slotTime === slot.slotTime);
      const bookedCount = slotBookings.length;
      const totalSlotDuration = parseSlotDurationMinutes(slot.slotTime);

      const bookedMinutes = slotBookings.reduce((sum, b) => {
        return sum + (b.estimatedProcessingTime || 30);
      }, 0);

      const remainingMinutes = Math.max(0, totalSlotDuration - bookedMinutes);
      const remainingCount = Math.max(0, slot.capacity - bookedCount);

      // A slot is available if remaining minutes can accommodate the farmer's required time
      const effectiveRequired = requiredMinutes > 0 ? requiredMinutes : 1;
      const isAvailable = remainingMinutes >= effectiveRequired && centre.open;

      let status = 'available';
      if (!isAvailable || remainingMinutes <= 0) {
        status = 'full';
      } else if (remainingMinutes <= 30) {
        status = 'limited';
      }

      const slotObj = {
        id: `SLOT-${slot.id}`,
        time: slot.slotTime,
        capacity: slot.capacity,
        totalCapacityMinutes: totalSlotDuration,
        totalSlotDuration,
        bookedMinutes,
        remainingMinutes,
        bookedCount,
        remainingCount,
        requiredMinutes,
        available: isAvailable,
        status,
      };

      if (isAvailable && !nextAvailableSlot) {
        nextAvailableSlot = slotObj;
      }

      return slotObj;
    });

    res.status(200).json({
      success: true,
      data: slots,
      slots,
      meta: {
        cropName,
        quantity: farmerQuantity,
        requiredMinutes,
        nextAvailableSlot,
      },
      nextAvailableSlot,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCentres,
  getCentreById,
  createCentre,
  updateCentre,
  updateCentreStatus,
  getNearbyCentres,
  getCentreSlotsAvailability,
};
