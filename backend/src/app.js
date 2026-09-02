const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const routes = require('./routes');
const swaggerSpec = require('./utils/swagger');
const errorMiddleware = require('./middleware/error.middleware');
const logger = require('./utils/logger');

const app = express();

// Security Middlewares
app.use(helmet());

// Response Compression (Gzip)
app.use(compression());

// CORS Configuration
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Custom request logging
app.use((req, res, next) => {
  logger.info(`HTTP Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
  },
});

const authLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 15, // limit each IP to 15 authentication/OTP attempts per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_AUTH_ATTEMPTS',
      message: 'Too many login or OTP attempts. Please try again after 30 seconds.',
    },
  },
});

// Apply rate limiting
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', generalLimiter);

// API Documentation (Swagger)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check / Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'KrishiMitra API Server is running',
    docs: '/api/docs',
  });
});

// Mount REST Routes
app.use('/api/v1', routes);

// 404 Route handler
app.use((req, res, next) => {
  const { NotFoundError } = require('./utils/errors');
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

// Global Centralized Error Handler
app.use(errorMiddleware);

module.exports = app;
