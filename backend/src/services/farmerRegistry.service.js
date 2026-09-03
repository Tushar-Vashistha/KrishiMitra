/**
 * Government Farmer Registry Service
 * Provides verified farmer registry data and lookup mechanisms for KrishiMitra.
 * Used during registration to automatically retrieve complete personal,
 * address, land, and banking details based solely on Farmer ID.
 */

const DEMO_FARMER_REGISTRY = [
  {
    farmerId: 'FRM123456',
    aliases: ['UP-FARM-9021', '123456789012', 'FRM123456'],
    name: 'Ramesh Kumar',
    gender: 'Male',
    dob: '1980-01-01',
    aadhaar: '123456789012',
    defaultMobile: '9876543210',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    tehsil: 'Malihabad',
    block: 'Malihabad',
    village: 'Bhagwanpur',
    pincode: '226001',
    khasraNumber: '123/4B',
    landOwnerName: 'Ramesh Kumar',
    bankName: 'State Bank of India',
    accountNumber: '987654321012',
    ifscCode: 'SBIN0001234',
  },
  {
    farmerId: 'FRM789012',
    aliases: ['UP-FARM-4412', '234567890123', 'FRM789012'],
    name: 'Suresh Patel',
    gender: 'Male',
    dob: '1978-05-14',
    aadhaar: '234567890123',
    defaultMobile: '9876500012',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    tehsil: 'Pindra',
    block: 'Pindra',
    village: 'Shivpur',
    pincode: '221003',
    khasraNumber: '205/3A',
    landOwnerName: 'Suresh Patel',
    bankName: 'Punjab National Bank',
    accountNumber: '456789012345',
    ifscCode: 'PUNB0123400',
  },
  {
    farmerId: 'FRM345678',
    aliases: ['MP-FARM-6631', '345678901234', 'FRM345678'],
    name: 'Kamla Bai',
    gender: 'Female',
    dob: '1982-11-20',
    aadhaar: '345678901234',
    defaultMobile: '9876500034',
    state: 'Madhya Pradesh',
    district: 'Indore',
    tehsil: 'Sanwer',
    block: 'Sanwer',
    village: 'Chandrawatiganj',
    pincode: '453551',
    khasraNumber: '88/2C',
    landOwnerName: 'Kamla Bai',
    bankName: 'Bank of Baroda',
    accountNumber: '345678901234',
    ifscCode: 'BARB0SANWER',
  },
  {
    farmerId: 'FRM901234',
    aliases: ['PB-FARM-1102', '456789012345', 'FRM901234'],
    name: 'Gurpreet Singh',
    gender: 'Male',
    dob: '1975-08-10',
    aadhaar: '456789012345',
    defaultMobile: '9876500045',
    state: 'Punjab',
    district: 'Ludhiana',
    tehsil: 'Khanna',
    block: 'Khanna',
    village: 'Rahon',
    pincode: '141401',
    khasraNumber: '312/1K',
    landOwnerName: 'Gurpreet Singh',
    bankName: 'HDFC Bank',
    accountNumber: '501002345678',
    ifscCode: 'HDFC0001234',
  },
  {
    farmerId: 'FRM567890',
    aliases: ['RJ-FARM-5520', '567890123456', 'FRM567890'],
    name: 'Manju Devi',
    gender: 'Female',
    dob: '1986-03-25',
    aadhaar: '567890123456',
    defaultMobile: '9876500056',
    state: 'Rajasthan',
    district: 'Jaipur',
    tehsil: 'Chomu',
    block: 'Chomu',
    village: 'Morija',
    pincode: '303702',
    khasraNumber: '144/5B',
    landOwnerName: 'Manju Devi',
    bankName: 'State Bank of India',
    accountNumber: '678901234567',
    ifscCode: 'SBIN0031122',
  },
  {
    farmerId: 'FRM234567',
    aliases: ['FRM234567', '678901234567'],
    name: 'Rajeshwar Yadav',
    gender: 'Male',
    dob: '1983-07-19',
    aadhaar: '678901234567',
    defaultMobile: '9876500067',
    state: 'Bihar',
    district: 'Patna',
    tehsil: 'Danapur',
    block: 'Danapur',
    village: 'Khagaul',
    pincode: '801105',
    khasraNumber: '77/2D',
    landOwnerName: 'Rajeshwar Yadav',
    bankName: 'Canara Bank',
    accountNumber: '234510101234',
    ifscCode: 'CNRB0001234',
  },
];

/**
 * Validates whether the Farmer ID conforms to acceptable alphanumeric formats.
 * Accepts formats like: FRM123456, UP-FARM-9021, 123456789012, etc.
 */
const isValidFarmerIdFormat = (farmerId) => {
  if (!farmerId || typeof farmerId !== 'string') return false;
  const trimmed = farmerId.trim();
  // Must be 4 to 24 characters, alphanumeric with optional hyphens
  return /^[a-zA-Z0-9-]{4,24}$/.test(trimmed);
};

/**
 * Normalizes Farmer ID for consistent comparison
 */
const normalizeFarmerId = (farmerId) => {
  if (!farmerId) return '';
  return farmerId.toString().trim().toUpperCase();
};

/**
 * Looks up farmer details from the Government Registry by Farmer ID or alias.
 * Returns null if not found.
 */
const findFarmerInRegistry = (rawFarmerId) => {
  if (!rawFarmerId) return null;
  const normalized = normalizeFarmerId(rawFarmerId);
  const cleanAadhaar = rawFarmerId.toString().replace(/\D/g, '');

  const record = DEMO_FARMER_REGISTRY.find((f) => {
    if (f.farmerId.toUpperCase() === normalized) return true;
    if (f.aliases && f.aliases.some((a) => a.toUpperCase() === normalized)) return true;
    if (cleanAadhaar && cleanAadhaar.length === 12 && f.aadhaar === cleanAadhaar) return true;
    return false;
  });

  if (!record) return null;

  // Return a cloned object with standardized primary farmerId
  return {
    ...record,
    farmerId: record.farmerId,
  };
};

/**
 * Returns available demo Farmer ID suggestions for UI helpers
 */
const getDemoFarmerOptions = () => {
  return DEMO_FARMER_REGISTRY.map((f) => ({
    farmerId: f.farmerId,
    name: f.name,
    district: f.district,
    state: f.state,
    village: f.village,
  }));
};

module.exports = {
  isValidFarmerIdFormat,
  normalizeFarmerId,
  findFarmerInRegistry,
  getDemoFarmerOptions,
  DEMO_FARMER_REGISTRY,
};
