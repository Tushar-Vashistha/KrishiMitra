const { ZodError } = require('zod');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || [];

  // Log the error
  logger.error(`${req.method} ${req.originalUrl} - Error: ${err.message}`, {
    stack: err.stack,
    code,
    statusCode,
  });

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // Handle Prisma Database Errors (safely map to user-friendly messages without exposing database internals)
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    statusCode = 400;
    code = 'DATABASE_ERROR';
    if (err.code === 'P2002') {
      statusCode = 409;
      code = 'CONFLICT_ERROR';
      message = 'A record with this value already exists';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'The requested record was not found';
    } else {
      message = 'Database operation failed';
    }
  }

  // Final Response Formatting
  const response = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
