const prisma = require('../config/db');
const { getQueueTrackingDetails } = require('../services/queue.service');
const { logAction } = require('../services/audit.service');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

const getTokenById = async (req, res, next) => {
  try {
    const tokenId = parseInt(req.params.id);
    const tracking = await getQueueTrackingDetails(tokenId);
    if (!tracking) {
      throw new NotFoundError('Queue Token not found');
    }

    // Auth check: farmer can only view their own token
    if (req.user.role === 'FARMER') {
      const farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (tracking.token.booking.farmerProfileId !== farmerProfile.id) {
        throw new ForbiddenError('You are not authorized to view this token');
      }
    }

    res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    next(error);
  }
};

const getMyTokens = async (req, res, next) => {
  try {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!farmer) {
      throw new NotFoundError('Farmer profile not found');
    }

    const activeToken = await prisma.queueToken.findFirst({
      where: {
        booking: {
          farmerProfileId: farmer.id,
        },
        status: {
          in: ['WAITING', 'CALLED', 'ARRIVED', 'PROCESSING'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeToken) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active queue token found',
      });
    }

    const tracking = await getQueueTrackingDetails(activeToken.id);
    res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    next(error);
  }
};

const getCentreQueue = async (req, res, next) => {
  try {
    const centreId = parseInt(req.params.centreId);

    // Verify staff assignment if not admin
    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile.assignments.some(
        (a) => a.centreId === centreId
      );
      if (!isAssigned) {
        throw new ForbiddenError('You are not assigned to this procurement centre');
      }
    }

    const queue = await prisma.queueToken.findMany({
      where: {
        centreId,
        status: {
          in: ['WAITING', 'CALLED', 'ARRIVED', 'PROCESSING'],
        },
      },
      include: {
        booking: {
          include: {
            farmerProfile: true,
            crop: true,
          },
        },
        counter: true,
      },
      orderBy: [
        { booking: { isTatkaal: 'desc' } }, // Tatkaal bookings first
        { tokenNumber: 'asc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

// Staff Action: Change token status
const updateTokenStatus = (statusAction) => async (req, res, next) => {
  try {
    const tokenId = parseInt(req.params.id);
    const { counterId } = req.body; // optionally assign counter on call/start

    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: {
        booking: true,
      },
    });

    if (!token) {
      throw new NotFoundError('Queue Token not found');
    }

    // Verify staff is assigned to the same centre
    if (req.user.role !== 'ADMIN') {
      const isAssigned = req.user.staffProfile.assignments.some(
        (a) => a.centreId === token.centreId
      );
      if (!isAssigned) {
        throw new ForbiddenError('You are not authorized to update tokens for this centre');
      }
    }

    const updatedData = {};
    let status = token.status;

    if (statusAction === 'call') {
      status = 'CALLED';
      updatedData.calledAt = new Date();
      if (counterId) {
        updatedData.counterId = parseInt(counterId);
      }
    } else if (statusAction === 'arrive') {
      status = 'ARRIVED';
      updatedData.arrivedAt = new Date();
    } else if (statusAction === 'start') {
      status = 'PROCESSING';
      updatedData.processingStartedAt = new Date();
      if (counterId) {
        updatedData.counterId = parseInt(counterId);
      }
    } else if (statusAction === 'complete') {
      status = 'COMPLETED';
      updatedData.completedAt = new Date();
    } else if (statusAction === 'no-show') {
      status = 'NO_SHOW';
    } else if (statusAction === 'cancel') {
      status = 'CANCELLED';
    }

    updatedData.status = status;

    const result = await prisma.$transaction(async (tx) => {
      const updatedToken = await tx.queueToken.update({
        where: { id: tokenId },
        data: updatedData,
      });

      await tx.tokenStatusHistory.create({
        data: {
          tokenId,
          status,
        },
      });

      // Update corresponding booking status too
      let bookingStatus = 'BOOKED';
      if (status === 'ARRIVED') bookingStatus = 'ARRIVED';
      else if (status === 'PROCESSING') bookingStatus = 'WEIGHING';
      else if (status === 'COMPLETED') bookingStatus = 'COMPLETED';
      else if (status === 'CANCELLED') bookingStatus = 'CANCELLED';

      await tx.procurementBooking.update({
        where: { id: token.bookingId },
        data: { status: bookingStatus },
      });

      return updatedToken;
    });

    await logAction({
      userId: req.user.id,
      action: `QUEUE_TOKEN_${statusAction.toUpperCase()}`,
      entity: 'QueueToken',
      entityId: tokenId,
      metadata: { counterId },
    });

    res.status(200).json({
      success: true,
      message: `Token status updated to ${status} successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTokenById,
  getMyTokens,
  getCentreQueue,
  callToken: updateTokenStatus('call'),
  arriveToken: updateTokenStatus('arrive'),
  startToken: updateTokenStatus('start'),
  completeToken: updateTokenStatus('complete'),
  noShowToken: updateTokenStatus('no-show'),
  cancelToken: updateTokenStatus('cancel'),
};
