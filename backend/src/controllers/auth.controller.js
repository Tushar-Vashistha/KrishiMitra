const prisma = require('../config/db');
const { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/auth');
const { hashSensitive, maskAadhaar, maskBankAccount } = require('../utils/helpers');
const { logAction } = require('../services/audit.service');
const { requestOTP, verifyOTP } = require('../services/otp.service');
const { BadRequestError, ConflictError, UnauthorizedError } = require('../utils/errors');

const registerFarmer = async (req, res, next) => {
  try {
    const data = req.body;

    // Check if mobile user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobile: data.mobile },
    });
    if (existingUser) {
      throw new ConflictError('A user with this mobile number already exists');
    }

    // Check if Aadhaar hash already exists
    const aadhaarHash = hashSensitive(data.aadhaar);
    const existingAadhaar = await prisma.farmerProfile.findUnique({
      where: { aadhaarHash },
    });
    if (existingAadhaar) {
      throw new ConflictError('A profile with this Aadhaar number already exists');
    }

    // Check if bank account hash already exists
    const accountNumberHash = hashSensitive(data.accountNumber);

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          mobile: data.mobile,
          password: hashedPassword,
          role: 'FARMER',
        },
      });

      const profile = await tx.farmerProfile.create({
        data: {
          userId: user.id,
          name: data.name,
          dob: data.dob,
          gender: data.gender,
          aadhaarMasked: maskAadhaar(data.aadhaar),
          aadhaarHash,
          mobile: data.mobile,
          village: data.village,
          district: data.district,
          state: data.state,
          tehsil: data.tehsil,
          block: data.block,
          pincode: data.pincode,
          khasraNumber: data.khasraNumber,
          landOwnerName: data.landOwnerName,
          bankName: data.bankName,
          accountNumberMasked: maskBankAccount(data.accountNumber),
          accountNumberHash,
          ifscCode: data.ifscCode,
          trustScore: 100.0,
          status: 'PENDING',
        },
      });

      return { user, profile };
    });

    // Log audit trail
    await logAction({
      userId: result.user.id,
      action: 'FARMER_REGISTRATION',
      entity: 'FarmerProfile',
      entityId: result.profile.id,
      metadata: { name: data.name, mobile: data.mobile },
    });

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      data: {
        userId: result.user.id,
        role: result.user.role,
        profile: {
          id: result.profile.id,
          name: result.profile.name,
          mobile: result.profile.mobile,
          aadhaarMasked: result.profile.aadhaarMasked,
          status: result.profile.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const registerCentre = async (req, res, next) => {
  try {
    const data = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobile: data.mobile },
    });
    if (existingUser) {
      throw new ConflictError('A user with this mobile number already exists');
    }

    // Verify centre exists
    const centre = await prisma.procurementCentre.findUnique({
      where: { centreId: data.centreId },
    });
    if (!centre) {
      throw new BadRequestError(`Procurement Centre with ID ${data.centreId} does not exist`);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create staff user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          mobile: data.mobile,
          password: hashedPassword,
          role: data.role,
        },
      });

      const profile = await tx.staffProfile.create({
        data: {
          userId: user.id,
          name: data.name,
          designation: data.designation,
          mobile: data.mobile,
        },
      });

      // Assign staff to centre
      await tx.staffAssignment.create({
        data: {
          staffProfileId: profile.id,
          centreId: centre.id,
          active: true,
        },
      });

      return { user, profile };
    });

    await logAction({
      userId: result.user.id,
      action: 'STAFF_REGISTRATION',
      entity: 'StaffProfile',
      entityId: result.profile.id,
      metadata: { name: data.name, centreId: data.centreId, role: data.role },
    });

    res.status(201).json({
      success: true,
      message: 'Centre staff registered successfully',
      data: {
        userId: result.user.id,
        role: result.user.role,
        profile: {
          id: result.profile.id,
          name: result.profile.name,
          designation: result.profile.designation,
          centreId: data.centreId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { mobile, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { mobile },
      include: {
        farmerProfile: true,
        staffProfile: {
          include: {
            assignments: {
              where: { active: true },
              include: { centre: true },
            },
          },
        },
      },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      throw new UnauthorizedError('Invalid mobile number or password');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await logAction({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          mobile: user.mobile,
          role: user.role,
          profile: user.role === 'FARMER' ? user.farmerProfile : user.staffProfile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    const accessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAction({
        userId: req.user.id,
        action: 'USER_LOGOUT',
        entity: 'User',
        entityId: req.user.id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          mobile: req.user.mobile,
          role: req.user.role,
          profile: req.user.role === 'FARMER' ? req.user.farmerProfile : req.user.staffProfile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const handleRequestOTP = async (req, res, next) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      throw new BadRequestError('Valid 10-digit mobile number is required');
    }

    const result = await requestOTP(mobile);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const handleVerifyOTP = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      throw new BadRequestError('Mobile number and OTP are required');
    }

    const isVerified = await verifyOTP(mobile, otp);
    if (!isVerified) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerFarmer,
  registerCentre,
  login,
  refresh,
  logout,
  getMe,
  handleRequestOTP,
  handleVerifyOTP,
};
