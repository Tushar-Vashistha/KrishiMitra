const prisma = require('../config/db');
const { NotFoundError } = require('../utils/errors');

const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const category = req.query.category ? req.query.category.toUpperCase() : null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(category && ['SLOT', 'PAYMENT', 'CENTRE'].includes(category) ? { category } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const farmerIdStr = req.user.farmerProfile?.farmerId || String(userId);

    const formatted = notifications.map((n) => ({
      id: n.id,
      farmerId: farmerIdStr,
      userId: n.userId,
      category: n.category,
      type: n.type,
      title: n.title,
      message: n.message,
      relatedBookingId: n.relatedBookingId,
      relatedPaymentId: n.relatedPaymentId,
      relatedCentreId: n.relatedCentreId,
      isRead: n.isRead,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));

    res.status(200).json({
      success: true,
      unreadCount,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.status(200).json({
      success: true,
      unreadCount,
      count: unreadCount,
      data: { unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notificationId = parseInt(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== req.user.id) {
      throw new NotFoundError('Notification not found'); // obfuscate unauthorized access
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: updated,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
