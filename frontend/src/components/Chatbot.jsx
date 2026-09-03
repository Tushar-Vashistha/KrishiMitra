import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Bot, 
  User, 
  Globe, 
  RotateCcw, 
  HelpCircle, 
  ChevronRight, 
  Sparkles,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Comprehensive Knowledge Base of Predefined Questions and Verified Answers
const QUESTIONS_DATA = [
  {
    id: 'book_slot',
    icon: '📅',
    categoryEn: 'Booking',
    categoryHi: 'बुकिंग',
    questionEn: 'How do I book a slot?',
    questionHi: 'स्लॉट कैसे बुक करें?',
    answerEn: `📅 **How to Book a Procurement Slot:**\n\n1. **Log in**: Access your Farmer Dashboard with your registered mobile number.\n2. **Navigate**: Click on **'Book Slot'** from the sidebar or dashboard card.\n3. **Crop & Weight**: Select your crop (Wheat, Paddy, Mustard, Maize, etc.) and enter estimated weight in quintals.\n4. **Centre & Date**: Choose your nearest procurement centre and preferred date.\n5. **Time Window**: Select an available 1-hour slot (e.g., 7-10 AM, 10-1 PM, 2-5 PM).\n6. **Confirm & Generate Token**: Confirm your booking to generate your digital QR token with SMS confirmation!\n\n💡 *Tip: Need urgent same-day/next-day selling? You can also use Tatkaal Booking.*`,
    answerHi: `📅 **खरीद स्लॉट कैसे बुक करें:**\n\n1. **लॉगिन करें**: अपने पंजीकृत मोबाइल नंबर से किसान डैशबोर्ड पर लॉगिन करें।\n2. **विकल्प चुनें**: साइडबार या डैशबोर्ड से **'स्लॉट बुक करें'** पर क्लिक करें।\n3. **फसल और वजन**: अपनी फसल (गेहूं, धान, सरसों, मक्का आदि) चुनें और क्विंटल में वजन दर्ज करें।\n4. **केंद्र व तारीख**: अपना नजदीकी खरीद केंद्र और सुविधाजनक तारीख चुनें।\n5. **समय स्लॉट**: उपलब्ध 1-घंटे का स्लॉट (जैसे 7-10 AM, 10-1 PM, 2-5 PM) चुनें।\n6. **पुष्टि करें व टोकन लें**: पुष्टि करें और एसएमएस पुष्टि के साथ अपना डिजिटल क्यूआर टोकन प्राप्त करें!\n\n💡 *सलाह: तत्काल बिक्री की आवश्यकता के लिए आप तत्काल बुकिंग का उपयोग भी कर सकते हैं।*`,
    followUps: ['token_status', 'tatkaal_booking', 'cancel_slot'],
  },
  {
    id: 'token_status',
    icon: '🎫',
    categoryEn: 'Tracking',
    categoryHi: 'ट्रैकिंग',
    questionEn: 'Check my token status',
    questionHi: 'टोकन की स्थिति जांचें',
    answerEn: `🎫 **Checking Your Token & Live Queue:**\n\n• Go to **'Track Slot'** on your Farmer Dashboard.\n• View your **Token Number**, scheduled reporting time, and assigned unloading bay.\n• **Live Queue Display**: View the token number currently being unloaded and estimated wait time (typically 25–35 minutes).\n• Show your **digital QR token** at the procurement centre gate for expedited entry.`,
    answerHi: `🎫 **टोकन और लाइव कतार स्थिति:**\n\n• अपने किसान डैशबोर्ड पर **'स्लॉट ट्रैक करें'** पर जाएं।\n• अपना **टोकन नंबर**, निर्धारित रिपोर्टिंग समय और आवंटित अनलोडिंग बे देखें।\n• **लाइव कतार स्थिति**: वर्तमान में संसाधित हो रहे टोकन और अनुमानित प्रतीक्षा समय (लगभग 25–35 मिनट) देखें।\n• त्वरित प्रवेश के लिए खरीद केंद्र के गेट पर अपना **डिजिटल क्यूआर टोकन** दिखाएं।`,
    followUps: ['book_slot', 'quality_check', 'payment_status'],
  },
  {
    id: 'payment_status',
    icon: '💰',
    categoryEn: 'Payments',
    categoryHi: 'भुगतान',
    questionEn: 'Check my payment status',
    questionHi: 'भुगतान की स्थिति जांचें',
    answerEn: `💰 **Payment Timelines & Status:**\n\n• **Direct Bank Transfer (DBT)**: Once your produce is weighed and quality-verified at the centre, payment is transferred directly to your bank account via PFMS/UPI within **2 to 3 working days**.\n• **Check Status**: Visit **'Payment History'** on your Farmer Dashboard to track payment status (*Pending*, *Processing*, or *Credited*).\n• **Payment Slip**: Download your official payment voucher with UTR transaction reference number anytime.`,
    answerHi: `💰 **भुगतान समय सीमा और स्थिति:**\n\n• **सीधा बैंक ट्रांसफर (DBT)**: केंद्र पर फसल की तौल और गुणवत्ता जांच के बाद, भुगतान **2 से 3 कार्य दिवसों** के भीतर PFMS/UPI द्वारा सीधे आपके बैंक खाते में भेजा जाता है।\n• **स्थिति देखें**: लाइव स्थिति (*लंबित*, *प्रक्रियाधीन*, या *जमा*) देखने के लिए डैशबोर्ड पर **'भुगतान इतिहास'** देखें।\n• **भुगतान पर्ची**: UTR लेनदेन संख्या के साथ अपनी आधिकारिक भुगतान रसीद कभी भी डाउनलोड करें।`,
    followUps: ['msp_rates', 'quality_check', 'credit_score'],
  },
  {
    id: 'mandi_rates',
    icon: '📊',
    categoryEn: 'Market',
    categoryHi: 'मंडी भाव',
    questionEn: "What are today's mandi rates?",
    questionHi: 'आज का मंडी भाव क्या है?',
    answerEn: `📊 **Today's Live APMC Mandi Rates:**\n\n• **Wheat (गेहूं)**: ₹2,275 – ₹2,380 / Quintal\n• **Paddy (धान - Common/Grade A)**: ₹2,183 – ₹2,250 / Quintal\n• **Mustard (सरसों)**: ₹5,650 – ₹5,820 / Quintal\n• **Maize (मक्का)**: ₹2,090 – ₹2,160 / Quintal\n• **Chana / Gram (चना)**: ₹5,440 – ₹5,600 / Quintal\n\n💡 *For real-time district-wise prices and arrival charts, check the 'Mandi Rates' page.*`,
    answerHi: `📊 **आज का लाइव मंडी भाव (APMC):**\n\n• **गेहूं**: ₹2,275 – ₹2,380 / क्विंटल\n• **धान (सामान्य/ग्रेड A)**: ₹2,183 – ₹2,250 / क्विंटल\n• **सरसों**: ₹5,650 – ₹5,820 / क्विंटल\n• **मक्का**: ₹2,090 – ₹2,160 / क्विंटल\n• **चना**: ₹5,440 – ₹5,600 / क्विंटल\n\n💡 *जिलेवार वास्तविक समय के भाव और आवक चार्ट के लिए 'मंडी दरें' पेज देखें।*`,
    followUps: ['msp_rates', 'book_slot', 'nearby_centres'],
  },
  {
    id: 'msp_rates',
    icon: '🌾',
    categoryEn: 'MSP',
    categoryHi: 'एमएसपी',
    questionEn: 'What is the MSP for my crop?',
    questionHi: 'मेरी फसल का MSP क्या है?',
    answerEn: `🌾 **Government Guaranteed MSP (Minimum Support Price):**\n\nKrishiMitra ensures direct procurement at official government MSP:\n• **Wheat**: ₹2,275 / Quintal\n• **Paddy (Common)**: ₹2,183 / Quintal\n• **Paddy (Grade A)**: ₹2,203 / Quintal\n• **Mustard**: ₹5,650 / Quintal\n• **Maize**: ₹2,090 / Quintal\n• **Barley**: ₹1,850 / Quintal\n• **Gram (Chana)**: ₹5,440 / Quintal\n\n*All payments are made directly to your account with zero middleman commission.*`,
    answerHi: `🌾 **सरकारी गारंटीकृत न्यूनतम समर्थन मूल्य (MSP):**\n\nकृषिमित्र आधिकारिक सरकारी MSP पर सीधी खरीद सुनिश्चित करता है:\n• **गेहूं**: ₹2,275 / क्विंटल\n• **धान (सामान्य)**: ₹2,183 / क्विंटल\n• **धान (ग्रेड A)**: ₹2,203 / क्विंटल\n• **सरसों**: ₹5,650 / क्विंटल\n• **मक्का**: ₹2,090 / क्विंटल\n• **जौ**: ₹1,850 / क्विंटल\n• **चना**: ₹5,440 / क्विंटल\n\n*सभी भुगतान बिना किसी बिचौलिया कटौती के सीधे आपके बैंक खाते में किए जाते हैं।*`,
    followUps: ['mandi_rates', 'quality_check', 'book_slot'],
  },
  {
    id: 'nearby_centres',
    icon: '📍',
    categoryEn: 'Centres',
    categoryHi: 'खरीद केंद्र',
    questionEn: 'Find nearby procurement centres',
    questionHi: 'निकटतम खरीद केंद्र खोजें',
    answerEn: `📍 **Procurement Centres Near You:**\n\n• **Bhagwanpur Centre**: Roorkee-Haridwar Highway (Equipped with digital weighbridges & rapid moisture testing).\n• **Kashipur Mandi Hub**: Station Road, Kashipur (Multi-crop grain silo storage facility).\n• **Rudrapur Central Mandi**: Industrial Area, Udham Singh Nagar.\n\n🗺️ *Visit 'Nearest Centres' from the top navigation to view interactive maps, road distance, real-time waiting times, and centre contact details.*`,
    answerHi: `📍 **आपके निकटतम खरीद केंद्र:**\n\n• **भगवानपुर केंद्र**: रुड़की-हरिद्वार हाईवे (डिजिटल वजन कांटा और तीव्र नमी परीक्षण सुविधा)।\n• **काशीपुर मंडी हब**: स्टेशन रोड, काशीपुर (अनाज साइलो भंडारण सुविधा)।\n• **रुद्रपुर सेंट्रल मंडी**: इंडस्ट्रियल एरिया, उधम सिंह नगर।\n\n🗺️ *मानचित्र, सड़क दूरी, वास्तविक समय प्रतीक्षा समय और केंद्र संपर्क देखने के लिए शीर्ष मेनू में 'निकटतम केंद्र' पर जाएं।*`,
    followUps: ['book_slot', 'token_status', 'quality_check'],
  },
  {
    id: 'quality_check',
    icon: '🔬',
    categoryEn: 'Quality',
    categoryHi: 'गुणवत्ता',
    questionEn: 'How does crop quality verification work?',
    questionHi: 'फसल गुणवत्ता सत्यापन कैसे काम करता है?',
    answerEn: `🔬 **Crop Quality Verification Process:**\n\n1. **Automated Sampling**: Representative samples are drawn at the gate upon arrival.\n2. **Digital Moisture Testing**: Moisture content is checked digitally (must be within permissible limit, e.g. ≤12-14% for Wheat).\n3. **Foreign Matter & Admixture**: Grain purity and foreign matter percentage are assessed transparently.\n4. **Instant Grading (A / B / C)**: Grade is automatically assigned and logged in your token slip, ensuring you receive your full MSP entitlement.`,
    answerHi: `🔬 **फसल गुणवत्ता सत्यापन प्रक्रिया:**\n\n1. **स्वचालित नमूना चयन**: केंद्र पर पहुंचने पर गेट पर प्रतिनिधि नमूना लिया जाता है।\n2. **डिजिटल नमी परीक्षण**: नमी की मात्रा की डिजिटल जांच की जाती है (गेहूं/अनाज के लिए ≤12-14% अनुमेय)।\n3. **शुद्धता व अशुद्धता जांच**: बाहरी कचरा और दाने की शुद्धता का पारदर्शी मूल्यांकन होता है।\n4. **त्वरित ग्रेडिंग (A / B / C)**: सिस्टम में ग्रेड तुरंत दर्ज होता है और आपकी टोकन रसीद में जुड़ जाता है।`,
    followUps: ['msp_rates', 'payment_status', 'credit_score'],
  },
  {
    id: 'credit_score',
    icon: '⭐',
    categoryEn: 'Trust Score',
    categoryHi: 'क्रेडिट स्कोर',
    questionEn: 'How does the credit score work?',
    questionHi: 'क्रेडिट स्कोर कैसे काम करता है?',
    answerEn: `⭐ **Farmer Trust & Credit Score Rules:**\n\n• **Starting Score**: Every registered farmer begins with **100 Points**.\n• **+10 Bonus Points**: Arriving on-time during your booked slot window.\n• **-25 Penalty Points**: Absenteeism / failing to show up without cancelling.\n• **Blacklist Restriction (≤ 25 Points)**: Farmers with ≤25 points cannot book prime slots; they can only book the late evening slot (5:00 PM – 8:00 PM).\n• Maintain a score above 80 to enjoy priority lane entry and Tatkaal access!`,
    answerHi: `⭐ **किसान ट्रस्ट एवं क्रेडिट स्कोर नियम:**\n\n• **प्रारंभिक स्कोर**: प्रत्येक पंजीकृत किसान 100 अंकों से शुरू करता है।\n• **+10 बोनस अंक**: बुक किए गए स्लॉट समय पर उपस्थित होने पर।\n• **-25 पेनल्टी अंक**: बिना रद्द किए स्लॉट पर अनुपस्थित रहने पर।\n• **ब्लैकलिस्ट प्रतिबंध (≤ 25 अंक)**: 25 या उससे कम अंक वाले किसान केवल शाम का स्लॉट (5-8 PM) ही बुक कर सकते हैं।\n• प्राथमिकता लेन और तत्काल बुकिंग के लिए अपना स्कोर 80 से ऊपर बनाए रखें!`,
    followUps: ['book_slot', 'cancel_slot', 'token_status'],
  },
  {
    id: 'farmer_register',
    icon: '📝',
    categoryEn: 'Registration',
    categoryHi: 'पंजीकरण',
    questionEn: 'How do I register as a farmer?',
    questionHi: 'किसान के रूप में पंजीकरण कैसे करें?',
    answerEn: `📝 **Farmer Registration in 4 Simple Steps:**\n\n1. Click **'Register'** at the top right of the website and select **'Farmer Registration'**.\n2. Enter your **Aadhaar-linked Mobile Number** and verify the 6-digit OTP.\n3. Enter your **Personal & Land Details** (State, District, Village, Khasra / Khatauni number).\n4. Provide your **Bank Account Details** (Account No. & IFSC) for direct MSP DBT payments.\n5. Registration is instant! You can immediately start booking slots.`,
    answerHi: `📝 **किसान पंजीकरण 4 आसान चरणों में:**\n\n1. वेबसाइट के शीर्ष दाईं ओर **'पंजीकरण'** पर क्लिक करें और **'किसान पंजीकरण'** चुनें।\n2. अपना **आधार से जुड़ा मोबाइल नंबर** दर्ज करें और 6-अंकों का OTP सत्यापित करें।\n3. अपना **व्यक्तिगत और भूमि विवरण** (राज्य, जिला, गांव, खसरा/खतौनी संख्या) दर्ज करें।\n4. सीधे DBT भुगतान के लिए अपना **बैंक विवरण** (खाता संख्या और IFSC कोड) दर्ज करें।\n5. पंजीकरण तुरंत पूरा हो जाता है! आप तुरंत स्लॉट बुक करना शुरू कर सकते हैं।`,
    followUps: ['book_slot', 'msp_rates', 'nearby_centres'],
  },
  {
    id: 'tatkaal_booking',
    icon: '⚡',
    categoryEn: 'Tatkaal',
    categoryHi: 'तत्काल',
    questionEn: 'What is Tatkaal booking?',
    questionHi: 'तत्काल बुकिंग क्या है?',
    answerEn: `⚡ **Tatkaal (Emergency) Slot Booking:**\n\n• Designed for farmers needing emergency procurement clearance within 24 hours.\n• Available for a nominal priority convenience fee of ₹50.\n• Available daily with dedicated express unloading bays.\n• Go to **'Tatkaal Booking'** on your dashboard to check real-time slot availability.`,
    answerHi: `⚡ **तत्काल (आपातकालीन) स्लॉट बुकिंग:**\n\n• 24 घंटे के भीतर तत्काल उपज बिक्री की आवश्यकता वाले किसानों के लिए।\n• मात्र ₹50 के नाममात्र प्राथमिकता शुल्क पर उपलब्ध।\n• समर्पित एक्सप्रेस अनलोडिंग बे के साथ प्रतिदिन उपलब्ध।\n• वास्तविक समय उपलब्धता के लिए अपने डैशबोर्ड पर **'तत्काल बुकिंग'** पर जाएं।`,
    followUps: ['book_slot', 'credit_score', 'token_status'],
  },
  {
    id: 'cancel_slot',
    icon: '❌',
    categoryEn: 'Cancellation',
    categoryHi: 'रद्दीकरण',
    questionEn: 'What are the slot cancellation rules?',
    questionHi: 'स्लॉट रद्दीकरण के नियम क्या हैं?',
    answerEn: `❌ **Slot Cancellation Rules:**\n\n• **Free Cancellation**: You can cancel or reschedule for free up to **24 hours before** your booked date via **Track Slot → Cancel**.\n• **Same-day Cancellation**: Cancellations made on the same day or missing your slot incurs a **-25 Trust Score penalty**.\n• Timely cancellations allow fellow farmers to claim open slots!`,
    answerHi: `❌ **स्लॉट रद्दीकरण नियम:**\n\n• **मुफ्त रद्दीकरण**: आप अपनी निर्धारित तिथि से **24 घंटे पहले तक** 'स्लॉट ट्रैक करें' में जाकर निःशुल्क रद्द या पुनर्निर्धारित कर सकते हैं।\n• **उसी दिन रद्दीकरण**: उसी दिन रद्द करने या अनुपस्थित रहने पर **-25 ट्रस्ट स्कोर पेनल्टी** लगती है।\n• समय पर रद्द करने से अन्य साथी किसान उस स्लॉट का लाभ उठा सकते हैं!`,
    followUps: ['book_slot', 'credit_score', 'token_status'],
  }
];

