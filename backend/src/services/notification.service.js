const prisma = require('../config/db');
const logger = require('../utils/logger');

const sendSMS = async (to, message) => {
  logger.info(`[NOTIFICATION SMS] Sending to ${to}: "${message}"`);
  return true;
};

const sendEmail = async (to, subject, body) => {
  logger.info(`[NOTIFICATION EMAIL] Sending to ${to} | Subject: "${subject}" | Body: "${body}"`);
  return true;
};

const sendWhatsApp = async (to, message) => {
  logger.info(`[NOTIFICATION WHATSAPP] Sending to ${to}: "${message}"`);
  return true;
};

const notifyUser = async ({ userId, title, message, type }) => {
  try {
    // 1. Create in-app database notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });

    // 2. Fetch user contact details to trigger mock channels
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { farmerProfile: true, staffProfile: true },
    });

    if (user) {
      const contact = user.mobile;
      const displayMsg = `${title}: ${message}`;
      
      // Trigger mock channels
      await sendSMS(contact, displayMsg);
      await sendWhatsApp(contact, displayMsg);
      if (user.farmerProfile && user.farmerProfile.email) {
        await sendEmail(user.farmerProfile.email, title, message);
      }
    }

    return notification;
  } catch (error) {
    logger.error(`Failed to trigger notification: ${error.message}`);
  }
};

module.exports = {
  notifyUser,
  sendSMS,
  sendEmail,
  sendWhatsApp,
};
