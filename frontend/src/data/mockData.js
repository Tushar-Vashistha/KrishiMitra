// Mock data for SIH demo

export const mockUser = {
  farmer: {
    name: "Ramesh Kumar",
    mobile: "9876543210",
    village: "Bhagwanpur",
    district: "Lucknow",
    state: "Uttar Pradesh",
    aadhaar: "XXXX XXXX 1234",
    khasraNumber: "123/4B",
    landOwnerName: "Ramesh Kumar",
    bank: "State Bank of India",
    accountNumber: "XXXX XXXX 5678",
    trustScore: 100,
    totalBookings: 24,
    completedBookings: 21,
    onTimeRate: 92,
    cancellationRate: 8,
  },
  centre: {
    name: "Shri Ram Procurement Centre",
    centreId: "UP-LKO-001",
    manager: "Anil Verma",
    designation: "Centre Manager",
    mobile: "9876500001",
    district: "Lucknow",
    state: "Uttar Pradesh",
  }
};

export const mockMandiRates = [
  { id: 1, crop: "Rice", cropHi: "धान / चावल", msp: 2183, market: 2210, unit: "₹/Qtl", change: "+27", trend: "up" },
  { id: 2, crop: "Wheat", cropHi: "गेहूं", msp: 2275, market: 2310, unit: "₹/Qtl", change: "+35", trend: "up" },
  { id: 3, crop: "Mustard", cropHi: "सरसों", msp: 5650, market: 5700, unit: "₹/Qtl", change: "+50", trend: "up" },
  { id: 4, crop: "Sugarcane", cropHi: "गन्ना", msp: 315, market: 340, unit: "₹/Qtl", change: "+25", trend: "up" },
  { id: 5, crop: "Onion", cropHi: "प्याज़", msp: 1500, market: 1650, unit: "₹/Qtl", change: "+150", trend: "up" },
  { id: 6, crop: "Tomato", cropHi: "टमाटर", msp: 1200, market: 1100, unit: "₹/Qtl", change: "-100", trend: "down" },
  { id: 7, crop: "Maize", cropHi: "मक्का", msp: 2090, market: 2120, unit: "₹/Qtl", change: "+30", trend: "up" },
  { id: 8, crop: "Potato", cropHi: "आलू", msp: 1000, market: 1200, unit: "₹/Qtl", change: "+200", trend: "up" },
  { id: 9, crop: "Soybean", cropHi: "सोयाबीन", msp: 4600, market: 4520, unit: "₹/Qtl", change: "-80", trend: "down" },
  { id: 10, crop: "Groundnut", cropHi: "मूंगफली", msp: 6377, market: 6500, unit: "₹/Qtl", change: "+123", trend: "up" },
  { id: 11, crop: "Chana", cropHi: "चना", msp: 5440, market: 5500, unit: "₹/Qtl", change: "+60", trend: "up" },
];

