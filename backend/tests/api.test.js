const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock Prisma Client at src/config/db.js
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
  farmerProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  staffProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  staffAssignment: {
    create: jest.fn(),
  },
  procurementCentre: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  procurementSeason: {
    findFirst: jest.fn(),
  },
  crop: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  procurementBooking: {
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  queueToken: {
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  tokenStatusHistory: {
    create: jest.fn(),
  },
  systemSetting: {
    findUnique: jest.fn(),
  },
  cropPrice: {
    findFirst: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

jest.mock('../src/config/db', () => mockPrisma);

// Import app after mocking db
const app = require('../src/app');

describe('KrishiMitra API Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 and healthy status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Server is healthy');
    });
  });

  describe('POST /api/v1/auth/register/farmer', () => {
    it('should register a new farmer successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.farmerProfile.findUnique.mockResolvedValue(null);
      
      // Configure creation mocks to return valid data to prevent undefined errors
      mockPrisma.user.create.mockResolvedValue({ id: 1, mobile: '9876543210', role: 'FARMER' });
      mockPrisma.farmerProfile.create.mockResolvedValue({
        id: 10,
        name: 'Ramesh Kumar',
        mobile: '9876543210',
        aadhaarMasked: 'XXXX XXXX 1234',
        status: 'PENDING',
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const payload = {
        mobile: '9876543210',
        password: 'password123',
        name: 'Ramesh Kumar',
        dob: '1980-01-01',
        gender: 'Male',
        aadhaar: '123456789012',
        village: 'Bhagwanpur',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        tehsil: 'Lucknow',
        block: 'Lucknow',
        pincode: '226001',
        khasraNumber: '123/4B',
        landOwnerName: 'Ramesh Kumar',
        bankName: 'State Bank of India',
        accountNumber: '987654321012',
        ifscCode: 'SBIN0001234',
      };

      const res = await request(app)
        .post('/api/v1/auth/register/farmer')
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Farmer registered successfully');
      expect(res.body.data.profile.name).toBe('Ramesh Kumar');
    });

    it('should return 409 Conflict if mobile is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, mobile: '9876543210' });

      const payload = {
        mobile: '9876543210',
        password: 'password123',
        name: 'Ramesh Kumar',
        dob: '1980-01-01',
        gender: 'Male',
        aadhaar: '123456789012',
        village: 'Bhagwanpur',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        tehsil: 'Lucknow',
        block: 'Lucknow',
        pincode: '226001',
        khasraNumber: '123/4B',
        landOwnerName: 'Ramesh Kumar',
        bankName: 'State Bank of India',
        accountNumber: '987654321012',
        ifscCode: 'SBIN0001234',
      };

      const res = await request(app)
        .post('/api/v1/auth/register/farmer')
        .send(payload);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should fail login with invalid OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ mobile: '9876543210', otp: '000000' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should login successfully with valid OTP', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        mobile: '9876543210',
        role: 'FARMER',
        farmerProfile: { id: 1, name: 'Test Farmer' },
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ mobile: '9876543210', otp: '123456' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });

  describe('POST /api/v1/bookings (Protected Route)', () => {
    it('should block booking if unauthorized/no token provided', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .send({ cropId: 1, weight: 25, centreId: 1, date: '2026-11-15', slotTime: '10:00 - 11:00' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should create booking when authorized and inputs valid', async () => {
      // Mock validation database lookups
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        mobile: '9876543210',
        role: 'FARMER',
        farmerProfile: { id: 10, status: 'VERIFIED' },
      });

      mockPrisma.procurementCentre.findUnique.mockResolvedValue({
        id: 1,
        open: true,
        slotConfigs: [{ slotTime: '10:00 - 11:00', capacity: 10 }],
      });

      mockPrisma.crop.findUnique.mockResolvedValue({ id: 2, name: 'Wheat' });
      mockPrisma.procurementSeason.findFirst.mockResolvedValue({ id: 1, name: 'Rabi 22' });
      mockPrisma.procurementBooking.count.mockResolvedValue(2); // 2 booked already (cap is 10)
      mockPrisma.procurementBooking.findFirst.mockResolvedValue(null); // no duplicates
      mockPrisma.queueToken.findFirst.mockResolvedValue({ tokenNumber: 5 }); // last token number
      mockPrisma.queueToken.count.mockResolvedValue(1); // 1 waiting ahead

      mockPrisma.procurementBooking.create.mockResolvedValue({ id: 'BK-1234', date: new Date(), slotTime: '10:00 - 11:00' });
      mockPrisma.queueToken.create.mockResolvedValue({ id: 9, tokenNumber: 6 });
      mockPrisma.tokenStatusHistory.create.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      // Generate a mock JWT access token
      const token = jwt.sign(
        { id: 1, role: 'FARMER', mobile: '9876543210' },
        process.env.JWT_SECRET || 'krishimitra_fallback_secret_key_987654'
      );

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ cropId: 2, weight: 15, centreId: 1, date: '2026-11-15', slotTime: '10:00 - 11:00' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking).toBeDefined();
      expect(res.body.data.token).toBeDefined();
    });
  });
});
