const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

const hashSensitive = (value) => {
  const normalized = value.toString().replace(/[^a-zA-Z0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

const maskAadhaar = (aadhaar) => {
  const cleaned = aadhaar.toString().replace(/\s/g, '');
  return `XXXX XXXX ${cleaned.slice(-4)}`;
};

const maskBankAccount = (accountNo) => {
  const cleaned = accountNo.toString().replace(/\s/g, '');
  return `XXXX XXXX ${cleaned.slice(-4)}`;
};

async function main() {
  console.log('Seeding database with SIH Demo data...');

  // 1. Seed System Settings
  await prisma.systemSetting.upsert({
    where: { key: 'tatkaal_fee' },
    update: {},
    create: { key: 'tatkaal_fee', value: '50.0' },
  });

  // 2. Seed Crops
  const cropsData = [
    { name: 'Paddy', nameHi: 'धान / चावल', code: 'PADDY', unit: '₹/Qtl' },
    { name: 'Wheat', nameHi: 'गेहूं', code: 'WHEAT', unit: '₹/Qtl' },
    { name: 'Mustard', nameHi: 'सरसों', code: 'MUSTARD', unit: '₹/Qtl' },
    { name: 'Sugarcane', nameHi: 'गन्ना', code: 'SUGARCANE', unit: '₹/Qtl' },
    { name: 'Maize', nameHi: 'मक्का', code: 'MAIZE', unit: '₹/Qtl' },
    { name: 'Chana', nameHi: 'चना', code: 'CHANA', unit: '₹/Qtl' },
    { name: 'Soybean', nameHi: 'सोयाबीन', code: 'SOYBEAN', unit: '₹/Qtl' },
    { name: 'Groundnut', nameHi: 'मूंगफली', code: 'GROUNDNUT', unit: '₹/Qtl' },
  ];

  const crops = [];
  for (const c of cropsData) {
    const crop = await prisma.crop.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
    crops.push(crop);
  }

  // 3. Seed Crop Grades
  for (const crop of crops) {
    await prisma.cropGrade.createMany({
      data: [
        { cropId: crop.id, name: 'Grade A', priceAdjustment: 50.0 },
        { cropId: crop.id, name: 'General', priceAdjustment: 0.0 },
      ],
      skipDuplicates: true,
    });
  }

  // 4. Seed Procurement Season
  const season = await prisma.procurementSeason.create({
    data: {
      name: 'Rabi Season 2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      active: true,
    },
  }).catch(() => null); // handle potential duplicate key if seeded already

  const activeSeason = season || await prisma.procurementSeason.findFirst({ where: { active: true } });

  // 5. Seed Procurement Centres
  const centresData = [
    {
      centreId: 'UP-LKO-001',
      name: 'Bhagwanpur Govt. Procurement Centre',
      nameHi: 'भगवानपुर सरकारी खरीद केंद्र',
      type: 'Government',
      address: 'NH-27, Bhagwanpur, Lucknow',
      lat: 26.8467,
      lng: 80.9462,
      openingTime: '08:00 AM',
      closingTime: '06:00 PM',
      phone: '0522-2200001',
    },
    {
      centreId: 'UP-LKO-002',
      name: 'Mohanlalganj Cooperative Centre',
      nameHi: 'मोहनलालगंज सहकारी केंद्र',
      type: 'Cooperative',
      address: 'Mohanlalganj Road, Lucknow',
      lat: 26.7427,
      lng: 80.8989,
      openingTime: '09:00 AM',
      closingTime: '05:00 PM',
      phone: '0522-2200002',
    },
    {
      centreId: 'UP-LKO-003',
      name: 'Malihabad PACS Centre',
      nameHi: 'मलिहाबाद PACS केंद्र',
      type: 'Government',
      address: 'Malihabad, Lucknow',
      lat: 26.9151,
      lng: 80.7264,
      openingTime: '08:00 AM',
      closingTime: '05:00 PM',
      phone: '0522-2200003',
    },
  ];

  const centres = [];
  for (const c of centresData) {
    const centre = await prisma.procurementCentre.upsert({
      where: { centreId: c.centreId },
      update: {},
      create: c,
    });
    centres.push(centre);

    // Seed slots for each centre
    await prisma.slotConfig.deleteMany({ where: { centreId: centre.id } });
    const defaultSlots = [
      { time: '07:00 AM - 10:00 AM', capacity: 10 },
      { time: '10:00 AM - 01:00 PM', capacity: 10 },
      { time: '02:00 PM - 05:00 PM', capacity: 10 },
      { time: '05:00 PM - 08:00 PM', capacity: 10 },
    ];
    await prisma.slotConfig.createMany({
      data: defaultSlots.map((s) => ({
        centreId: centre.id,
        slotTime: s.time,
        capacity: s.capacity,
      })),
    });

    // Seed Counters for each centre
    const counterCount = await prisma.counter.count({ where: { centreId: centre.id } });
    if (counterCount === 0) {
      await prisma.counter.createMany({
        data: [
          { centreId: centre.id, counterNumber: 1, status: 'AVAILABLE' },
          { centreId: centre.id, counterNumber: 2, status: 'AVAILABLE' },
          { centreId: centre.id, counterNumber: 3, status: 'AVAILABLE' },
        ],
      });
    }
  }

  // 6. Seed Crop prices
  // Rates matching frontend mock values:
  // Rice/Paddy msp=2183, market=2210
  // Wheat msp=2275, market=2310
  // Mustard msp=5650, market=5700
  const cropPricesMap = {
    Paddy: { msp: 2183, market: 2210 },
    Wheat: { msp: 2275, market: 2310 },
    Mustard: { msp: 5650, market: 5700 },
    Sugarcane: { msp: 315, market: 340 },
    Maize: { msp: 2090, market: 2120 },
    Chana: { msp: 5440, market: 5500 },
    Soybean: { msp: 4600, market: 4520 },
    Groundnut: { msp: 6377, market: 6500 },
  };

  const effectiveDate = new Date('2026-01-01');
  for (const crop of crops) {
    const priceInfo = cropPricesMap[crop.name] || { msp: 1000, market: 1100 };
    
    // Global price (centreId = null)
    await prisma.cropPrice.create({
      data: {
        cropId: crop.id,
        centreId: null,
        mspPrice: priceInfo.msp,
        marketPrice: priceInfo.market,
        effectiveDate,
      },
    }).catch(() => null);

    // Centre-specific price (for Bhagwanpur centre UP-LKO-001)
    await prisma.cropPrice.create({
      data: {
        cropId: crop.id,
        centreId: centres[0].id,
        mspPrice: priceInfo.msp,
        marketPrice: priceInfo.market,
        effectiveDate,
      },
    }).catch(() => null);
  }

  // 7. Seed Admin User
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { mobile: '9999999999' },
    update: {},
    create: {
      mobile: '9999999999',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  // 8. Seed Centre Manager
  const managerUser = await prisma.user.upsert({
    where: { mobile: '9876500001' },
    update: {},
    create: {
      mobile: '9876500001',
      password: passwordHash,
      role: 'CENTRE_MANAGER',
    },
  });

  const managerProfile = await prisma.staffProfile.upsert({
    where: { userId: managerUser.id },
    update: {},
    create: {
      userId: managerUser.id,
      name: 'Anil Verma',
      designation: 'Centre Manager',
      mobile: '9876500001',
    },
  });

  await prisma.staffAssignment.create({
    data: {
      staffProfileId: managerProfile.id,
      centreId: centres[0].id,
      active: true,
    },
  }).catch(() => null);

  // 9. Seed Farmer User (Ramesh Kumar - matching mock user profile)
  const farmerUser = await prisma.user.upsert({
    where: { mobile: '9876543210' },
    update: {},
    create: {
      mobile: '9876543210',
      password: passwordHash,
      role: 'FARMER',
    },
  });

  const rawAadhaar = '123456789012';
  const rawBankAccount = '987654321012';

  const farmerProfile = await prisma.farmerProfile.upsert({
    where: { userId: farmerUser.id },
    update: {},
    create: {
      userId: farmerUser.id,
      name: 'Ramesh Kumar',
      dob: new Date('1980-01-01'),
      gender: 'Male',
      aadhaarMasked: maskAadhaar(rawAadhaar),
      aadhaarHash: hashSensitive(rawAadhaar),
      mobile: '9876543210',
      village: 'Bhagwanpur',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
      tehsil: 'Lucknow',
      block: 'Lucknow',
      pincode: '226001',
      khasraNumber: '123/4B',
      landOwnerName: 'Ramesh Kumar',
      bankName: 'State Bank of India',
      accountNumberMasked: maskBankAccount(rawBankAccount),
      accountNumberHash: hashSensitive(rawBankAccount),
      ifscCode: 'SBIN0001234',
      trustScore: 100.0,
      status: 'VERIFIED', // already verified to support instant bookings in demo
    },
  });

  // Seed crop registration for farmer
  await prisma.farmerCropRegistration.createMany({
    data: [
      { farmerProfileId: farmerProfile.id, cropId: crops[0].id, area: 2.5, estimatedYield: 50.0 }, // Paddy
      { farmerProfileId: farmerProfile.id, cropId: crops[1].id, area: 3.0, estimatedYield: 60.0 }, // Wheat
    ],
    skipDuplicates: true,
  });

  console.log('Database seeded successfully! Demo profiles created:');
  console.log('- Admin User: 9999999999 / password123');
  console.log('- Manager (Anil Verma): 9876500001 / password123');
  console.log('- Farmer (Ramesh Kumar): 9876543210 / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