export const mockCentres = [
  {
    id: 1,
    name: "Bhagwanpur Govt. Procurement Centre",
    nameHi: "भगवानपुर सरकारी खरीद केंद्र",
    type: "Government",
    distance: "2.3 km",
    open: true,
    openTime: "08:00 AM",
    closeTime: "06:00 PM",
    slotsAvailable: 8,
    address: "NH-27, Bhagwanpur, Lucknow",
    lat: 26.8467,
    lng: 80.9462,
    crops: ["Wheat", "Paddy", "Maize"],
    phone: "0522-XXXXXXX",
  },
  {
    id: 2,
    name: "Mohanlalganj Cooperative Centre",
    nameHi: "मोहनलालगंज सहकारी केंद्र",
    type: "Cooperative",
    distance: "5.1 km",
    open: true,
    openTime: "09:00 AM",
    closeTime: "05:00 PM",
    slotsAvailable: 3,
    address: "Mohanlalganj Road, Lucknow",
    lat: 26.7427,
    lng: 80.8989,
    crops: ["Wheat", "Mustard"],
    phone: "0522-XXXXXXX",
  },
  {
    id: 3,
    name: "Malihabad PACS Centre",
    nameHi: "मलिहाबाद PACS केंद्र",
    type: "Government",
    distance: "8.7 km",
    open: false,
    openTime: "08:00 AM",
    closeTime: "05:00 PM",
    slotsAvailable: 0,
    address: "Malihabad, Lucknow",
    lat: 26.9151,
    lng: 80.7264,
    crops: ["Wheat", "Paddy", "Maize", "Mustard"],
    phone: "0522-XXXXXXX",
  },
  {
    id: 4,
    name: "Kakori Private Authorized Centre",
    nameHi: "ककोरी अधिकृत निजी केंद्र",
    type: "Authorized Private",
    distance: "11.2 km",
    open: true,
    openTime: "07:00 AM",
    closeTime: "07:00 PM",
    slotsAvailable: 12,
    address: "Kakori Market, Lucknow",
    lat: 26.8784,
    lng: 80.7543,
    crops: ["Wheat", "Soybean", "Gram"],
    phone: "0522-XXXXXXX",
  },
];

export const mockSlots = [
  { id: "S1", time: "08:00 - 09:00", available: true },
  { id: "S2", time: "09:00 - 10:00", available: false },
  { id: "S3", time: "10:00 - 11:00", available: false },
  { id: "S4", time: "11:00 - 12:00", available: true },
  { id: "S5", time: "12:00 - 13:00", available: true },
  { id: "S6", time: "13:00 - 14:00", available: false },
  { id: "S7", time: "14:00 - 15:00", available: true },
  { id: "S8", time: "15:00 - 16:00", available: true },
  { id: "S9", time: "16:00 - 17:00", available: true },
  { id: "S10", time: "17:00 - 18:00", available: false },
];

export const mockBookings = {
  farmer: [
    {
      id: "BK-2024-001",
      centre: "Bhagwanpur Govt. Centre",
      crop: "Wheat",
      weight: 25,
      slot: "10:00 - 11:00",
      date: "2024-11-15",
      status: "Confirmed",
      token: 42,
      waitingTime: 35,
      queuePosition: 3,
      payment: "Pending",
      amount: 56875,
    }
  ],
  centre: [
    { id: "BK-2024-001", farmer: "Ramesh Kumar", crop: "Wheat", weight: 25, slot: "10:00-11:00", status: "Processing", payment: "Pending", mobile: "9876543210" },
    { id: "BK-2024-002", farmer: "Suresh Yadav", crop: "Paddy", weight: 40, slot: "10:00-11:00", status: "Verification", payment: "Pending", mobile: "9876543211" },
    { id: "BK-2024-003", farmer: "Mohan Lal", crop: "Wheat", weight: 15, slot: "11:00-12:00", status: "Confirmed", payment: "Done", mobile: "9876543212" },
    { id: "BK-2024-004", farmer: "Anita Devi", crop: "Mustard", weight: 20, slot: "11:00-12:00", status: "Confirmed", payment: "Pending", mobile: "9876543213" },
    { id: "BK-2024-005", farmer: "Ram Prasad", crop: "Maize", weight: 30, slot: "12:00-13:00", status: "Confirmed", payment: "Pending", mobile: "9876543214" },
  ]
};

export const mockPaymentHistory = [
  { id: "PAY-001", date: "2024-11-10", crop: "Wheat", weight: 20, amount: 45500, status: "Paid", centre: "Bhagwanpur Centre" },
  { id: "PAY-002", date: "2024-10-25", crop: "Paddy", weight: 35, amount: 76405, status: "Paid", centre: "Mohanlalganj Centre" },
  { id: "PAY-003", date: "2024-10-05", crop: "Mustard", weight: 15, amount: 84750, status: "Paid", centre: "Bhagwanpur Centre" },
  { id: "PAY-004", date: "2024-09-20", crop: "Maize", weight: 10, amount: 20900, status: "Paid", centre: "Kakori Centre" },
];

