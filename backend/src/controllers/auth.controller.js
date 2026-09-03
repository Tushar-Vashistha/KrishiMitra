const prisma = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/auth');
const { hashSensitive, maskAadhaar, maskBankAccount } = require('../utils/helpers');
const { logAction } = require('../services/audit.service');
const { requestOTP, verifyOTP } = require('../services/otp.service');
const { BadRequestError, ConflictError, UnauthorizedError } = require('../utils/errors');

const registerFarmer = async (req, res, next) => {
  try {
    const data = req.body;
    const cleanMobile = data.mobile ? data.mobile.toString().replace(/\D/g, '').slice(-10) : '';
    const aadhaarRaw = data.aadhaar ? data.aadhaar.toString().replace(/\D/g, '') : '987654321012';
    const aadhaarHash = hashSensitive(aadhaarRaw);
    const accountNumberRaw = data.accountNumber ? data.accountNumber.toString() : '9876543210';
    const accountNumberHash = hashSensitive(accountNumberRaw);
    const dobDate = data.dob ? new Date(data.dob) : new Date('1985-01-01');

    // If OTP is provided during registration, verify it
    if (data.otp) {
      const verification = await verifyOTP(cleanMobile, data.otp);
      if (!verification.valid) {
        if (verification.reason === 'EXPIRED_OTP') {
          throw new BadRequestError('OTP expired');
        }
        throw new BadRequestError('Invalid OTP');
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobile: cleanMobile },
    });
    if (existingUser) {
      throw new ConflictError('A user with this mobile number already exists');
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          mobile: cleanMobile,
          password: null,
          role: 'FARMER',
        },
      });

      const profile = await tx.farmerProfile.create({
        data: {
          userId: user.id,
          name: data.name || 'Farmer User',
          dob: dobDate,
          gender: data.gender || 'Male',
          aadhaarMasked: maskAadhaar(aadhaarRaw),
          aadhaarHash,
          mobile: cleanMobile,
          village: data.village || 'Bhagwanpur',
          district: data.district || 'Lucknow',
          state: data.state || 'Uttar Pradesh',
          tehsil: data.tehsil || 'Lucknow',
          block: data.block || data.tehsil || 'Lucknow',
          pincode: data.pincode || '226001',
          khasraNumber: data.khasraNumber || '101/A',
          landOwnerName: data.landOwnerName || data.name || 'Farmer User',
          bankName: data.bankName || 'State Bank of India',
          accountNumberMasked: maskBankAccount(accountNumberRaw),
          accountNumberHash,
          ifscCode: data.ifscCode || 'SBIN0001234',
          trustScore: 100.0,
          status: 'VERIFIED',
        },
      });

      return { user, profile };
    });

    const accessToken = generateAccessToken(result.user);
    const refreshToken = generateRefreshToken(result.user);

    logAction({
      userId: result.user.id,
      action: 'FARMER_REGISTRATION',
      entity: 'FarmerProfile',
      entityId: result.profile.id,
      metadata: { name: data.name, mobile: cleanMobile },
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
    const centreCode = data.centreId || 'UP-LKO-' + Math.floor(100 + Math.random() * 900);

    // If OTP is provided during registration, verify it
    if (data.otp) {
      const verification = await verifyOTP(cleanMobile, data.otp);
      if (!verification.valid) {
        if (verification.reason === 'EXPIRED_OTP') {
          throw new BadRequestError('OTP expired');
        }
        throw new BadRequestError('Invalid OTP');
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or update ProcurementCentre
      let centre = await tx.procurementCentre.findUnique({
        where: { centreId: centreCode },
      });

      const centreData = {
        name: data.centreName || data.name || 'Procurement Centre',
        nameHi: data.nameHi || data.centreName || 'खरीद केंद्र',
        type: data.centreType || data.type || 'Government',
        address: data.fullAddress || data.address || 'Mandi Samiti, Lucknow',
        agencyName: data.agencyName || 'State Mandi Board',
        licenseNumber: data.regLicenseNumber || data.licenseNumber || null,
        panGstin: data.panGstin || null,
        managerName: data.managerName || data.name || 'Manager',
        designation: data.designation || 'Centre Manager',
        mobile: cleanMobile,
        email: data.email || null,
        state: data.state || 'Uttar Pradesh',
        district: data.district || 'Lucknow',
        tehsil: data.blockTehsil || data.tehsil || 'Lucknow',
        village: data.villageTown || data.village || 'Lucknow',
        capacity: data.dailyCapacity ? parseFloat(data.dailyCapacity) : 500,
        maxStorage: data.maxStorageCapacity ? parseFloat(data.maxStorageCapacity) : 10000,
        weighingFacility: data.weighingFacility !== undefined ? (data.weighingFacility === 'Yes' || data.weighingFacility === true) : true,
        qualityTesting: data.qualityTestingFacility !== undefined ? (data.qualityTestingFacility === 'Yes' || data.qualityTestingFacility === true) : true,
        godownStorage: data.godownStorage !== undefined ? (data.godownStorage === 'Yes' || data.godownStorage === true) : true,
        staffCount: data.staffCount ? parseInt(data.staffCount) : 5,
      };

      if (!centre) {
        centre = await tx.procurementCentre.create({
          data: {
            centreId: centreCode,
            lat: 26.8467,
            lng: 80.9462,
            openingTime: '07:00 AM',
            closingTime: '08:00 PM',
            open: true,
            phone: cleanMobile,
            ...centreData,
          },
        });

        // Create default slots for new centre
        const defaultSlots = ['07:00 AM - 10:00 AM', '10:00 AM - 01:00 PM', '02:00 PM - 05:00 PM', '05:00 PM - 08:00 PM'];
        await tx.slotConfig.createMany({
          data: defaultSlots.map(time => ({ centreId: centre.id, slotTime: time, capacity: 10 })),
        });
      } else {
        centre = await tx.procurementCentre.update({
          where: { id: centre.id },
          data: centreData,
        });
      }

      // 2. Create or update User
      let user = await tx.user.findUnique({
        where: { mobile: cleanMobile },
      });

      const userRole = data.role || 'CENTRE_MANAGER';

      if (!user) {
        user = await tx.user.create({
          data: {
            mobile: cleanMobile,
            password: null,
            role: userRole,
          },
        });
      } else {
        user = await tx.user.update({
          where: { id: user.id },
          data: { role: userRole },
        });
      }

      // 3. Create or update StaffProfile
      let profile = await tx.staffProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        profile = await tx.staffProfile.create({
          data: {
            userId: user.id,
            name: data.managerName || data.name || 'Centre Manager',
            designation: data.designation || 'Manager',
            mobile: cleanMobile,
          },
        });
      } else {
        profile = await tx.staffProfile.update({
          where: { id: profile.id },
          data: {
            name: data.managerName || data.name || profile.name,
            designation: data.designation || profile.designation,
            mobile: cleanMobile,
          },
        });
      }

      // 4. Ensure StaffAssignment active
      const assignment = await tx.staffAssignment.findFirst({
        where: { staffProfileId: profile.id, centreId: centre.id },
      });
      if (!assignment) {
        await tx.staffAssignment.create({
          data: {
            staffProfileId: profile.id,
            centreId: centre.id,
            active: true,
          },
        });
      }

      return { user, profile, centre };
    });

    const accessToken = generateAccessToken(result.user);
    const refreshToken = generateRefreshToken(result.user);

    logAction({
      userId: result.user.id,
      action: 'STAFF_REGISTRATION',
      entity: 'StaffProfile',
      entityId: result.profile.id,
      metadata: { name: result.profile.name, centreId: result.centre.centreId, role: result.user.role },
    });

    const staffProfileData = {
      ...result.profile,
      centreId: result.centre.centreId,
      assignments: [{ centre: result.centre }],
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
    const { mobile, otp, role } = req.body;
    const cleanMobile = mobile ? mobile.toString().replace(/\D/g, '').slice(-10) : '';

    if (!cleanMobile || cleanMobile.length !== 10) {
      throw new BadRequestError('Valid 10-digit mobile number is required');
    }

    // Verify OTP if provided
    if (otp) {
      const verification = await verifyOTP(cleanMobile, otp);
      if (!verification.valid) {
        if (verification.reason === 'EXPIRED_OTP') {
          throw new BadRequestError('OTP expired');
        }
        throw new BadRequestError('Invalid OTP');
      }
    }

    let user = await prisma.user.findUnique({
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

    if (!user) {
      // Auto-provision new user for seamless OTP login
      const userRole = role === 'CENTRE_MANAGER' || role === 'CENTRE_STAFF' ? role : 'FARMER';
      const randomAadhaar = '99' + Math.floor(100000000 + Math.random() * 899999999).toString();
      const aadhaarHash = hashSensitive(randomAadhaar);
      const accountNumberHash = hashSensitive('987' + cleanMobile.slice(-9));

      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            mobile: cleanMobile,
            password: null,
            role: userRole,
          },
        });

        if (userRole === 'FARMER') {
          const profile = await tx.farmerProfile.create({
            data: {
              userId: newUser.id,
              name: 'Farmer User',
              dob: new Date('1985-01-01'),
              gender: 'Male',
              aadhaarMasked: maskAadhaar(randomAadhaar),
              aadhaarHash,
              mobile: cleanMobile,
              village: 'Bhagwanpur',
              district: 'Lucknow',
              state: 'Uttar Pradesh',
              tehsil: 'Lucknow',
              block: 'Lucknow',
              pincode: '226001',
              khasraNumber: '101/A',
              landOwnerName: 'Farmer User',
              bankName: 'State Bank of India',
              accountNumberMasked: maskBankAccount('987' + cleanMobile.slice(-9)),
              accountNumberHash,
              ifscCode: 'SBIN0001234',
              trustScore: 100.0,
              status: 'VERIFIED',
            },
          });
          return { ...newUser, farmerProfile: profile };
        } else {
          const profile = await tx.staffProfile.create({
            data: {
              userId: newUser.id,
              name: 'Centre Manager',
              designation: 'Manager',
              mobile: cleanMobile,
            },
          });
          return { ...newUser, staffProfile: profile };
        }
      });
      user = result;
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
      message: 'Login successful via OTP',
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
    const cleanMobile = mobile ? mobile.toString().replace(/\D/g, '').slice(-10) : '';
    if (!cleanMobile || cleanMobile.length !== 10) {
      throw new BadRequestError('Valid 10-digit mobile number is required');
    }

    const result = await requestOTP(cleanMobile);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const handleVerifyOTP = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;
    const cleanMobile = mobile ? mobile.toString().replace(/\D/g, '').slice(-10) : '';
    if (!cleanMobile || !otp) {
      throw new BadRequestError('Mobile number and OTP are required');
    }

    const verification = await verifyOTP(cleanMobile, otp);
    if (!verification.valid) {
      if (verification.reason === 'EXPIRED_OTP') {
        throw new BadRequestError('OTP expired');
      }
      throw new BadRequestError('Invalid OTP');
    }

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

    let authData = null;
    if (user) {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      authData = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          mobile: user.mobile,
          role: user.role,
          profile: user.role === 'FARMER' ? user.farmerProfile : user.staffProfile,
        },
      };
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: authData,
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