// Map lookup by ID
const QUESTIONS_MAP = QUESTIONS_DATA.reduce((acc, q) => {
  acc[q.id] = q;
  return acc;
}, {});

// The 9 primary predefined questions
const PRIMARY_QUESTIONS = QUESTIONS_DATA.slice(0, 9);

// Text Formatter for bold & italic markdown
const renderFormattedAnswer = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (!line.trim()) {
      return <div key={idx} style={{ height: '0.4rem' }} />;
    }
    const tokens = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return (
      <div key={idx} style={{ marginBottom: '0.2rem', lineHeight: '1.45' }}>
        {tokens.map((token, tIdx) => {
          if (token.startsWith('**') && token.endsWith('**')) {
            return (
              <strong key={tIdx} style={{ fontWeight: 650, color: '#1B5E20' }}>
                {token.slice(2, -2)}
              </strong>
            );
          }
          if (token.startsWith('*') && token.endsWith('*')) {
            return (
              <em key={tIdx} style={{ color: '#4B5563', fontStyle: 'italic' }}>
                {token.slice(1, -1)}
              </em>
            );
          }
          return token;
        })}
      </div>
    );
  });
};

const Chatbot = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const currentLang = i18n.language || 'en';
  const isHindi = currentLang === 'hi';

  const [messages, setMessages] = useState([]);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Initialize or update initial greeting whenever chatbot opens or language changes
  useEffect(() => {
    if (open) {
      if (messages.length === 0 || (messages.length === 1 && messages[0].isGreeting)) {
        setMessages([
          {
            from: 'bot',
            isGreeting: true,
            text: t('chatGreeting'),
            time: new Date(),
          }
        ]);
      }
    }
  }, [open, i18n.language]);

  // Auto-scroll on message updates or loading change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const switchLanguage = (newLang) => {
    i18n.changeLanguage(newLang);
    const confirmMsg = newLang === 'hi'
      ? 'भाषा हिंदी चुनी गई है। 🌾\nकृपया त्वरित उत्तर के लिए नीचे दिए गए प्रश्नों में से चुनें:'
      : 'Language set to English. 🌾\nPlease select any question below to get instant answers:';

    setMessages(prev => [
      ...prev,
      { from: 'bot', isGreeting: true, text: confirmMsg, time: new Date() }
    ]);
  };

  const resetChat = () => {
    setActiveQuestionId(null);
    setMessages([
      {
        from: 'bot',
        isGreeting: true,
        text: t('chatGreeting'),
        time: new Date(),
      }
    ]);
  };

  const handleSelectQuestion = (questionId) => {
    const qData = QUESTIONS_MAP[questionId];
    if (!qData || loading) return;

    const userQuestionText = isHindi ? qData.questionHi : qData.questionEn;
    const botAnswerText = isHindi ? qData.answerHi : qData.answerEn;

    // Append user question
    const userMsg = {
      from: 'user',
      text: userQuestionText,
      time: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setActiveQuestionId(questionId);
    setLoading(true);

    // Realistic brief transition for conversational fluidity
    setTimeout(() => {
      const botMsg = {
        from: 'bot',
        text: botAnswerText,
        questionId: questionId,
        followUps: qData.followUps || [],
        time: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setLoading(false);
    }, 250);
  };

  // Follow-ups for the currently active question
  const currentFollowUps = activeQuestionId && QUESTIONS_MAP[activeQuestionId] 
    ? QUESTIONS_MAP[activeQuestionId].followUps || []
    : [];

  return (
    <div className="chatbot-bubble">
      {/* Embedded CSS for custom slim scrollbars */}
      <style>{`
        .km-chatbot-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .km-chatbot-scroll::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 4px;
        }
        .km-chatbot-scroll::-webkit-scrollbar-thumb {
          background: #A5D6A7;
          border-radius: 4px;
        }
        .km-chatbot-scroll::-webkit-scrollbar-thumb:hover {
          background: #81C784;
        }
      `}</style>

      {/* Chat Window */}
      {open && (
        <div style={{
          width: '380px',
          maxWidth: 'calc(100vw - 2rem)',
          height: '540px',
          maxHeight: 'calc(100vh - 120px)',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginBottom: '0.75rem',
          border: '1px solid rgba(0,0,0,0.08)',
          animation: 'fadeIn 0.25s ease',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)',
              flexShrink: 0,
            }}>
              <Bot size={20} color="white" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                color: 'white', 
                fontWeight: 700, 
                fontSize: '0.95rem',
                letterSpacing: '0.2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {t('chatbotTitle')}
              </div>
              <div style={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ 
                  width: 7, height: 7, 
                  borderRadius: '50%', 
                  background: '#4ADE80', 
                  display: 'inline-block',
                  boxShadow: '0 0 6px #4ADE80'
                }} />
                <span>{t('chatbotSubtitle')}</span>
              </div>
            </div>

            {/* Language Switch */}
            <button
              onClick={() => switchLanguage(isHindi ? 'en' : 'hi')}
              title={isHindi ? "Switch to English" : "हिंदी में बदलें"}
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: '12px',
                color: 'white',
                padding: '0.25rem 0.55rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontWeight: 700,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            >
              <Globe size={13} color="white" />
              {isHindi ? 'EN' : 'हिं'}
            </button>

            {/* Reset Chat */}
            <button
              onClick={resetChat}
              title={isHindi ? "वार्तालाप रीसेट करें" : "Reset Conversation"}
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: '12px',
                color: 'white',
                padding: '0.25rem 0.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            >
              <RotateCcw size={14} color="white" />
            </button>

            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              title={isHindi ? "बंद करें" : "Close"}
              style={{
                background: 'none', border: 'none',
                color: 'white', cursor: 'pointer', padding: '0.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Stream */}
          <div 
            className="km-chatbot-scroll"
            style={{
              flex: 1, 
              overflowY: 'auto', 
              padding: '0.85rem 0.75rem',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem',
              background: '#F9FAF9',
            }}
          >
            {messages.map((msg, i) => (
              <div 
                key={i} 
                style={{
                  display: 'flex',
                  justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: '0.45rem',
                }}
              >
                {msg.from === 'bot' && (
                  <div style={{
                    width: 28, height: 28, 
                    background: '#E8F5E9', 
                    border: '1px solid #C8E6C9',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Bot size={15} color="#2E7D32" />
                  </div>
                )}

                <div style={{
                  maxWidth: '84%',
                  background: msg.from === 'user' ? '#2E7D32' : 'white',
                  color: msg.from === 'user' ? 'white' : '#1C1C1C',
                  padding: '0.7rem 0.85rem',
                  borderRadius: msg.from === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  fontSize: '0.84rem',
                  boxShadow: msg.from === 'user' 
                    ? '0 2px 6px rgba(46,125,50,0.2)' 
                    : '0 1px 4px rgba(0,0,0,0.06)',
                  border: msg.from === 'user' ? 'none' : '1px solid #E5E7EB',
                }}>
                  {msg.from === 'bot' ? (
                    <div>
                      {renderFormattedAnswer(msg.text)}

                      {/* Inline Follow-up buttons if present */}
                      {msg.followUps && msg.followUps.length > 0 && (
                        <div style={{ 
                          marginTop: '0.65rem', 
                          paddingTop: '0.55rem', 
                          borderTop: '1px solid #E5E7EB' 
                        }}>
                          <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#6B7280', 
                            fontWeight: 600, 
                            marginBottom: '0.35rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            <Sparkles size={11} color="#2E7D32" />
                            <span>{isHindi ? 'सुझाए गए प्रश्न:' : 'Suggested follow-ups:'}</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {msg.followUps.map((fId) => {
                              const fQ = QUESTIONS_MAP[fId];
                              if (!fQ) return null;
                              return (
                                <button
                                  key={fId}
                                  onClick={() => handleSelectQuestion(fId)}
                                  disabled={loading}
                                  style={{
                                    background: '#F1F8E9',
                                    color: '#1B5E20',
                                    border: '1px solid #C8E6C9',
                                    borderRadius: '12px',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={e => {
                                    if (!loading) {
                                      e.currentTarget.style.background = '#E8F5E9';
                                      e.currentTarget.style.borderColor = '#2E7D32';
                                    }
                                  }}
                                  onMouseLeave={e => {
                                    if (!loading) {
                                      e.currentTarget.style.background = '#F1F8E9';
                                      e.currentTarget.style.borderColor = '#C8E6C9';
                                    }
                                  }}
                                >
                                  <span>{fQ.icon}</span>
                                  <span>{isHindi ? fQ.questionHi : fQ.questionEn}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-line', fontWeight: 500 }}>
                      {msg.text}
                    </div>
                  )}
                </div>

                {msg.from === 'user' && (
                  <div style={{
                    width: 28, height: 28, 
                    background: '#E3F2FD', 
                    border: '1px solid #BBDEFB',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <User size={15} color="#1565C0" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{
                  width: 28, height: 28, 
                  background: '#E8F5E9', 
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  flexShrink: 0
                }}>
                  <Bot size={15} color="#2E7D32" />
                </div>
                <div style={{
                  background: 'white', 
                  padding: '0.5rem 0.85rem', 
                  borderRadius: '14px 14px 14px 2px',
                  fontSize: '0.78rem', 
                  color: '#4B5563', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.45rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  border: '1px solid #E5E7EB'
                }}>
                  <Loader2 size={13} className="animate-spin" color="#2E7D32" />
                  <span>{isHindi ? 'कृषिमित्र चैटबॉट जानकारी ला रहा है...' : 'KrishiMitra Chatbot is fetching answer...'}</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Question-Based Interactive Control Panel (No manual text input / send button) */}
          <div style={{
            borderTop: '1px solid #E5E7EB',
            background: '#FFFFFF',
            padding: '0.65rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
            flexShrink: 0,
          }}>
            {/* Panel Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.25rem',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.35rem', 
                color: '#1B5E20',
                fontSize: '0.76rem',
                fontWeight: 700
              }}>
                {activeQuestionId ? (
                  <>
                    <Sparkles size={14} color="#2E7D32" />
                    <span>{isHindi ? 'संबंधित प्रश्न' : 'Related Follow-ups'}</span>
                  </>
                ) : (
                  <>
                    <HelpCircle size={14} color="#2E7D32" />
                    <span>{isHindi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}</span>
                  </>
                )}
              </div>

              {/* Back to All Questions Button */}
              {activeQuestionId && (
                <button
                  onClick={() => setActiveQuestionId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: '#E8F5E9',
                    border: '1px solid #A5D6A7',
                    borderRadius: '12px',
                    color: '#1B5E20',
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#C8E6C9';
                    e.currentTarget.style.borderColor = '#2E7D32';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#E8F5E9';
                    e.currentTarget.style.borderColor = '#A5D6A7';
                  }}
                  title={isHindi ? "सभी 9 प्रश्न देखें" : "View all 9 questions"}
                >
                  <ArrowLeft size={12} />
                  <span>{isHindi ? 'सभी प्रश्न' : 'All Questions'}</span>
                </button>
              )}
            </div>

            {/* Question Buttons Container with Scroll */}
            <div 
              className="km-chatbot-scroll"
              style={{
                maxHeight: activeQuestionId ? '135px' : '185px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                paddingRight: '2px',
              }}
            >
              {activeQuestionId ? (
                /* Follow-up mode: show relevant follow-ups */
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {currentFollowUps.map(fId => {
                      const fQ = QUESTIONS_MAP[fId];
                      if (!fQ) return null;
                      return (
                        <button
                          key={fId}
                          onClick={() => handleSelectQuestion(fId)}
                          disabled={loading}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '0.45rem 0.65rem',
                            background: '#F4F9F4',
                            border: '1px solid #C8E6C9',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            if (!loading) {
                              e.currentTarget.style.background = '#E8F5E9';
                              e.currentTarget.style.borderColor = '#2E7D32';
                              e.currentTarget.style.transform = 'translateX(2px)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!loading) {
                              e.currentTarget.style.background = '#F4F9F4';
                              e.currentTarget.style.borderColor = '#C8E6C9';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{fQ.icon}</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1B5E20' }}>
                              {isHindi ? fQ.questionHi : fQ.questionEn}
                            </span>
                          </div>
                          <ChevronRight size={13} color="#2E7D32" style={{ flexShrink: 0, marginLeft: '0.3rem' }} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Prominent Back to Main Questions button */}
                  <button
                    onClick={() => setActiveQuestionId(null)}
                    style={{
                      marginTop: '0.2rem',
                      width: '100%',
                      padding: '0.45rem 0.6rem',
                      background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <ArrowLeft size={13} />
                    <span>{isHindi ? 'मुख्य प्रश्न मेनू पर वापस जाएं' : 'Back to Main Questions'}</span>
                  </button>
                </>
              ) : (
                /* Main Questions Menu Mode (All 9 questions) */
                PRIMARY_QUESTIONS.map(q => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q.id)}
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.5rem 0.65rem',
                      background: '#F9FAF9',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (!loading) {
                        e.currentTarget.style.background = '#E8F5E9';
                        e.currentTarget.style.borderColor = '#A5D6A7';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!loading) {
                        e.currentTarget.style.background = '#F9FAF9';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{q.icon}</span>
                      <span style={{ 
                        fontSize: '0.78rem', 
                        fontWeight: 600, 
                        color: '#1F2937',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {isHindi ? q.questionHi : q.questionEn}
                      </span>
                    </div>
                    <ChevronRight size={13} color="#2E7D32" style={{ flexShrink: 0, marginLeft: '0.3rem' }} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="pulse-green"
        style={{
          width: 56, height: 56,
          background: 'linear-gradient(135deg, #2E7D32, #4CAF50)',
          border: 'none', borderRadius: '50%',
          boxShadow: '0 4px 16px rgba(46,125,50,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'transform 0.2s',
          float: 'right',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="KrishiMitra Chatbot"
        aria-label="KrishiMitra Chatbot"
      >
        {open ? <X size={24} color="white" /> : <MessageCircle size={24} color="white" />}
      </button>
    </div>
  );
};

export default Chatbot;
