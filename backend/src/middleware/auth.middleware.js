const { verifyAccessToken } = require('../utils/auth');
const prisma = require('../config/db');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new UnauthorizedError('You are not logged in. Please log in to get access.'));
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return next(new UnauthorizedError('Invalid token. Please log in again.'));
    }

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        farmerProfile: true,
        staffProfile: {
          include: {
            assignments: {
              where: { active: true },
            },
          },
        },
      },
    });

    if (!user) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to perform this action.')
      );
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
