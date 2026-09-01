const chatbotResponses = {
  "slot": "To book a slot, go to 'Book Slot' from your dashboard. Select your crop type, estimated weight, nearby centre, and choose an available time slot. | स्लॉट बुक करने के लिए, डैशबोर्ड से 'स्लॉट बुक करें' पर जाएं।",
  "book": "You can book a slot by going to your Farmer Dashboard → Book Slot. Each slot is 1 hour long. | आप किसान डैशबोर्ड → स्लॉट बुक करें पर जाकर स्लॉट बुक कर सकते हैं।",
  "payment": "Your payment is processed after crop verification at the centre. It reaches your bank within 2-3 days. | केंद्र पर फसल सत्यापन के बाद 2-3 दिनों में आपके बैंक में भुगतान आता है।",
  "mandi": "Today's Wheat MSP is ₹2,275/Quintal, Paddy is ₹2,183/Quintal. Check full rates on Mandi Rates page. | आज गेहूं MSP ₹2,275/क्विंटल, धान ₹2,183/क्विंटल है।",
  "wait": "Current average waiting time at Bhagwanpur Centre is 35 minutes. | भगवानपुर केंद्र पर वर्तमान औसत प्रतीक्षा समय 35 मिनट है।",
  "cancel": "You can cancel your slot prior to the day of booking, but cancellations are not allowed on the day of the booking. Go to Track Slot → Cancel. | आप बुकिंग के दिन से पहले अपना स्लॉट रद्द कर सकते हैं, लेकिन बुकिंग वाले दिन रद्दीकरण की अनुमति नहीं है।",
  "tatkaal": "Tatkaal Booking is priority/emergency booking with a small fee of ₹50. Available on the Tatkaal page. | तत्काल बुकिंग ₹50 अतिरिक्त शुल्क के साथ प्राथमिकता बुकिंग है।",
  "credit": "Your Credit / Trust Score starts at 100 points. How it works: 1) On-time Arrival: +10 pts bonus. 2) Absenteeism: -25 pts penalty. 3) Blacklist Policy: Score ≤ 25 blocks normal bookings (only the last slot of the day is allowed, max 2 blacklisted farmers/day). | आपका क्रेडिट / विश्वास स्कोर 100 से शुरू होता है। नियम: 1) समय पर उपस्थिति: +10 अंक। 2) अनुपस्थिति: -25 अंक। 3) ब्लैकलिस्ट नीति: स्कोर 25 या कम होने पर सामान्य बुकिंग बंद (केवल दिन का अंतिम स्लॉट, अधिकतम 2 किसान/दिन)।",
  "score": "Your Credit / Trust Score starts at 100 points. How it works: 1) On-time Arrival: +10 pts bonus. 2) Absenteeism: -25 pts penalty. 3) Blacklist Policy: Score ≤ 25 blocks normal bookings (only the last slot of the day is allowed, max 2 blacklisted farmers/day). | आपका क्रेडिट / विश्वास स्कोर 100 से शुरू होता है। नियम: 1) समय पर उपस्थिति: +10 अंक। 2) अनुपस्थिति: -25 अंक। 3) ब्लैकलिस्ट नीति: स्कोर 25 या कम होने पर सामान्य बुकिंग बंद (केवल दिन का अंतिम स्लॉट, अधिकतम 2 किसान/दिन)।",
  "trust": "Your Credit / Trust Score starts at 100 points. How it works: 1) On-time Arrival: +10 pts bonus. 2) Absenteeism: -25 pts penalty. 3) Blacklist Policy: Score ≤ 25 blocks normal bookings (only the last slot of the day is allowed, max 2 blacklisted farmers/day). | आपका क्रेडिट / विश्वास स्कोर 100 से शुरू होता है। नियम: 1) समय पर उपस्थिति: +10 अंक। 2) अनुपस्थिति: -25 अंक। 3) ब्लैकलिस्ट नीति: स्कोर 25 या कम होने पर सामान्य बुकिंग बंद (केवल दिन का अंतिम स्लॉट, अधिकतम 2 किसान/दिन)।",
  "help": "I can help you with: Slot Booking, Payment Status, Mandi Rates, Waiting Time, Credit Score, Tatkaal Booking. | मैं इनमें मदद कर सकता हूं: स्लॉट बुकिंग, भुगतान स्थिति, मंडी दरें, क्रेडिट स्कोर।",
  "default": "I'm here to help! You can ask me about slot booking, payments, mandi rates, waiting times, or credit score details. | मैं यहां मदद के लिए हूं! स्लॉट बुकिंग, भुगतान, मंडी दरों या क्रेडिट स्कोर के बारे में पूछें।",
};

/**
 * Chatbot request processor.
 * Abstracted to easily allow future LLM (e.g. Google Gemini) integration.
 */
const getChatbotResponse = async (message) => {
  if (!message) {
    return chatbotResponses.default;
  }

  const query = message.toLowerCase();

  // Keyword matching logic
  for (const key in chatbotResponses) {
    if (query.includes(key)) {
      return chatbotResponses[key];
    }
  }

  return chatbotResponses.default;
};

module.exports = {
  getChatbotResponse,
};
