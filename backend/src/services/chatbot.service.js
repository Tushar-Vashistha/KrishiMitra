const chatbotResponses = {
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
