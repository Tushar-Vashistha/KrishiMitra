const prisma = require('../config/db');
const { calculateProcurementPrice } = require('../services/pricing.service');
const { logAction } = require('../services/audit.service');
const { addTrustEvent, calculateTrustScore } = require('../services/trust.service');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

const createProcurement = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await prisma.procurementBooking.findUnique({
      where: { id: bookingId },
      include: {
        transaction: true,
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.transaction) {
      return res.status(200).json({
        success: true,
        message: 'Procurement transaction already initialized',
        data: booking.transaction,
      });
    }

    // Verify staff assignment
    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile.assignments.some(
        (a) => a.centreId === booking.centreId
      );
      if (!isAssigned) {
        throw new ForbiddenError('You are not authorized to process bookings for this centre');
      }
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // Update booking status
      await tx.procurementBooking.update({
        where: { id: bookingId },
        data: { status: 'ARRIVED' },
      });

      return tx.procurementTransaction.create({
        data: {
          bookingId,
          netWeight: 0,
          rateUsed: 0,
          amount: 0,
          status: 'ARRIVED',
        },
      });
    });

    await logAction({
      userId: req.user.id,
      action: 'INITIALIZE_PROCUREMENT',
      entity: 'ProcurementTransaction',
      entityId: transaction.id,
    });

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

const getProcurementById = async (req, res, next) => {
  try {
    const procurement = await prisma.procurementTransaction.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        booking: {
          include: {
            farmerProfile: true,
            centre: true,
            crop: true,
          },
        },
        weighingRecord: true,
        qualityInspection: true,
        payment: true,
      },
    });

    if (!procurement) {
      throw new NotFoundError('Procurement record not found');
    }

    // Auth check: farmer can only view their own procurement
    if (req.user.role === 'FARMER') {
      if (procurement.booking.farmerProfile.userId !== req.user.id) {
        throw new ForbiddenError('You are not authorized to view this procurement record');
      }
    }

    res.status(200).json({
      success: true,
      data: procurement,
    });
  } catch (error) {
    next(error);
  }
};

