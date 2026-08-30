const prisma = require('../config/db');
const { calculateTrustScore } = require('../services/trust.service');
const { logAction } = require('../services/audit.service');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const getMeProfile = async (req, res, next) => {
  try {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!farmer) {
      throw new NotFoundError('Farmer profile not found');
    }
    res.status(200).json({
      success: true,
      data: farmer,
    });
  } catch (error) {
    next(error);
  }
};

const updateMeProfile = async (req, res, next) => {
  try {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!farmer) {
      throw new NotFoundError('Farmer profile not found');
    }

    // Filter updateable fields
    const {
      name, village, district, state, tehsil, block, pincode,
      khasraNumber, landOwnerName, bankName, accountNumber, ifscCode
    } = req.body;

    const updateData = {
      name, village, district, state, tehsil, block, pincode,
      khasraNumber, landOwnerName, bankName, ifscCode
    };

    // Clean undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    if (accountNumber) {
      const { hashSensitive, maskBankAccount } = require('../utils/helpers');
      updateData.accountNumberMasked = maskBankAccount(accountNumber);
      updateData.accountNumberHash = hashSensitive(accountNumber);
    }

    const updatedFarmer = await prisma.farmerProfile.update({
      where: { id: farmer.id },
      data: updateData,
    });

    await logAction({
      userId: req.user.id,
      action: 'UPDATE_FARMER_PROFILE',
      entity: 'FarmerProfile',
      entityId: farmer.id,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedFarmer,
    });
  } catch (error) {
    next(error);
  }
};

const getMeStatistics = async (req, res, next) => {
  try {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!farmer) {
      throw new NotFoundError('Farmer profile not found');
    }

    const bookings = await prisma.procurementBooking.findMany({
      where: { farmerProfileId: farmer.id },
      include: { transaction: { include: { payment: true } } },
    });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const pendingBookings = bookings.filter(b => ['BOOKED', 'ARRIVED', 'WEIGHING', 'QUALITY_CHECK'].includes(b.status)).length;
    
    let totalWeightProcured = 0;
    let totalEarnings = 0;

    bookings.forEach(b => {
      if (b.status === 'COMPLETED' && b.transaction) {
        totalWeightProcured += b.transaction.netWeight;
        if (b.transaction.payment && b.transaction.payment.status === 'SUCCESS') {
          totalEarnings += b.transaction.amount;
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        completedBookings,
        pendingBookings,
        totalWeightProcured,
        totalEarnings,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMeTrustScore = async (req, res, next) => {
  try {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!farmer) {
      throw new NotFoundError('Farmer profile not found');
    }

    const scoreData = await calculateTrustScore(farmer.id);

    res.status(200).json({
      success: true,
      data: scoreData,
    });
  } catch (error) {
    next(error);
  }
};

const getMeBookings = async (req, res, next) => {
  try {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!farmer) {
      throw new NotFoundError('Farmer profile not found');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const where = { farmerProfileId: farmer.id };
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.procurementBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          crop: true,
          centre: true,
          queueToken: true,
          transaction: true,
        },
      }),
      prisma.procurementBooking.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMePayments = async (req, res, next) => {
  try {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!farmer) {
      throw new NotFoundError('Farmer profile not found');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {
      booking: {
        farmerProfileId: farmer.id,
      },
    };

    const [transactions, total] = await Promise.all([
      prisma.procurementTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              centre: true,
              crop: true,
            },
          },
          payment: true,
        },
      }),
      prisma.procurementTransaction.count({ where }),
    ]);

    // Map to frontend-friendly payment list
    const payments = transactions.map((t) => ({
      id: t.payment?.id || `TXN-REF-${t.id}`,
      transactionId: t.payment?.transactionNumber || `TXN-${t.id}`,
      date: t.createdAt.toISOString().split('T')[0],
      crop: t.booking.crop.name,
      quantity: `${t.netWeight} Qtl`,
      amount: t.amount,
      status: t.payment?.status || 'PENDING',
      centre: t.booking.centre.name,
    }));

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllFarmers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search;
    const status = req.query.status;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [farmers, total] = await Promise.all([
      prisma.farmerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.farmerProfile.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: farmers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getFarmerById = async (req, res, next) => {
  try {
    const farmerId = parseInt(req.params.id);
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: farmerId },
      include: {
        verificationHistory: {
          include: { verifiedBy: true },
        },
      },
    });

    if (!farmer) {
      throw new NotFoundError('Farmer profile not found');
    }

    res.status(200).json({
      success: true,
      data: farmer,
    });
  } catch (error) {
    next(error);
  }
};

const verifyFarmer = async (req, res, next) => {
  try {
    const farmerId = parseInt(req.params.id);
    const { status, remarks } = req.body;

    if (!['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      throw new BadRequestError('Invalid verification status');
    }

    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: farmerId },
    });
    if (!farmer) {
      throw new NotFoundError('Farmer profile not found');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedFarmer = await tx.farmerProfile.update({
        where: { id: farmerId },
        data: { status },
      });

      await tx.farmerVerificationHistory.create({
        data: {
          farmerProfileId: farmerId,
          status,
          remarks,
          verifiedById: req.user.id,
        },
      });

      return updatedFarmer;
    });

    await logAction({
      userId: req.user.id,
      action: `FARMER_VERIFICATION_${status}`,
      entity: 'FarmerProfile',
      entityId: farmerId,
      metadata: { remarks },
    });

    res.status(200).json({
      success: true,
      message: `Farmer status updated to ${status} successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMeProfile,
  updateMeProfile,
  getMeStatistics,
  getMeTrustScore,
  getMeBookings,
  getMePayments,
  getAllFarmers,
  getFarmerById,
  verifyFarmer,
};
