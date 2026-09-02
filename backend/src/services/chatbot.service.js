const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

// System context provided to Google Gemini AI for domain accuracy
const KRISHIMITRA_SYSTEM_PROMPT = `
You are KrishiMitra AI, an intelligent, helpful, empathetic, and multi-lingual assistant for the KrishiMitra Agricultural Procurement Platform in India.
Your goal is to answer farmers' questions clearly, concisely, and accurately in the specified language (English or Hindi).

Key platform knowledge:
1. **Slot Booking**: Farmers log in, go to 'Book Slot' on their dashboard, select crop type (e.g. Wheat, Paddy, Mustard, Maize), estimated weight in Quintals, choose a nearby procurement centre, date, and preferred time slot.
2. **Time Slots & Policy**: Standard slots are 1 hour long (e.g. 7-10 AM, 10-1 PM, 2-5 PM). The final evening slot (5-8 PM) is reserved for blacklisted farmers or late arrivers.
3. **Credit / Trust Score System**: Starts at 100 points.
   - On-time arrival: +10 bonus points.
   - Absenteeism / No-show: -25 penalty points.
   - Blacklist threshold: Score ≤ 25 blocks normal slots; farmer can only book the late slot (5-8 PM, max 2 blacklisted farmers/day).
4. **Tatkaal Booking**: Priority emergency booking available on the Tatkaal page for an additional priority fee of ₹50.
5. **Mandi & MSP Rates**: Minimum Support Price (MSP) guaranteed by government:
   - Wheat (गेहूं): ₹2,275 / Quintal
   - Paddy / Rice (धान): ₹2,183 / Quintal
   - Mustard (सरसों): ₹5,650 / Quintal
   - Maize (मक्का): ₹2,090 / Quintal
6. **Payment Process**: Crop weighing & quality verification happen at the centre. Direct Bank / UPI payment is initiated within 2-3 working days.
7. **Slot Cancellation**: Free cancellation is allowed up to 24 hours prior to the slot day via 'Track Slot'. Same-day cancellation is restricted or incurs a Trust Score penalty.
8. **Live Queue & Waiting**: Real-time token tracking shows current token being served and estimated wait time (avg. 35 mins at Bhagwanpur Centre).
9. **Registration**: Farmers register using mobile OTP, Aadhaar, Khasra land verification, and Bank/IFSC details.

Keep responses friendly, helpful, short, and well-structured with bullet points when applicable.
`;

