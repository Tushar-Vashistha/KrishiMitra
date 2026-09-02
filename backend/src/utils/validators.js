const { z } = require('zod');

const registerFarmerSchema = z.object({
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be a 10-digit number'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name is required'),
  dob: z.string().transform((val) => new Date(val)),
  gender: z.string().min(1, 'Gender is required'),
  aadhaar: z.string().regex(/^[0-9]{12}$/, 'Aadhaar must be a 12-digit number'),
  village: z.string().min(1, 'Village is required'),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required'),
  tehsil: z.string().min(1, 'Tehsil is required'),
  block: z.string().min(1, 'Block is required'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
  khasraNumber: z.string().min(1, 'Khasra number is required'),
  landOwnerName: z.string().min(1, 'Land owner name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(9, 'Bank account number is required'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
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
