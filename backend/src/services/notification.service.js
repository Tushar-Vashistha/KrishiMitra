const prisma = require('../config/db');
const logger = require('../utils/logger');

const ALLOWED_CATEGORIES = ['SLOT', 'PAYMENT', 'CENTRE'];

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

/**
 * Creates and delivers a notification for a specific user with strict category enforcement
 * and duplicate prevention.
 */
const notifyUser = async ({
  userId,
  category = 'SLOT',
  type,
  title,
  message,
  relatedBookingId = null,
  relatedPaymentId = null,
  relatedCentreId = null,
}) => {
  try {
    if (!userId) {
      logger.error('Cannot create notification: userId is required');
      return null;
    }

    const upperCategory = (category || 'SLOT').toUpperCase();
    const finalCategory = ALLOWED_CATEGORIES.includes(upperCategory) ? upperCategory : 'SLOT';

    // Duplicate Prevention Check:
    // Check if an identical notification was created for this user with the same event identifiers
    const duplicateWhere = {
      userId: parseInt(userId),
      category: finalCategory,
      type,
    };
    if (relatedBookingId) duplicateWhere.relatedBookingId = String(relatedBookingId);
    if (relatedPaymentId) duplicateWhere.relatedPaymentId = parseInt(relatedPaymentId);
    if (relatedCentreId) duplicateWhere.relatedCentreId = parseInt(relatedCentreId);

    const existingNotif = await prisma.notification.findFirst({
      where: duplicateWhere,
      orderBy: { createdAt: 'desc' },
    });

    if (existingNotif) {
      // If notification was created in the last 12 hours for the exact same event state transition, skip duplicate creation
      const diffMinutes = (Date.now() - new Date(existingNotif.createdAt).getTime()) / (1000 * 60);
      if (diffMinutes < 720) {
        logger.info(`[NOTIFICATION DUP_PREVENTED] Skipped duplicate notification type=${type} for userId=${userId}`);
        return existingNotif;
      }
    }

    // Create in-app database notification
    const notification = await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        category: finalCategory,
        type: type || 'GENERAL_UPDATE',
        title,
        message,
        relatedBookingId: relatedBookingId ? String(relatedBookingId) : null,
        relatedPaymentId: relatedPaymentId ? parseInt(relatedPaymentId) : null,
        relatedCentreId: relatedCentreId ? parseInt(relatedCentreId) : null,
      },
    });

    // Trigger secondary log/contact channels
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { farmerProfile: true },
    });

    if (user && user.mobile) {
      const contact = user.mobile;
      const displayMsg = `${title}: ${message}`;
      await sendSMS(contact, displayMsg);
      await sendWhatsApp(contact, displayMsg);
    }

    return notification;
  } catch (error) {
    logger.error(`Failed to trigger notification: ${error.message}`);
    return null;
  }
};

const notifySlotEvent = async ({ userId, type, title, message, relatedBookingId, relatedCentreId }) => {
  return notifyUser({
    userId,
    category: 'SLOT',
    type,
    title,
    message,
    relatedBookingId,
    relatedCentreId,
  });
};

const notifyPaymentEvent = async ({ userId, type, title, message, relatedPaymentId, relatedBookingId }) => {
  return notifyUser({
    userId,
    category: 'PAYMENT',
    type,
    title,
    message,
    relatedPaymentId,
    relatedBookingId,
  });
};

const notifyCentreEvent = async ({ userId, type, title, message, relatedCentreId, relatedBookingId }) => {
  return notifyUser({
    userId,
    category: 'CENTRE',
    type,
    title,
    message,
    relatedCentreId,
    relatedBookingId,
  });
};

module.exports = {
  notifyUser,
  notifySlotEvent,
  notifyPaymentEvent,
  notifyCentreEvent,
  sendSMS,
  sendEmail,
  sendWhatsApp,
};
