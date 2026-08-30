const prisma = require('../config/db');
const { processPayment } = require('../services/payment.service');
const { logAction } = require('../services/audit.service');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

const getMyPayments = async (req, res, next) => {
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

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          transaction: {
            booking: { farmerProfileId: farmer.id },
          },
        },
        include: {
          transaction: {
            include: {
              booking: {
                include: { crop: true, centre: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({
        where: {
          transaction: {
            booking: { farmerProfileId: farmer.id },
          },
        },
      }),
    ]);

    const formatted = payments.map((p) => ({
      id: p.id,
      transactionId: p.transactionNumber,
      date: p.createdAt.toISOString().split('T')[0],
      crop: p.transaction.booking.crop.name,
      quantity: `${p.transaction.netWeight} Qtl`,
      amount: p.amount,
      status: p.status,
      centre: p.transaction.booking.centre.name,
      referenceId: p.referenceId,
      processedAt: p.processedAt,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
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

const getPaymentById = async (req, res, next) => {
  try {
    const paymentId = parseInt(req.params.id);
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        transaction: {
          include: {
            booking: {
              include: { farmerProfile: true, crop: true, centre: true },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (req.user.role === 'FARMER' && payment.transaction.booking.farmerProfile.userId !== req.user.id) {
      throw new ForbiddenError('You are not authorized to view this payment');
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const triggerPayment = async (req, res, next) => {
  try {
    const { transactionId } = req.body;

    const transaction = await prisma.procurementTransaction.findUnique({
      where: { id: parseInt(transactionId) },
      include: { payment: true, booking: true },
    });

    if (!transaction) {
      throw new NotFoundError('Procurement transaction not found');
    }

    if (transaction.status !== 'COMPLETED') {
      throw new BadRequestError('Cannot trigger payment for uncompleted procurement');
    }

    if (transaction.payment) {
      return res.status(200).json({
        success: true,
        message: 'Payment already exists',
        data: transaction.payment,
      });
    }

    // Verify staff assignment
    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile.assignments.some(
        (a) => a.centreId === transaction.booking.centreId
      );
      if (!isAssigned) {
        throw new ForbiddenError('You are not authorized to execute actions for this centre');
      }
    }

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomTxCode = Math.floor(100000 + Math.random() * 900000);
    const transactionNumber = `TXN-${dateStr}-${randomTxCode}`;

    const payment = await prisma.payment.create({
      data: {
        transactionId: transaction.id,
        transactionNumber,
        amount: transaction.amount,
        status: 'PENDING',
      },
    });

    await logAction({
      userId: req.user.id,
      action: 'TRIGGER_PAYMENT',
      entity: 'Payment',
      entityId: payment.id,
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const paymentId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED'].includes(status)) {
      throw new BadRequestError('Invalid payment status');
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        transaction: {
          include: { booking: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment record not found');
    }

    // Verify staff assignment
    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile.assignments.some(
        (a) => a.centreId === payment.transaction.booking.centreId
      );
      if (!isAssigned) {
        throw new ForbiddenError('You are not authorized to update payments for this centre');
      }
    }

    let updatedPayment;

    if (status === 'SUCCESS') {
      // Simulate banking gateway process
      const bankResult = await processPayment(payment.id, payment.amount);
      
      updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCESS',
          referenceId: bankResult.referenceId,
          processedAt: new Date(),
        },
      });
    } else {
      updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status },
      });
    }

    await logAction({
      userId: req.user.id,
      action: `PAYMENT_STATUS_${status}`,
      entity: 'Payment',
      entityId: paymentId,
    });

    // Notify farmer about payment status change
    await prisma.notification.create({
      data: {
        userId: payment.transaction.booking.farmerProfileId,
        title: `Payment ${status}`,
        message: `Your payment of ₹${payment.amount} for booking ${payment.transaction.bookingId} is now ${status}.`,
        type: 'PAYMENT',
      },
    });

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${status} successfully`,
      data: updatedPayment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyPayments,
  getPaymentById,
  triggerPayment,
  updatePaymentStatus,
};