const registerWeighing = async (req, res, next) => {
  try {
    const transactionId = parseInt(req.params.id);
    const { grossWeight, tareWeight, deviceMetadata } = req.body;

    if (grossWeight <= tareWeight) {
      throw new BadRequestError('Gross weight must be greater than tare weight');
    }

    const netWeight = parseFloat((grossWeight - tareWeight).toFixed(2));

    const transaction = await prisma.procurementTransaction.findUnique({
      where: { id: transactionId },
      include: {
        booking: true,
        weighingRecord: true,
      },
    });

    if (!transaction) {
      throw new NotFoundError('Procurement transaction not found');
    }

    if (transaction.weighingRecord) {
      throw new BadRequestError('Weighing record already exists and cannot be overwritten');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create weighing record
      const record = await tx.weighingRecord.create({
        data: {
          transactionId,
          grossWeight,
          tareWeight,
          netWeight,
          operatorId: req.user.id,
          deviceMetadata,
        },
      });

      // Update transaction status & netWeight
      const updatedTx = await tx.procurementTransaction.update({
        where: { id: transactionId },
        data: {
          netWeight,
          status: 'WEIGHING',
        },
      });

      // Update booking status
      await tx.procurementBooking.update({
        where: { id: transaction.bookingId },
        data: { status: 'WEIGHING' },
      });

      return { record, transaction: updatedTx };
    });

    await logAction({
      userId: req.user.id,
      action: 'REGISTER_WEIGHING',
      entity: 'WeighingRecord',
      entityId: result.record.id,
      metadata: { netWeight },
    });

    res.status(201).json({
      success: true,
      message: 'Weighing registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const registerQualityInspection = async (req, res, next) => {
  try {
    const transactionId = parseInt(req.params.id);
    const { moisture, foreignMatter, grade, result, rejectionReason } = req.body;

    const transaction = await prisma.procurementTransaction.findUnique({
      where: { id: transactionId },
      include: {
        booking: true,
        qualityInspection: true,
      },
    });

    if (!transaction) {
      throw new NotFoundError('Procurement transaction not found');
    }

    if (transaction.netWeight <= 0) {
      throw new BadRequestError('Please complete weighing registration first');
    }

    const priceResult = await calculateProcurementPrice({
      cropId: transaction.booking.cropId,
      centreId: transaction.booking.centreId,
      gradeName: grade,
      quantity: transaction.netWeight,
      date: transaction.booking.date,
    });

    const resultTx = await prisma.$transaction(async (tx) => {
      // Create quality check record
      const inspection = await tx.qualityInspection.create({
        data: {
          transactionId,
          moisture,
          foreignMatter,
          grade,
          result,
          rejectionReason: result === 'FAILED' ? rejectionReason : null,
          inspectorId: req.user.id,
        },
      });

      const finalStatus = result === 'FAILED' ? 'REJECTED' : 'COMPLETED';

      // Update transaction details
      const updatedTx = await tx.procurementTransaction.update({
        where: { id: transactionId },
        data: {
          rateUsed: priceResult.rateUsed,
          amount: result === 'FAILED' ? 0 : priceResult.amount,
          status: finalStatus,
        },
      });

      // Update booking status
      await tx.procurementBooking.update({
        where: { id: transaction.bookingId },
        data: { status: finalStatus },
      });

      // Also update QueueToken if present
      await tx.queueToken.updateMany({
        where: { bookingId: transaction.bookingId },
        data: { status: finalStatus === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED', completedAt: new Date() },
      });

      // If passed, automatically create a payment record
      let payment = null;
      if (result !== 'FAILED') {
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomTxCode = Math.floor(100000 + Math.random() * 900000);
        const transactionNumber = `TXN-${dateStr}-${randomTxCode}`;

        payment = await tx.payment.create({
          data: {
            transactionId,
            transactionNumber,
            amount: priceResult.amount,
            status: 'PENDING',
          },
        });
      }

      return { inspection, transaction: updatedTx, payment };
    });

    if (result !== 'FAILED') {
      const existingEvent = await prisma.trustScoreHistory.findFirst({
        where: {
          farmerProfileId: transaction.booking.farmerProfileId,
          event: { contains: `${transaction.booking.crop?.name || 'Procurement'} slot` },
          points: { gt: 0 },
        },
      });
      if (!existingEvent) {
        await addTrustEvent(transaction.booking.farmerProfileId, `Completed slot (${transaction.booking.crop?.name || 'Procurement'} slot)`, 10.0);
      } else {
        await calculateTrustScore(transaction.booking.farmerProfileId);
      }
    }

    await logAction({
      userId: req.user.id,
      action: `REGISTER_QUALITY_${result}`,
      entity: 'QualityInspection',
      entityId: resultTx.inspection.id,
      metadata: { grade, amount: priceResult.amount },
    });

    res.status(201).json({
      success: true,
      message: `Quality inspection registered. Procurement ${result === 'FAILED' ? 'Rejected' : 'Accepted'}.`,
      data: resultTx,
    });
  } catch (error) {
    next(error);
  }
};

const getMyProcurements = async (req, res, next) => {
  try {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!farmer) {
      throw new NotFoundError('Farmer profile not found');
    }

    const procurements = await prisma.procurementTransaction.findMany({
      where: {
        booking: { farmerProfileId: farmer.id },
      },
      include: {
        booking: {
          include: { crop: true, centre: true },
        },
        weighingRecord: true,
        qualityInspection: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: procurements,
    });
  } catch (error) {
    next(error);
  }
};

const getCentreProcurements = async (req, res, next) => {
  try {
    const centreId = parseInt(req.params.centreId);

    // Verify staff assignment
    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile.assignments.some(
        (a) => a.centreId === centreId
      );
      if (!isAssigned) {
        throw new ForbiddenError('You are not authorized to view transactions for this centre');
      }
    }

    const procurements = await prisma.procurementTransaction.findMany({
      where: {
        booking: { centreId },
      },
      include: {
        booking: {
          include: { farmerProfile: true, crop: true },
        },
        weighingRecord: true,
        qualityInspection: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: procurements,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProcurement,
  getProcurementById,
  registerWeighing,
  registerQualityInspection,
  getMyProcurements,
  getCentreProcurements,
};
