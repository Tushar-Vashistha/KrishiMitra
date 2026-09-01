const prisma = require('../config/db');
const { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/auth');
const { hashSensitive, maskAadhaar, maskBankAccount } = require('../utils/helpers');
const { logAction } = require('../services/audit.service');
const { requestOTP, verifyOTP } = require('../services/otp.service');
const { BadRequestError, ConflictError, UnauthorizedError } = require('../utils/errors');

const registerFarmer = async (req, res, next) => {
  try {
    const data = req.body;
    const cleanMobile = data.mobile ? data.mobile.toString().replace(/\D/g, '').slice(-10) : '';

    // Check if mobile user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobile: cleanMobile },
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
          mobile: cleanMobile,
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
          mobile: cleanMobile,
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

    // Generate Auth Tokens directly
    const accessToken = generateAccessToken(result.user);
    const refreshToken = generateRefreshToken(result.user);

    // Log audit trail asynchronously
    logAction({
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
        accessToken,
        refreshToken,
        userId: result.user.id,
        role: result.user.role,
        profile: result.profile,
        user: {
          id: result.user.id,
          mobile: result.user.mobile,
          role: result.user.role,
          profile: result.profile,
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
    const cleanMobile = data.mobile ? data.mobile.toString().replace(/\D/g, '').slice(-10) : '';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobile: cleanMobile },
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
          mobile: cleanMobile,
          password: hashedPassword,
          role: data.role,
        },
      });

      const profile = await tx.staffProfile.create({
        data: {
          userId: user.id,
          name: data.name,
          designation: data.designation,
          mobile: cleanMobile,
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

    // Generate Auth Tokens directly
    const accessToken = generateAccessToken(result.user);
    const refreshToken = generateRefreshToken(result.user);

    logAction({
      userId: result.user.id,
      action: 'STAFF_REGISTRATION',
      entity: 'StaffProfile',
      entityId: result.profile.id,
      metadata: { name: data.name, centreId: data.centreId, role: data.role },
    });

    const staffProfileData = {
      ...result.profile,
      centreId: data.centreId,
      assignments: [{ centre }],
    };

    res.status(201).json({
      success: true,
      message: 'Centre staff registered successfully',
      data: {
        accessToken,
        refreshToken,
        userId: result.user.id,
        role: result.user.role,
        profile: staffProfileData,
        user: {
          id: result.user.id,
          mobile: result.user.mobile,
          role: result.user.role,
          profile: staffProfileData,
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
    const cleanMobile = mobile ? mobile.toString().replace(/\D/g, '').slice(-10) : '';

    const user = await prisma.user.findUnique({
      where: { mobile: cleanMobile },
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

    logAction({
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