export const mockCounters = [
  { id: 1, token: 42, farmer: "Ramesh Kumar", status: "Processing" },
  { id: 2, token: 43, farmer: "Suresh Yadav", status: "Processing" },
  { id: 3, token: 44, farmer: "Mohan Lal", status: "Verification" },
  { id: 4, token: null, farmer: null, status: "Available" },
];

export const chatbotResponses = {
  "slot": "To book a slot, go to 'Book Slot' from your dashboard. Select your crop type, estimated weight, nearby centre, and choose an available time slot. | स्लॉट बुक करने के लिए, डैशबोर्ड से 'स्लॉट बुक करें' पर जाएं।",
  "book": "You can book a slot by going to your Farmer Dashboard → Book Slot. Each slot is 1 hour long. | आप किसान डैशबोर्ड → स्लॉट बुक करें पर जाकर स्लॉट बुक कर सकते हैं।",
  "payment": "Your payment is processed after crop verification at the centre. It reaches your bank within 2-3 days. | केंद्र पर फसल सत्यापन के बाद 2-3 दिनों में आपके बैंक में भुगतान आता है।",
  "mandi": "Today's Wheat MSP is ₹2,275/Quintal, Paddy is ₹2,183/Quintal. Check full rates on Mandi Rates page. | आज गेहूं MSP ₹2,275/क्विंटल, धान ₹2,183/क्विंटल है।",
  "wait": "Current average waiting time at Bhagwanpur Centre is 35 minutes. | भगवानपुर केंद्र पर वर्तमान औसत प्रतीक्षा समय 35 मिनट है।",
  "cancel": "You can cancel your slot up to 2 hours before the scheduled time. Go to Track Slot → Cancel. | आप निर्धारित समय से 2 घंटे पहले तक स्लॉट रद्द कर सकते हैं।",
  "tatkaal": "Tatkaal Booking is priority/emergency booking with a small fee of ₹50. Available on the Tatkaal page. | तत्काल बुकिंग ₹50 अतिरिक्त शुल्क के साथ प्राथमिकता बुकिंग है।",
  "trust": "Your Trust Score is calculated based on on-time arrival, completed transactions, and centre feedback. Score above 80 is Excellent! | आपका विश्वास स्कोर समय पर उपस्थिति और पूर्ण लेनदेन पर आधारित है।",
  "help": "I can help you with: Slot Booking, Payment Status, Mandi Rates, Waiting Time, Trust Score, Tatkaal Booking. | मैं इनमें मदद कर सकता हूं: स्लॉट बुकिंग, भुगतान स्थिति, मंडी दरें।",
  "default": "I'm here to help! You can ask me about slot booking, payments, mandi rates, waiting times, or trust score. | मैं यहां मदद के लिए हूं! स्लॉट बुकिंग, भुगतान, मंडी दरों के बारे में पूछें।",
};

export const mockPayments = [
  { id: "PAY-001", txnId: "TXN-2024-8841", date: "2024-11-10", crop: "Wheat", quantity: "20 Qtl", amount: 45500, status: "Paid", centre: "Bhagwanpur Centre" },
  { id: "PAY-002", txnId: "TXN-2024-7129", date: "2024-10-25", crop: "Paddy", quantity: "35 Qtl", amount: 76405, status: "Paid", centre: "Mohanlalganj Centre" },
  { id: "PAY-003", txnId: "TXN-2024-5402", date: "2024-10-05", crop: "Mustard", quantity: "15 Qtl", amount: 84750, status: "Paid", centre: "Bhagwanpur Centre" },
  { id: "PAY-004", txnId: "TXN-2024-3119", date: "2024-09-20", crop: "Maize", quantity: "10 Qtl", amount: 20900, status: "Paid", centre: "Kakori Centre" },
];
