const { calculateTrustScore, addTrustEvent } = require('../src/services/trust.service');
const prisma = require('../src/config/db');

describe('Trust Score & Slot Completion System', () => {
  jest.setTimeout(30000);
  let testUser;
  let testFarmer;
  let testCentre;
  let testCrop;

  beforeAll(async () => {
    // Create test user and farmer profile
    const randomMobile = Math.floor(6000000000 + Math.random() * 3999999999).toString();
    testUser = await prisma.user.create({
      data: {
        mobile: randomMobile,
        role: 'FARMER',
      },
    });

    testFarmer = await prisma.farmerProfile.create({
      data: {
        userId: testUser.id,
        name: 'Test Trust Farmer',
        dob: new Date('1985-01-01'),
        gender: 'Male',
        mobile: randomMobile,
        aadhaarMasked: 'XXXX-XXXX-9999',
        aadhaarHash: 'hash_' + Date.now(),
        village: 'Test Village',
        district: 'Test District',
        state: 'Uttar Pradesh',
        tehsil: 'Test Tehsil',
        block: 'Test Block',
        pincode: '226001',
        khasraNumber: '100/1',
        landOwnerName: 'Test Trust Farmer',
        bankName: 'State Bank of India',
        accountNumberMasked: 'XXXX XXXX 9999',
        accountNumberHash: 'bank_hash_' + Date.now(),
        ifscCode: 'SBIN0001234',
        trustScore: 100.0,
        status: 'VERIFIED',
      },
    });

    testCentre = await prisma.procurementCentre.findFirst();
    if (!testCentre) {
      testCentre = await prisma.procurementCentre.create({
        data: {
          centreId: 'CENTRE-TEST-' + Date.now(),
          name: 'Test Centre',
          district: 'Test District',
          state: 'Uttar Pradesh',
          pincode: '226001',
          open: true,
        },
      });
    }

    testCrop = await prisma.crop.findFirst();
    if (!testCrop) {
      testCrop = await prisma.crop.create({
        data: {
          name: 'Wheat',
          nameHi: 'गेहूं',
          code: 'WHEAT',
          category: 'Cereal',
        },
      });
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testFarmer) {
      await prisma.trustScoreHistory.deleteMany({ where: { farmerProfileId: testFarmer.id } });
      await prisma.procurementBooking.deleteMany({ where: { farmerProfileId: testFarmer.id } });
      await prisma.farmerProfile.delete({ where: { id: testFarmer.id } });
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  test('Initial trust score calculation should start at 100 with Excellent rating', async () => {
    const res = await calculateTrustScore(testFarmer.id);
    expect(res.score).toBe(100.0);
    expect(res.rating).toBe('Excellent');
    expect(res.completedBookings).toBe(0);
  });

  test('Adding an arrival (+10) trust event should keep score capped at 100', async () => {
    await addTrustEvent(testFarmer.id, 'Arrived on time (Wheat slot)', 10.0);
    const res = await calculateTrustScore(testFarmer.id);
    expect(res.score).toBe(100.0); // capped at 100
    expect(res.history.length).toBe(1);
    expect(res.history[0].points).toBe('+10');
  });

  test('Adding absent (-25) trust events should decrease score dynamically', async () => {
    await addTrustEvent(testFarmer.id, 'Absent on booked slot (Wheat slot)', -25.0);
    let res = await calculateTrustScore(testFarmer.id);
    expect(res.score).toBe(85.0);
    expect(res.rating).toBe('Good');

    await addTrustEvent(testFarmer.id, 'Absent on booked slot (Wheat slot)', -25.0);
    await addTrustEvent(testFarmer.id, 'Absent on booked slot (Wheat slot)', -25.0);
    await addTrustEvent(testFarmer.id, 'Absent on booked slot (Wheat slot)', -25.0);

    res = await calculateTrustScore(testFarmer.id);
    expect(res.score).toBe(10.0); // 100 + 10 - 25*4 = 10
    expect(res.rating).toBe('Blacklisted');
    expect(res.explanation).toContain('blacklisted');
  });

  test('Blacklisted farmer score is persisted in database FarmerProfile', async () => {
    const updatedFarmer = await prisma.farmerProfile.findUnique({ where: { id: testFarmer.id } });
    expect(updatedFarmer.trustScore).toBe(10.0);
  });
});
