const swaggerJSDoc = require('swagger-jsdoc');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 8080;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'KrishiMitra API',
    version: '1.0.0',
    description: 'REST API documentation for KrishiMitra agricultural procurement platform',
  },
  servers: [
    {
      url: `http://localhost:${PORT}/api/v1`,
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer <token>',
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/app.js'], // Scan routes for JSDoc documentation
};

const swaggerSpec = swaggerJSDoc(options);

// Fallback static specification if jsdoc fails or for simpler rendering
const staticSwaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'KrishiMitra API',
    version: '1.0.0',
    description: 'REST API specification for KrishiMitra agricultural procurement platform',
  },
  servers: [
    {
      url: `/api/v1`,
      description: 'Current host API root',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/auth/register/farmer': {
      post: {
        summary: 'Register a new Farmer profile',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  mobile: { type: 'string', example: '9876543210' },
                  password: { type: 'string', example: 'password123' },
                  name: { type: 'string', example: 'Ramesh Kumar' },
                  dob: { type: 'string', format: 'date', example: '1985-05-15' },
                  gender: { type: 'string', example: 'Male' },
                  aadhaar: { type: 'string', example: '123456789012' },
                  village: { type: 'string', example: 'Bhagwanpur' },
                  district: { type: 'string', example: 'Lucknow' },
                  state: { type: 'string', example: 'Uttar Pradesh' },
                  tehsil: { type: 'string', example: 'Lucknow' },
                  block: { type: 'string', example: 'Lucknow' },
                  pincode: { type: 'string', example: '226001' },
                  khasraNumber: { type: 'string', example: '123/4B' },
                  landOwnerName: { type: 'string', example: 'Ramesh Kumar' },
                  bankName: { type: 'string', example: 'State Bank of India' },
                  accountNumber: { type: 'string', example: '123456789012' },
                  ifscCode: { type: 'string', example: 'SBIN0001234' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Farmer registered successfully' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in to the system',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  mobile: { type: 'string', example: '9876543210' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authentication tokens returned' },
        },
      },
    },
    '/farmers/me': {
      get: {
        summary: 'Get current farmer profile details',
        tags: ['Farmers'],
        responses: {
          200: { description: 'Profile object' },
        },
      },
    },
    '/centres/nearby': {
      get: {
        summary: 'Find nearest procurement centres within a radius',
        tags: ['Procurement Centres'],
        parameters: [
          { name: 'latitude', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'longitude', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'radius', in: 'query', schema: { type: 'number' } },
        ],
        responses: {
          200: { description: 'List of centres sorted by distance' },
        },
      },
    },
    '/bookings': {
      post: {
        summary: 'Create a new crop procurement booking',
        tags: ['Bookings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  cropId: { type: 'integer', example: 1 },
                  weight: { type: 'number', example: 25 },
                  centreId: { type: 'integer', example: 1 },
                  date: { type: 'string', format: 'date', example: '2026-11-15' },
                  slotTime: { type: 'string', example: '10:00 - 11:00' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Booking confirmed and queue token issued' },
        },
      },
    },
  },
};

module.exports = staticSwaggerSpec;
