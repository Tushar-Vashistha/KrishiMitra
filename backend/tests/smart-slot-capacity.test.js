const request = require('supertest');
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/db');
const app = require('../src/app');
const { calculateEstimatedProcessingTime } = require('../src/config/procurementRates');

describe('Master Smart Slot Capacity & Token Allocation Suite', () => {
  jest.setTimeout(60000);
  const TEST_DATE = '2026-11-20';
  const SLOT_1 = '07:00 AM - 10:00 AM';
  const SLOT_2 = '10:00 AM - 01:00 PM';

  let centre;
  let wheatCrop;
  let testFarmers = [];
  let testTokens = [];

  beforeAll(async () => {
    // 1. Fetch or create test procurement centre
    centre = await prisma.procurementCentre.findFirst({
      where: { open: true },
      include: { slotConfigs: true },
    });

    if (!centre) {
      centre = await prisma.procurementCentre.create({
        data: {
          centreId: 'TEST-CTR-01',
          name: 'Test Procurement Centre',
          nameHi: 'परीक्षण खरीद केंद्र',
          type: 'Government',
          address: 'Test Mandi, Lucknow',
          lat: 26.8467,
          lng: 80.9462,
          openingTime: '07:00 AM',
          closingTime: '08:00 PM',
          open: true,
          phone: '9876500000',
        },
      });
    }

    // 2. Fetch Wheat crop
    wheatCrop = await prisma.crop.findFirst({
      where: { name: 'Wheat' },
    });

    if (!wheatCrop) {
      wheatCrop = await prisma.crop.create({
        data: {
          name: 'Wheat',
          nameHi: 'गेहूं',
          code: 'WHEAT',
          unit: '₹/Qtl',
        },
      });
    }

    // 3. Clean up any existing test bookings for TEST_DATE
    const testDateObj = new Date(TEST_DATE);
    const startOfTestDay = new Date(testDateObj);
    startOfTestDay.setHours(0, 0, 0, 0);
    const endOfTestDay = new Date(testDateObj);
    endOfTestDay.setHours(23, 59, 59, 999);

    await prisma.procurementBooking.deleteMany({
      where: {
        centreId: centre.id,
        date: { gte: startOfTestDay, lte: endOfTestDay },
      },
    });

    const dateOnly = new Date(testDateObj.getFullYear(), testDateObj.getMonth(), testDateObj.getDate());
    await prisma.slotAllocation.deleteMany({
      where: {
        centreId: centre.id,
        bookingDate: dateOnly,
      },
    });

    // 4. Create 7 distinct test farmers (Farmer A through G)
    for (let i = 1; i <= 7; i++) {
      const mobile = `980000000${i}`;
      let user = await prisma.user.findUnique({
        where: { mobile },
        include: { farmerProfile: true },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            mobile,
            role: 'FARMER',
            farmerProfile: {
              create: {
                name: `Farmer ${String.fromCharCode(64 + i)}`,
                dob: new Date('1985-05-15'),
                gender: 'Male',
                aadhaarMasked: `XXXX XXXX 000${i}`,
                aadhaarHash: `hash_test_aadhaar_${i}`,
                mobile,
                village: 'Bhagwanpur',
                district: 'Lucknow',
                state: 'Uttar Pradesh',
                tehsil: 'Lucknow',
                block: 'Lucknow',
                pincode: '226001',
                khasraNumber: `KH-10${i}`,
                landOwnerName: `Farmer ${String.fromCharCode(64 + i)}`,
                bankName: 'SBI',
                accountNumberMasked: `XXXX XXXX 000${i}`,
                accountNumberHash: `hash_test_bank_${i}`,
                ifscCode: 'SBIN0001234',
                trustScore: 100,
                status: 'VERIFIED',
              },
            },
          },
          include: { farmerProfile: true },
        });
      }

      testFarmers.push(user);
      testTokens.push(
        jwt.sign(
          { id: user.id, role: 'FARMER', mobile: user.mobile },
          process.env.JWT_SECRET || 'krishimitra_fallback_secret_key_987654'
        )
      );
    }
  }, 30000);

  afterAll(async () => {
    // Clean up test bookings and allocations
    try {
      const testDateObj = new Date(TEST_DATE);
      const startOfTestDay = new Date(testDateObj);
      startOfTestDay.setHours(0, 0, 0, 0);
      const endOfTestDay = new Date(testDateObj);
      endOfTestDay.setHours(23, 59, 59, 999);

      await prisma.procurementBooking.deleteMany({
        where: {
          centreId: centre.id,
          date: { gte: startOfTestDay, lte: endOfTestDay },
        },
      });

      const dateOnly = new Date(testDateObj.getFullYear(), testDateObj.getMonth(), testDateObj.getDate());
      await prisma.slotAllocation.deleteMany({
        where: {
          centreId: centre.id,
          bookingDate: dateOnly,
        },
      });
    } catch (e) {
      console.warn('Cleanup error:', e.message);
    }
  });

  // TEST CASE 1: Farmer A books 60 minutes
  it('Test Case 1: Farmer A books 60 minutes (30 Qtl Wheat) -> receives Token 1, slot capacity reduced', async () => {
    // Wheat rate = 0.5 Qtl/min -> 30 Qtl = 60 minutes
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${testTokens[0]}`)
      .send({
        cropId: wheatCrop.id,
        weight: 30,
        centreId: centre.id,
        date: TEST_DATE,
        slotTime: SLOT_1,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokenNumber).toBe(1);
    expect(res.body.data.formattedToken).toBe('Token #001');
    expect(res.body.data.estimatedProcessingTime).toBe(60);
    expect(res.body.data.remainingSlotCapacity).toBe(120); // 180 - 60 = 120
  });

  // TEST CASE 2: Farmer B books 70 minutes
  it('Test Case 2: Farmer B books 70 minutes (35 Qtl Wheat) -> receives Token 2, slot capacity updated correctly', async () => {
    // 35 Qtl / 0.5 = 70 minutes
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${testTokens[1]}`)
      .send({
        cropId: wheatCrop.id,
        weight: 35,
        centreId: centre.id,
        date: TEST_DATE,
        slotTime: SLOT_1,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokenNumber).toBe(2);
    expect(res.body.data.formattedToken).toBe('Token #002');
    expect(res.body.data.estimatedProcessingTime).toBe(70);
    expect(res.body.data.remainingSlotCapacity).toBe(50); // 120 - 70 = 50
  });

  // TEST CASE 3: Farmer C books 50 minutes
  it('Test Case 3: Farmer C books 50 minutes (25 Qtl Wheat) -> receives Token 3, slot reaches full capacity (0 mins left)', async () => {
    // 25 Qtl / 0.5 = 50 minutes
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${testTokens[2]}`)
      .send({
        cropId: wheatCrop.id,
        weight: 25,
        centreId: centre.id,
        date: TEST_DATE,
        slotTime: SLOT_1,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokenNumber).toBe(3);
    expect(res.body.data.formattedToken).toBe('Token #003');
    expect(res.body.data.estimatedProcessingTime).toBe(50);
    expect(res.body.data.remainingSlotCapacity).toBe(0); // 50 - 50 = 0 (Completely Full)
  });

  // TEST CASE 4: Farmer D attempts to book the same full slot
  it('Test Case 4: Farmer D attempts to book the full slot -> rejected, no token generated, next available slot suggested', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${testTokens[3]}`)
      .send({
        cropId: wheatCrop.id,
        weight: 20, // 20 / 0.5 = 40 minutes, but 0 minutes remain
        centreId: centre.id,
        date: TEST_DATE,
        slotTime: SLOT_1,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SLOT_CAPACITY_EXCEEDED');
    expect(res.body.error.message).toContain('does not have enough capacity');
    expect(res.body.nextAvailableSlot).toBeDefined();
    expect(res.body.nextAvailableSlot.slotTime).toBe(SLOT_2);

    // Verify no booking was created for Farmer D
    const farmerDBooking = await prisma.procurementBooking.findFirst({
      where: {
        farmerProfileId: testFarmers[3].farmerProfile.id,
        date: {
          gte: new Date(`${TEST_DATE}T00:00:00.000Z`),
          lte: new Date(`${TEST_DATE}T23:59:59.999Z`),
        },
      },
    });
    expect(farmerDBooking).toBeNull();
  });

  // TEST CASE 5: Concurrent simultaneous booking
  it('Test Case 5: Two farmers book simultaneously for remaining capacity -> exactly one succeeds, no duplicate token, no overbooking', async () => {
    // In SLOT_2 (180 mins duration), let's pre-book 130 mins (leaving 50 mins)
    // Then Farmer E and Farmer F both simultaneously attempt to book 40 mins (20 Qtl)
    // Total required would be 80 mins, but only 50 mins remain.
    // Concurrency safety must ensure only ONE succeeds and the other is rejected!

    // Pre-book 130 mins with Farmer D in SLOT_2
    const prep = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${testTokens[3]}`)
      .send({
        cropId: wheatCrop.id,
        weight: 65, // 65 / 0.5 = 130 mins
        centreId: centre.id,
        date: TEST_DATE,
        slotTime: SLOT_2,
      });
    expect(prep.statusCode).toBe(201);
    expect(prep.body.data.remainingSlotCapacity).toBe(50); // 180 - 130 = 50 mins left

    // Now Farmer E and Farmer F both attempt 40 mins simultaneously
    const bookFarmerE = () =>
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${testTokens[4]}`)
        .send({
          cropId: wheatCrop.id,
          weight: 20, // 40 mins
          centreId: centre.id,
          date: TEST_DATE,
          slotTime: SLOT_2,
        });

    const bookFarmerF = () =>
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${testTokens[5]}`)
        .send({
          cropId: wheatCrop.id,
          weight: 20, // 40 mins
          centreId: centre.id,
          date: TEST_DATE,
          slotTime: SLOT_2,
        });

    const [resE, resF] = await Promise.all([bookFarmerE(), bookFarmerF()]);

    const results = [resE, resF];
    const successes = results.filter((r) => r.statusCode === 201);
    const failures = results.filter((r) => r.statusCode === 400 || r.statusCode === 409);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Verify token number of successful booking
    const successfulBooking = successes[0].body.data;
    expect(successfulBooking.tokenNumber).toBe(2); // Farmer D had token 1 in SLOT_2
    expect(successfulBooking.formattedToken).toBe('Token #002');

    // Verify rejection error code
    const failedBooking = failures[0].body;
    expect(failedBooking.success).toBe(false);
  });

  // TEST CASE 6: Crop quantity calculation & slot availability update
  it('Test Case 6: Changing crop quantity updates estimated processing time and slot availability', async () => {
    // 20 Quintals Wheat = 40 minutes
    const time40 = calculateEstimatedProcessingTime('Wheat', 20);
    expect(time40).toBe(40);

    // 50 Quintals Wheat = 100 minutes
    const time100 = calculateEstimatedProcessingTime('Wheat', 50);
    expect(time100).toBe(100);

    // Query availability with 10 Quintals vs 60 Quintals
    const resLow = await request(app).get(
      `/api/v1/centres/${centre.id}/slots/availability?date=${TEST_DATE}&cropId=${wheatCrop.id}&quantity=10`
    );
    expect(resLow.statusCode).toBe(200);
    expect(resLow.body.meta.requiredMinutes).toBe(20);

    const resHigh = await request(app).get(
      `/api/v1/centres/${centre.id}/slots/availability?date=${TEST_DATE}&cropId=${wheatCrop.id}&quantity=80`
    );
    expect(resHigh.statusCode).toBe(200);
    expect(resHigh.body.meta.requiredMinutes).toBe(160); // 80 / 0.5 = 160 mins
  });

  // TEST CASE 7: Cancellation frees up slot capacity, never reuses token numbers
  it('Test Case 7: Cancellation frees up capacity; subsequent booking receives next unique token (never reuses cancelled token)', async () => {
    // Farmer A (from Test 1) booked 60 mins in SLOT_1 (Token #001)
    // Let's find Farmer A's booking
    const farmerABooking = await prisma.procurementBooking.findFirst({
      where: {
        farmerProfileId: testFarmers[0].farmerProfile.id,
        date: {
          gte: new Date(`${TEST_DATE}T00:00:00.000Z`),
          lte: new Date(`${TEST_DATE}T23:59:59.999Z`),
        },
        slotTime: SLOT_1,
      },
    });
    expect(farmerABooking).toBeDefined();

    // Cancel Farmer A's booking
    const cancelRes = await request(app)
      .patch(`/api/v1/bookings/${farmerABooking.id}/cancel`)
      .set('Authorization', `Bearer ${testTokens[0]}`);

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    // Now 60 minutes are freed up in SLOT_1!
    // Farmer G books 25 Qtl Wheat (50 mins) in SLOT_1
    const resG = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${testTokens[6]}`)
      .send({
        cropId: wheatCrop.id,
        weight: 25,
        centreId: centre.id,
        date: TEST_DATE,
        slotTime: SLOT_1,
      });

    expect(resG.statusCode).toBe(201);
    expect(resG.body.success).toBe(true);
    // Crucial requirement: Token numbers must NEVER be reused!
    // SLOT_1 already had tokens 1, 2, 3. Farmer G must receive Token 4!
    expect(resG.body.data.tokenNumber).toBe(4);
    expect(resG.body.data.formattedToken).toBe('Token #004');
    expect(resG.body.data.tokenNumber).not.toBe(1);
  });
});
