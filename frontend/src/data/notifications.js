// Farmer Notifications Store & Real-time Broadcast Manager

export const INITIAL_NOTIFICATIONS = [
  {
    id: "NOTIF-INIT-1",
    title: "🎉 खरीद बिल (J-Form) जारी किया गया",
    titleEn: "🎉 Weighment Bill (J-Form) Issued",
    message: "भगवानपुर सरकारी खरीद केंद्र द्वारा 25 क्विंटल गेहूं का खरीद बिल #BILL-2026-101 (₹56,875) जारी किया गया। DBT भुगतान PFMS पर भेजा गया।",
    messageEn: "Bhagwanpur Govt Centre issued Weighment Bill #BILL-2026-101 for 25 Qtl Wheat (₹56,875). DBT payment initiated.",
    centreName: "Bhagwanpur Govt. Procurement Centre",
    tokenId: 101,
    type: "bill",
    status: "Procured & Billed",
    time: "10:15 AM",
    date: "Today",
    timestamp: Date.now() - 3600000,
    read: false,
    link: "/farmer/payment-history"
  },
  {
    id: "NOTIF-INIT-2",
    title: "🔵 खरीद केंद्र पर आगमन दर्ज (Gate-In)",
    titleEn: "🔵 Gate Entry Recorded (Checked-in)",
    message: "टोकन #101 के लिए केंद्र गेट पर उपस्थिति दर्ज हो चुकी है। तौल व गुणवत्ता जांच के लिए कांटा नंबर 1 पर जाएं।",
    messageEn: "Arrival confirmed for Token #101. Please proceed to Weighbridge Counter #1 for tare weighing & lab test.",
    centreName: "Bhagwanpur Govt. Procurement Centre",
    tokenId: 101,
    type: "arrived",
    status: "Arrived",
    time: "07:15 AM",
    date: "Today",
    timestamp: Date.now() - 7200000,
    read: false,
    link: "/farmer/track-slot"
  },
  {
    id: "NOTIF-INIT-3",
    title: "🌾 आगामी स्लॉट पुष्टि सूचना",
    titleEn: "🌾 Slot Booking Confirmed",
    message: "आपका 25 क्विंटल गेहूं का स्लॉट (07:00 AM - 10:00 AM) भगवानपुर केंद्र पर सफलतापूर्वक आरक्षित है।",
    messageEn: "Your Wheat slot (25 Qtl, 07:00 AM - 10:00 AM) is confirmed at Bhagwanpur Centre. Bring Aadhaar & vehicle.",
    centreName: "Bhagwanpur Govt. Procurement Centre",
    tokenId: 101,
    type: "slot",
    status: "Booked",
    time: "Yesterday",
    date: "Yesterday",
    timestamp: Date.now() - 86400000,
    read: true,
    link: "/farmer/track-slot"
  }
];

export const getFarmerNotifications = () => {
  try {
    const saved = localStorage.getItem("krishimitra_farmer_notifications");
    if (!saved) {
      localStorage.setItem("krishimitra_farmer_notifications", JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(saved);
  } catch (err) {
    return INITIAL_NOTIFICATIONS;
  }
};

export const pushFarmerNotification = (notif) => {
  const existing = getFarmerNotifications();
  const newNotif = {
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: "Today",
    timestamp: Date.now(),
    read: false,
    ...notif
  };
  const updated = [newNotif, ...existing];
  try {
    localStorage.setItem("krishimitra_farmer_notifications", JSON.stringify(updated));
    window.dispatchEvent(new Event("krishimitra_notification_update"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to save notification:", e);
  }
  return newNotif;
};

export const markNotificationAsRead = (id) => {
  const existing = getFarmerNotifications();
  const updated = existing.map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem("krishimitra_farmer_notifications", JSON.stringify(updated));
  window.dispatchEvent(new Event("krishimitra_notification_update"));
};

export const markAllNotificationsAsRead = () => {
  const existing = getFarmerNotifications();
  const updated = existing.map(n => ({ ...n, read: true }));
  localStorage.setItem("krishimitra_farmer_notifications", JSON.stringify(updated));
  window.dispatchEvent(new Event("krishimitra_notification_update"));
};

export const clearAllNotifications = () => {
  localStorage.setItem("krishimitra_farmer_notifications", JSON.stringify([]));
  window.dispatchEvent(new Event("krishimitra_notification_update"));
};
