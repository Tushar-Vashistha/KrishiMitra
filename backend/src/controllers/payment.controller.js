const prisma = require('../config/db');
const { processPayment } = require('../services/payment.service');
const { logAction } = require('../services/audit.service');
const { notifyPaymentEvent } = require('../services/notification.service');
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
      include: {
        payment: true,
        booking: {
          include: { farmerProfile: true },
        },
      },
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

    if (transaction.booking?.farmerProfile?.userId) {
      const formattedAmount = Number(payment.amount).toLocaleString('en-IN');
      await notifyPaymentEvent({
        userId: transaction.booking.farmerProfile.userId,
        type: 'PAYMENT_INITIATED',
        title: 'Payment Initiated',
        message: `Payment of ₹${formattedAmount} for Booking #${transaction.bookingId} has been initiated.`,
        relatedPaymentId: payment.id,
        relatedBookingId: transaction.bookingId,
      });
    }

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

    // Notify farmer about payment status change using notifyPaymentEvent
    const farmerProf = await prisma.farmerProfile.findUnique({
      where: { id: payment.transaction.booking.farmerProfileId },
    });

    if (farmerProf && farmerProf.userId) {
      const formattedAmount = Number(updatedPayment.amount).toLocaleString('en-IN');
      const bookingIdStr = payment.transaction.bookingId;
      let notifType = `PAYMENT_${status}`;
      let notifTitle = `Payment ${status}`;
      let notifMsg = `Payment of ₹${formattedAmount} for Booking #${bookingIdStr} status updated to ${status}.`;

      if (status === 'SUCCESS') {
        notifType = 'PAYMENT_SUCCESS';
        notifTitle = 'Payment Credited Successfully';
        notifMsg = `Payment of ₹${formattedAmount} for Booking #${bookingIdStr} has been credited successfully.`;
      } else if (status === 'PROCESSING') {
        notifType = 'PAYMENT_PROCESSING';
        notifTitle = 'Payment Processing';
        notifMsg = `Payment of ₹${formattedAmount} for Booking #${bookingIdStr} is currently being processed.`;
      } else if (status === 'FAILED') {
        notifType = 'PAYMENT_FAILED';
        notifTitle = 'Payment Failed';
        notifMsg = `Payment of ₹${formattedAmount} for Booking #${bookingIdStr} failed to process. Please check bank details.`;
      }

      await notifyPaymentEvent({
        userId: farmerProf.userId,
        type: notifType,
        title: notifTitle,
        message: notifMsg,
        relatedPaymentId: paymentId,
        relatedBookingId: bookingIdStr,
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${status} successfully`,
      data: updatedPayment,
    });
  } catch (error) {
    next(error);
  }
};

const syncPaymentStatus = async (req, res, next) => {
  try {
    const { bookingId, transactionId, paymentId, status, paymentStatus, referenceId } = req.body;

    const rawStatus = (paymentStatus || status || '').toString().trim();
    let targetStatus = 'PENDING';
    if (rawStatus.toUpperCase().includes('PAID') || rawStatus.toUpperCase() === 'SUCCESS' || rawStatus.toUpperCase().includes('TRANSFERRED') || rawStatus.toUpperCase().includes('APPROVED')) {
      targetStatus = 'SUCCESS';
    } else if (rawStatus.toUpperCase().includes('PROCESS') || rawStatus.toUpperCase() === 'PROCESSING') {
      targetStatus = 'PROCESSING';
    } else if (rawStatus.toUpperCase().includes('DUE') || rawStatus.toUpperCase() === 'PENDING') {
      targetStatus = 'PENDING';
    } else if (['FAILED', 'CANCELLED'].includes(rawStatus.toUpperCase())) {
      targetStatus = rawStatus.toUpperCase();
    }

    // 1. Locate ProcurementTransaction & Booking
    let transaction = null;
    if (transactionId) {
      transaction = await prisma.procurementTransaction.findUnique({
        where: { id: parseInt(transactionId) },
        include: { booking: { include: { farmerProfile: true, crop: true, centre: true } }, payment: true, weighingRecord: true },
      });
    } else if (bookingId) {
      transaction = await prisma.procurementTransaction.findUnique({
        where: { bookingId: String(bookingId) },
        include: { booking: { include: { farmerProfile: true, crop: true, centre: true } }, payment: true, weighingRecord: true },
      });
    } else if (paymentId) {
      const existingPay = await prisma.payment.findUnique({
        where: { id: parseInt(paymentId) },
        include: { transaction: { include: { booking: { include: { farmerProfile: true, crop: true, centre: true } }, payment: true, weighingRecord: true } } },
      });
      if (existingPay) {
        transaction = existingPay.transaction;
      }
    }

    if (!transaction) {
      if (bookingId) {
        const booking = await prisma.procurementBooking.findUnique({
          where: { id: String(bookingId) },
          include: { crop: true, centre: true, farmerProfile: true }
        });
        if (!booking) {
          throw new NotFoundError('Booking not found');
        }
        const defaultRate = 2275;
        const defaultWeight = booking.weight || 25;
        const defaultAmount = defaultWeight * defaultRate;
        
        transaction = await prisma.procurementTransaction.create({
          data: {
            bookingId: booking.id,
            netWeight: defaultWeight,
            rateUsed: defaultRate,
            amount: defaultAmount,
            status: 'COMPLETED',
          },
          include: { booking: { include: { farmerProfile: true, crop: true, centre: true } }, payment: true, weighingRecord: true },
        });
      } else {
        throw new NotFoundError('Procurement transaction not found');
      }
    }

    // Verify staff assignment safely if applicable
    if (req.user && req.user.role !== 'ADMIN' && req.user.role !== 'CENTRE_MANAGER' && req.user.role !== 'FARMER') {
      const assignments = req.user.staffProfile?.assignments || [];
      const isAssigned = assignments.some(
        (a) => a.centreId === transaction.booking.centreId
      );
      if (!isAssigned) {
        throw new ForbiddenError('You are not authorized to update payments for this centre');
      }
    }

    // 2. Find or Create Payment record
    let payment = transaction.payment;
    if (!payment) {
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomTxCode = Math.floor(100000 + Math.random() * 900000);
      const transactionNumber = `TXN-${dateStr}-${randomTxCode}`;

      payment = await prisma.payment.create({
        data: {
          transactionId: transaction.id,
          transactionNumber,
          amount: transaction.amount > 0 ? transaction.amount : (transaction.booking.weight * 2275),
          status: targetStatus,
          processedAt: targetStatus === 'SUCCESS' ? new Date() : null,
          referenceId: targetStatus === 'SUCCESS' ? (referenceId || `TXN-BANK-${Math.floor(1000000000 + Math.random() * 9000000000)}`) : null,
        },
      });
    } else {
      const updateData = {
        status: targetStatus,
        updatedAt: new Date(),
      };
      if (targetStatus === 'SUCCESS') {
        updateData.processedAt = new Date();
        if (!payment.referenceId || referenceId) {
          updateData.referenceId = referenceId || payment.referenceId || `TXN-BANK-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        }
      }
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: updateData,
      });
    }

    // 3. Update ProcurementTransaction & ProcurementBooking & QueueToken status
    const finalBookingStatus = targetStatus === 'SUCCESS' ? 'COMPLETED' : transaction.booking.status;
    await prisma.procurementTransaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED' },
    });

    await prisma.procurementBooking.update({
      where: { id: transaction.bookingId },
      data: { status: finalBookingStatus },
    });

    await prisma.queueToken.updateMany({
      where: { bookingId: transaction.bookingId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // 4. Notify Farmer
    if (transaction.booking?.farmerProfile?.userId) {
      const formattedAmount = Number(payment.amount).toLocaleString('en-IN');
      const bId = transaction.bookingId;
      await notifyPaymentEvent({
        userId: transaction.booking.farmerProfile.userId,
        type: targetStatus === 'SUCCESS' ? 'PAYMENT_SUCCESS' : targetStatus === 'PROCESSING' ? 'PAYMENT_PROCESSING' : 'PAYMENT_UPDATED',
        title: targetStatus === 'SUCCESS' ? 'Payment Credited Successfully' : targetStatus === 'PROCESSING' ? 'Payment Processing' : 'Payment Status Updated',
        message: `Payment of ₹${formattedAmount} for Booking #${bId} status updated to ${targetStatus === 'SUCCESS' ? 'Paid / Transferred (SUCCESS)' : targetStatus}.`,
        relatedPaymentId: payment.id,
        relatedBookingId: bId,
      });
    }

    await logAction({
      userId: req.user ? req.user.id : null,
      action: `SYNC_PAYMENT_STATUS_${targetStatus}`,
      entity: 'Payment',
      entityId: payment.id,
      metadata: { targetStatus, bookingId: transaction.bookingId },
    });

    res.status(200).json({
      success: true,
      message: `Payment status synchronized to '${targetStatus}' successfully`,
      data: {
        payment,
        transaction,
        status: targetStatus,
      },
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
  syncPaymentStatus,
};
