const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'krishimitra_fallback_secret_key_987654';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'krishimitra_fallback_refresh_key_987654';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, mobile: user.mobile },
    JWT_SECRET,
    { expiresIn: '1d' } // Access token valid for 1 day
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