// Detailed Intent/Keyword Fallback Rules for Offline or No-API-Key Operation
const fallbackIntents = [
  {
    name: 'greeting',
    keywords: ['hi', 'hello', 'namaste', 'नमस्ते', 'नमस्कार', 'hey', 'good morning', 'good afternoon', 'good evening', 'प्रणाम', 'सत श्री अकाल'],
    responseEn: `Hello! I'm KrishiMitra AI assistant. How can I help you today?
You can ask me about:
• 🌾 MSP & Mandi Rates
• 📅 Booking a Procurement Slot
• ⚡ Tatkaal Emergency Booking
• 💳 Credit / Trust Score Rules
• ⏳ Waiting Time & Live Queue
• 💰 Payment Status & Process
• 📍 Nearby Procurement Centres`,
    responseHi: `नमस्ते! मैं कृषिमित्र AI सहायक हूं। आज मैं आपकी क्या सहायता कर सकता हूं?
आप मुझसे निम्न विषयों के बारे में पूछ सकते हैं:
• 🌾 MSP और मंडी दरें
• 📅 खरीद स्लॉट बुक करना
• ⚡ तत्काल आपातकालीन बुकिंग
• 💳 क्रेडिट / ट्रस्ट स्कोर नियम
• ⏳ प्रतीक्षा समय और लाइव कतार
• 💰 भुगतान स्थिति और प्रक्रिया
• 📍 निकटतम खरीद केंद्र`
  },
  {
    name: 'mandi_msp',
    keywords: ['mandi', 'msp', 'rate', 'price', 'wheat', 'paddy', 'rice', 'mustard', 'maize', 'bhav', 'dam', 'मूल्य', 'दर', 'दाम', 'मंडी', 'गेहूं', 'धान', 'सरसों', 'मक्का', 'भाव', 'कितना'],
    responseEn: `🌾 **Today's Government MSP Rates:**
• Wheat (गेहूं): ₹2,275 / Quintal
• Paddy (धान): ₹2,183 / Quintal
• Mustard (सरसों): ₹5,650 / Quintal
• Maize (मक्का): ₹2,090 / Quintal

Check the 'Mandi Rates' section on your dashboard for live market prices.`,
    responseHi: `🌾 **आज की सरकारी मंडी दरें (MSP):**
• गेहूं (Wheat): ₹2,275 / क्विंटल
• धान (Paddy): ₹2,183 / क्विंटल
• सरसों (Mustard): ₹5,650 / क्विंटल
• मक्का (Maize): ₹2,090 / क्विंटल

लाइव बाजार दरों के लिए अपने डैशबोर्ड पर 'मंडी दरें' अनुभाग देखें।`
  },
  {
    name: 'slot_booking',
    keywords: ['slot', 'book', 'booking', 'schedule', 'kahan', 'kaise', 'स्लॉट', 'बुक', 'बुकिंग', 'समय', 'तारीख', 'कैसे'],
    responseEn: `📅 **How to Book a Procurement Slot:**
1. Log in to your Farmer Dashboard.
2. Click on **'Book Slot'**.
3. Select your Crop, Estimated Weight (Quintals), Nearest Centre, and Date.
4. Choose an available time slot and click **Confirm & Generate Token**.`,
    responseHi: `📅 **खरीद स्लॉट कैसे बुक करें:**
1. अपने किसान डैशबोर्ड पर लॉगिन करें।
2. **'स्लॉट बुक करें'** पर क्लिक करें।
3. अपनी फसल, अनुमानित वजन (क्विंटल में), निकटतम केंद्र और तारीख चुनें।
4. उपलब्ध समय स्लॉट चुनें और **पुष्टि करें और टोकन जनरेट करें** पर क्लिक करें।`
  },
  {
    name: 'credit_trust_score',
    keywords: ['credit', 'trust', 'score', 'points', 'penalty', 'blacklist', 'क्रेडिट', 'ट्रस्ट', 'स्कोर', 'अंक', 'जुर्माना', 'ब्लैकलिस्ट'],
    responseEn: `⭐ **Credit / Trust Score System Rules:**
• Starting Score: **100 Points**
• **+10 Points Bonus** for arriving on time at the centre.
• **-25 Points Penalty** for absenteeism / missing your slot.
• **Blacklist Threshold (≤ 25 Points)**: Restricts normal slot bookings. Blacklisted farmers can only book the late slot (5-8 PM).`,
    responseHi: `⭐ **क्रेडिट / ट्रस्ट स्कोर प्रणाली के नियम:**
• शुरुआती स्कोर: **100 अंक**
• केंद्र पर समय पर पहुंचने पर **+10 अंक का बोनस**।
• अनुपस्थित रहने / स्लॉट मिस करने पर **-25 अंक की पेनल्टी**।
• **ब्लैकलिस्ट सीमा (≤ 25 अंक)**: सामान्य स्लॉट बुकिंग प्रतिबंधित हो जाती है। ब्लैकलिस्टेड किसान केवल शाम का स्लॉट (5-8 PM) ही बुक कर सकते हैं।`
  },
  {
    name: 'payment',
    keywords: ['payment', 'money', 'bank', 'account', 'paisa', 'rupee', 'transfer', 'status', 'received', 'कब', 'भुगतान', 'पैसा', 'बैंक', 'खाता', 'रुपया', 'स्टेटस', 'ट्रांसफर'],
    responseEn: `💰 **Payment Information:**
After your crop is weighed and quality-checked at the procurement centre, payment is processed directly to your registered bank account / UPI within **2 to 3 working days**.

You can check your payment status anytime under **'Payment History'** on your dashboard.`,
    responseHi: `💰 **भुगतान संबंधी जानकारी:**
खरीद केंद्र पर आपकी फसल तौलने और गुणवत्ता जांच के बाद, भुगतान **2 से 3 कार्य दिवसों** के भीतर सीधे आपके पंजीकृत बैंक खाते / UPI में ट्रांसफर कर दिया जाता है।

आप अपने डैशबोर्ड पर **'भुगतान इतिहास'** में कभी भी स्थिति देख सकते हैं।`
  },
  {
    name: 'cancel',
    keywords: ['cancel', 'cancellation', 'radd', 'reschedule', 'रद्द', 'कैंसल', 'हटाना', 'रीशेड्यूल'],
    responseEn: `❌ **Slot Cancellation Policy:**
• Free cancellation is available up to 24 hours before your scheduled booking day via **Track Slot → Cancel**.
• Same-day cancellations may result in a Trust Score penalty.`,
    responseHi: `❌ **स्लॉट रद्दीकरण नीति:**
• आपके निर्धारित बुकिंग दिन से 24 घंटे पहले तक **स्लॉट ट्रैक → रद्द करें** से मुफ्त रद्दीकरण उपलब्ध है।
• उसी दिन रद्दीकरण करने पर ट्रस्ट स्कोर पेनल्टी लग सकती है।`
  },
  {
    name: 'tatkaal',
    keywords: ['tatkaal', 'emergency', 'urgent', 'priority', 'तत्काल', 'इमरजेंसी', 'अर्जेंट', 'जल्दी'],
    responseEn: `⚡ **Tatkaal (Emergency) Booking:**
For urgent procurement needs, Tatkaal booking provides priority processing for a nominal fee of ₹50. Go to **Farmer Dashboard → Tatkaal Booking** to check availability.`,
    responseHi: `⚡ **तत्काल (आपातकालीन) बुकिंग:**
तत्काल खरीद की आवश्यकता के लिए, तत्काल बुकिंग ₹50 के नाममात्र शुल्क पर प्राथमिकता प्रसंस्करण प्रदान करती है। उपलब्धता की जांच के लिए **किसान डैशबोर्ड → तत्काल बुकिंग** पर जाएं।`
  },
  {
    name: 'waiting_queue',
    keywords: ['wait', 'waiting', 'queue', 'token', 'crowd', 'line', 'position', 'time', 'प्रतीक्षा', 'लाइन', 'टोकन', 'भीड़', 'कितना समय', 'इंतजार'],
    responseEn: `⏳ **Live Queue & Waiting Time:**
• Average waiting time at centres: **25 - 35 minutes**.
• You can track your live token number and queue progress in real-time under **'Track Slot'** on your dashboard.`,
    responseHi: `⏳ **लाइव कतार और प्रतीक्षा समय:**
• केंद्रों पर औसत प्रतीक्षा समय: **25 - 35 मिनट**।
• आप अपने डैशबोर्ड पर **'स्लॉट ट्रैक करें'** के अंतर्गत वास्तविक समय में अपना लाइव टोकन और कतार प्रगति देख सकते हैं।`
  },
  {
    name: 'centre_location',
    keywords: ['centre', 'center', 'location', 'address', 'where', 'near', 'kahan', 'bhagwanpur', 'केंद्र', 'पता', 'कहाँ', 'स्थान', 'निकटतम'],
    responseEn: `📍 **Procurement Centres:**
KrishiMitra operates government-certified procurement centres equipped with digital weighing scales and quality labs.
Go to **'Nearest Centres'** on the top menu to view locations and distances.`,
    responseHi: `📍 **खरीद केंद्र:**
कृषिमित्र डिजिटल वजन तराजू और गुणवत्ता प्रयोगशालाओं से लैस सरकारी प्रमाणित खरीद केंद्र संचालित करता है।
स्थानों और दूरी देखने के लिए शीर्ष मेनू पर **'निकटतम केंद्र'** पर जाएं।`
  },
  {
    name: 'registration_login',
    keywords: ['register', 'signup', 'login', 'account', 'aadhaar', 'khasra', 'otp', 'लॉगिन', 'रजिस्टर', 'आधार', 'खसरा', 'खाता'],
    responseEn: `📝 **Registration & Login Support:**
• **Farmers**: Register using your Mobile Number (OTP verification), Aadhaar, Land Khasra number, and Bank Account details.
• Log in with your registered mobile number and OTP.`,
    responseHi: `📝 **पंजीकरण और लॉगिन सहायता:**
• **किसान**: अपने मोबाइल नंबर (OTP सत्यापन), आधार, भूमि खसरा नंबर और बैंक विवरण का उपयोग करके पंजीकरण करें।
• अपने पंजीकृत मोबाइल नंबर और OTP से लॉगिन करें।`
  },
  {
    name: 'thanks_bye',
    keywords: ['thank', 'thanks', 'dhanyawad', 'shukriya', 'bye', 'goodbye', 'धन्यवाद', 'शुक्रिया', 'नमस्ते'],
    responseEn: `🙏 You're welcome! KrishiMitra is always here to assist our farming community. Have a great day!`,
    responseHi: `🙏 आपका स्वागत है! कृषिमित्र हमारे किसान समुदाय की सहायता के लिए सदैव उपलब्ध है। आपका दिन शुभ हो!`
  }
];

