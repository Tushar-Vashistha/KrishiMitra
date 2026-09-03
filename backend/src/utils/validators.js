const { z } = require('zod');

const registerFarmerSchema = z.object({
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be a 10-digit number'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name is required'),
  dob: z.union([z.string(), z.date()]).optional().transform((val) => val ? new Date(val) : new Date('1985-01-01')),
  gender: z.string().optional().default('Male'),
  aadhaar: z.string().regex(/^[0-9]{12}$/, 'Aadhaar must be a 12-digit number'),
  village: z.string().optional().default('Bhagwanpur'),
  district: z.string().optional().default('Lucknow'),
  state: z.string().optional().default('Uttar Pradesh'),
  tehsil: z.string().optional().default('Lucknow'),
  block: z.string().optional().default('Lucknow'),
  pincode: z.string().optional().default('226001'),
  khasraNumber: z.string().optional().default('101/A'),
  landOwnerName: z.string().optional().default('Farmer User'),
  bankName: z.string().optional().default('State Bank of India'),
  accountNumber: z.string().optional().default('9876543210'),
  ifscCode: z.string().regex(/^[a-zA-Z]{4}0[a-zA-Z0-9]{6}$/, 'Invalid IFSC code format').transform((val) => val.toUpperCase()),
});

const registerCentreSchema = z.object({
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be a 10-digit number'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name is required'),
  designation: z.string().min(2, 'Designation is required'),
  centreId: z.string().min(1, 'Centre ID is required'), // e.g. UP-LKO-001
  role: z.enum(['CENTRE_STAFF', 'CENTRE_MANAGER']).default('CENTRE_STAFF'),
});

const loginSchema = z.object({
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be a 10-digit number'),
  password: z.string().optional(),
  role: z.enum(['FARMER', 'CENTRE_MANAGER', 'CENTRE_STAFF']).optional(),
});

const bookingSchema = z.object({
  cropId: z.number().int(),
  weight: z.number().positive('Weight must be positive'),
  centreId: z.number().int(),
  date: z.string().transform((val) => new Date(val)),
  slotTime: z.string().min(1, 'Slot time is required'),
  vehicleNumber: z.string().optional(),
  vehicleType: z.string().optional(),
});

const tatkaalBookingSchema = z.object({
  cropId: z.number().int(),
  weight: z.number().positive(),
  centreId: z.number().int(),
  date: z.string().transform((val) => new Date(val)),
  slotTime: z.string().optional(),
  vehicleNumber: z.string().optional(),
  vehicleType: z.string().optional(),
});

const weighingSchema = z.object({
  grossWeight: z.number().positive('Gross weight must be positive'),
  tareWeight: z.number().nonnegative('Tare weight cannot be negative'),
  deviceMetadata: z.string().optional(),
});

const qualitySchema = z.object({
  moisture: z.number().nonnegative(),
  foreignMatter: z.number().nonnegative(),
  grade: z.string().min(1, 'Grade is required'),
  result: z.enum(['PASSED', 'FAILED', 'CONDITIONAL']),
  rejectionReason: z.string().optional(),
});

const paymentStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED']),
  referenceId: z.string().optional(),
});

module.exports = {
  registerFarmerSchema,
  registerCentreSchema,
  loginSchema,
  bookingSchema,
  tatkaalBookingSchema,
  weighingSchema,
  qualitySchema,
  paymentStatusSchema,
};
