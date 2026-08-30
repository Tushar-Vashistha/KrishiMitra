const prisma = require('../config/db');
const { logAction } = require('../services/audit.service');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

const getCentresCounters = async (req, res, next) => {
  try {
    const centreId = parseInt(req.params.centreId);
    
    // Verify staff assignment
    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile.assignments.some(
        (a) => a.centreId === centreId
      );
      if (!isAssigned) {
        throw new ForbiddenError('You are not authorized to view counters for this centre');
      }
    }

    const counters = await prisma.counter.findMany({
      where: { centreId },
      orderBy: { counterNumber: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: counters,
    });
  } catch (error) {
    next(error);
  }
};

const createCounter = async (req, res, next) => {
  try {
    const centreId = parseInt(req.params.centreId);
    const { counterNumber } = req.body;

    if (!counterNumber) {
      throw new BadRequestError('Counter number is required');
    }

    // Verify staff assignment
    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile.assignments.some(
        (a) => a.centreId === centreId
      );
      if (!isAssigned) {
        throw new ForbiddenError('You are not authorized to create counters for this centre');
      }
    }

    // Check if counter number already exists at this centre
    const existing = await prisma.counter.findFirst({
      where: { centreId, counterNumber: parseInt(counterNumber) },
    });

    if (existing) {
      throw new BadRequestError(`Counter ${counterNumber} already exists at this centre`);
    }

    const counter = await prisma.counter.create({
      data: {
        centreId,
        counterNumber: parseInt(counterNumber),
        status: 'AVAILABLE',
      },
    });

    await logAction({
      userId: req.user.id,
      action: 'CREATE_COUNTER',
      entity: 'Counter',
      entityId: counter.id,
    });

    res.status(201).json({
      success: true,
      data: counter,
    });
  } catch (error) {
    next(error);
  }
};

const updateCounterStatus = async (req, res, next) => {
  try {
    const counterId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['AVAILABLE', 'BUSY', 'OFFLINE', 'MAINTENANCE'].includes(status)) {
      throw new BadRequestError('Invalid counter status');
    }

    const counter = await prisma.counter.findUnique({
      where: { id: counterId },
    });

    if (!counter) {
      throw new NotFoundError('Counter not found');
    }

    // Verify staff assignment
    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile.assignments.some(
        (a) => a.centreId === counter.centreId
      );
      if (!isAssigned) {
        throw new ForbiddenError('You are not authorized to edit counters for this centre');
      }
    }

    const updated = await prisma.counter.update({
      where: { id: counterId },
      data: { status },
    });

    await logAction({
      userId: req.user.id,
      action: `COUNTER_STATUS_${status}`,
      entity: 'Counter',
      entityId: counterId,
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const assignTokenToCounter = async (req, res, next) => {
  try {
    const counterId = parseInt(req.params.id);
    const { tokenId } = req.body;

    if (!tokenId) {
      throw new BadRequestError('Token ID is required');
    }

    const counter = await prisma.counter.findUnique({
      where: { id: counterId },
    });

    if (!counter) {
      throw new NotFoundError('Counter not found');
    }

    const token = await prisma.queueToken.findUnique({
      where: { id: parseInt(tokenId) },
    });

    if (!token) {
      throw new NotFoundError('Queue Token not found');
    }

    if (token.centreId !== counter.centreId) {
      throw new BadRequestError('Token and counter must belong to the same centre');
    }

    // Verify staff assignment
    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile.assignments.some(
        (a) => a.centreId === counter.centreId
      );
      if (!isAssigned) {
        throw new ForbiddenError('You are not authorized to manage counters for this centre');
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update counter status to BUSY
      await tx.counter.update({
        where: { id: counterId },
        data: { status: 'BUSY' },
      });

      // Update token status to PROCESSING, assign counter
      const updatedToken = await tx.queueToken.update({
        where: { id: parseInt(tokenId) },
        data: {
          status: 'PROCESSING',
          counterId,
          processingStartedAt: new Date(),
        },
      });

      await tx.tokenStatusHistory.create({
        data: {
          tokenId: parseInt(tokenId),
          status: 'PROCESSING',
        },
      });

      // Update booking status
      await tx.procurementBooking.update({
        where: { id: token.bookingId },
        data: { status: 'WEIGHING' }, // moves booking into weighing stage
      });

      return updatedToken;
    });

    await logAction({
      userId: req.user.id,
      action: 'ASSIGN_TOKEN_COUNTER',
      entity: 'QueueToken',
      entityId: tokenId,
      metadata: { counterId },
    });

    res.status(200).json({
      success: true,
      message: 'Token successfully assigned to counter',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCentresCounters,
  createCounter,
  updateCounterStatus,
  assignTokenToCounter,
};
