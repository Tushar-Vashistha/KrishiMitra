const prisma = require('../config/db');
const { calculateDistance } = require('../utils/helpers');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { logAction } = require('../services/audit.service');

const getAllCentres = async (req, res, next) => {
  try {
    const centres = await prisma.procurementCentre.findMany({
      include: {
        slotConfigs: true,
      },
    });
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
    const { centreId, name, nameHi, type, address, lat, lng, openingTime, closingTime, phone, slots } = req.body;

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
        // Fallback default slots
        const defaultSlots = [
          '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
          '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
          '16:00 - 17:00', '17:00 - 18:00'
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
    const { name, nameHi, type, address, lat, lng, openingTime, closingTime, phone, open } = req.body;

    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
    });
    if (!centre) {
      throw new NotFoundError('Procurement Centre not found');
    }

    const updated = await prisma.procurementCentre.update({
      where: { id: centreId },
      data: { name, nameHi, type, address, lat, lng, openingTime, closingTime, phone, open },
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
    const { date, cropId } = req.query;

    if (!date) {
      throw new BadRequestError('Date parameter (YYYY-MM-DD) is required');
    }

    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
      include: {
        slotConfigs: true,
      },
    });

    if (!centre) {
      throw new NotFoundError('Procurement Centre not found');
    }

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

    const slots = centre.slotConfigs.map((slot) => {
      const bookedCount = bookings.filter((b) => b.slotTime === slot.slotTime).length;
      const remainingCount = Math.max(0, slot.capacity - bookedCount);

      return {
        id: `SLOT-${slot.id}`,
        time: slot.slotTime,
        capacity: slot.capacity,
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

module.exports = {
  getAllCentres,
  getCentreById,
  createCentre,
  updateCentre,
  updateCentreStatus,
  getNearbyCentres,
  getCentreSlotsAvailability,
};
