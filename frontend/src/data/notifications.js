import { notificationService } from '../services/api';

// Empty default - no fake or hardcoded notifications allowed
export const INITIAL_NOTIFICATIONS = [];

export const getFarmerNotifications = () => {
  return [];
};

export const fetchFarmerNotifications = async (category) => {
  try {
    const res = await notificationService.getMy(category);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch backend notifications:', err);
    return [];
  }
};

export const fetchUnreadNotificationCount = async () => {
  try {
    const res = await notificationService.getUnreadCount();
    if (res && res.success) {
      return res.unreadCount ?? res.count ?? 0;
    }
    return 0;
  } catch (err) {
    return 0;
  }
};

export const pushFarmerNotification = (notif) => {
  window.dispatchEvent(new Event('krishimitra_notification_update'));
  return notif;
};

export const markNotificationAsRead = async (id) => {
  try {
    if (id) {
      await notificationService.markRead(id);
      window.dispatchEvent(new Event('krishimitra_notification_update'));
    }
  } catch (err) {
    console.error('Failed to mark notification read:', err);
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    await notificationService.markAllRead();
    window.dispatchEvent(new Event('krishimitra_notification_update'));
  } catch (err) {
    console.error('Failed to mark all notifications read:', err);
  }
};

export const clearAllNotifications = async () => {
  try {
    await notificationService.markAllRead();
    window.dispatchEvent(new Event('krishimitra_notification_update'));
  } catch (err) {
    console.error('Failed to clear notifications:', err);
  }
};
