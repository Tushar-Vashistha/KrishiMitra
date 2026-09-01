const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

const hashSensitive = (value) => {
  const normalized = value.toString().replace(/[^a-zA-Z0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

const maskAadhaar = (aadhaar) => `XXXX XXXX ${aadhaar.slice(-4)}`;
const maskBankAccount = (accountNo) => `XXXX XXXX ${accountNo.slice(-4)}`;

async function seedUsers() {
  console.log('Seeding demo users...');
  const passwordHash = await bcrypt.hash('password123', 6);

  // Admin
  await prisma.user.upsert({
    where: { mobile: '9999999999' },
    update: {},
    create: { mobile: '9999999999', password: passwordHash, role: 'ADMIN' },
  });

  // Centre Manager
  const managerUser = await prisma.user.upsert({
    where: { mobile: '9876500001' },
    update: {},
    create: { mobile: '9876500001', password: passwordHash, role: 'CENTRE_MANAGER' },
  });

  const centre = await prisma.procurementCentre.findFirst();

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

  if (centre) {
    await prisma.staffAssignment.create({
      data: { staffProfileId: managerProfile.id, centreId: centre.id, active: true },
    }).catch(() => null);
  }

  // Farmer User
  const farmerUser = await prisma.user.upsert({
    where: { mobile: '9876543210' },
    update: {},
    create: { mobile: '9876543210', password: passwordHash, role: 'FARMER' },
  });

  const farmerProfile = await prisma.farmerProfile.upsert({
    where: { userId: farmerUser.id },
    update: {},
    create: {
      userId: farmerUser.id,
      name: 'Ramesh Kumar',
      dob: new Date('1980-01-01'),
      gender: 'Male',
      aadhaarMasked: maskAadhaar('123456789012'),
      aadhaarHash: hashSensitive('123456789012'),
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
      accountNumberMasked: maskBankAccount('987654321012'),
      accountNumberHash: hashSensitive('987654321012'),
      ifscCode: 'SBIN0001234',
      trustScore: 100.0,
      status: 'VERIFIED',
    },
  });

  const crops = await prisma.crop.findMany({ take: 2 });
  if (crops.length >= 2) {
    await prisma.farmerCropRegistration.createMany({
      data: [
        { farmerProfileId: farmerProfile.id, cropId: crops[0].id, area: 2.5, estimatedYield: 50.0 },
        { farmerProfileId: farmerProfile.id, cropId: crops[1].id, area: 3.0, estimatedYield: 60.0 },
      ],
      skipDuplicates: true,
    });
  }

  console.log('Demo users seeded successfully!');
}

seedUsers()
  .catch((e) => console.error('Seed error:', e))
  .finally(() => prisma.$disconnect());