const DEFAULT_RESPONSE_EN = `I'm here to help! You can ask me about:
• 🌾 Mandi Rates & MSP
• 📅 How to Book a Slot
• ⚡ Tatkaal Booking
• 💳 Credit / Trust Score Rules
• 💰 Payment Timelines
• ⏳ Waiting Time & Live Queue Status`;

const DEFAULT_RESPONSE_HI = `मैं आपकी सहायता के लिए यहाँ हूँ! आप मुझसे इनके बारे में पूछ सकते हैं:
• 🌾 मंडी दरें और MSP
• 📅 स्लॉट बुक करने का तरीका
• ⚡ तत्काल आपातकालीन बुकिंग
• 💳 क्रेडिट / ट्रस्ट स्कोर नियम
• 💰 भुगतान का समय
• ⏳ प्रतीक्षा समय और लाइव कतार स्थिति`;

/**
 * Get response using Gemini AI or fallback to smart intent matcher
 */
const getChatbotResponse = async (message, language) => {
  if (!message || typeof message !== 'string' || !message.trim()) {
    return language === 'hi' ? DEFAULT_RESPONSE_HI : DEFAULT_RESPONSE_EN;
  }

  const query = message.trim();
  const containsDevanagari = /[\u0900-\u097F]/.test(query);
  const isHindi = language === 'hi' || (!language && containsDevanagari);
  const defaultResp = isHindi ? DEFAULT_RESPONSE_HI : DEFAULT_RESPONSE_EN;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // Try Google Gemini AI if API key is provided
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const langInstruction = isHindi
        ? '\n\nUSER PREFERRED LANGUAGE: Hindi. You MUST write your response ONLY in Hindi (using Devanagari script).'
        : '\n\nUSER PREFERRED LANGUAGE: English. You MUST write your response ONLY in English.';

      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: KRISHIMITRA_SYSTEM_PROMPT + langInstruction,
      });

      const result = await model.generateContent(query);
      const responseText = result.response.text();
      if (responseText && responseText.trim()) {
        return responseText.trim();
      }
    } catch (err) {
      logger.warn(`Gemini AI chatbot query failed fallback to intent engine: ${err.message}`);
    }
  }

  // Smart Fallback Intent Matching
  const normalized = query.toLowerCase();
  let bestMatch = null;
  let maxScore = 0;

  for (const intent of fallbackIntents) {
    let score = 0;
    for (const kw of intent.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        score += kw.length > 3 ? 2 : 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = intent;
    }
  }

  if (bestMatch && maxScore > 0) {
    return isHindi ? (bestMatch.responseHi || bestMatch.responseEn) : (bestMatch.responseEn || bestMatch.responseHi);
  }

  return defaultResp;
};

module.exports = {
  getChatbotResponse,
};
