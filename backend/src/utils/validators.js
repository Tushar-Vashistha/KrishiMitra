const { z } = require('zod');

const registerFarmerSchema = z.object({
  farmerId: z.string().min(4, 'Farmer ID is required').max(24, 'Farmer ID is too long').optional(),
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be a 10-digit number'),
  otp: z.string().optional().default('123456'),
  password: z.string().optional(),
  name: z.string().optional(),
  dob: z.union([z.string(), z.date()]).optional(),
  gender: z.string().optional(),
  aadhaar: z.string().optional(),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  tehsil: z.string().optional(),
  block: z.string().optional(),
  pincode: z.string().optional(),
  khasraNumber: z.string().optional(),
  landOwnerName: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
});

const validateFarmerIdSchema = z.object({
  farmerId: z.string().min(4, 'Farmer ID must be at least 4 characters').max(24, 'Farmer ID is too long'),
});

const registerCentreSchema = z.object({
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be a 10-digit number'),
  password: z.string().optional(),
  otp: z.string().optional(),
  name: z.string().min(2, 'Name is required'),
  designation: z.string().min(2, 'Designation is required'),
  centreId: z.string().min(1, 'Centre ID is required'), // e.g. UP-LKO-001
  role: z.enum(['CENTRE_STAFF', 'CENTRE_MANAGER']).default('CENTRE_STAFF'),
});

const loginSchema = z.object({
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be a 10-digit number'),
  otp: z.string().optional(),
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
  validateFarmerIdSchema,
  registerCentreSchema,
  loginSchema,
  bookingSchema,
  tatkaalBookingSchema,
  weighingSchema,
  qualitySchema,
  paymentStatusSchema,
};
