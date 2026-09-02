import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { chatbotService } from '../services/api';

const Chatbot = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const currentLang = i18n.language || 'en';
  const isHindi = currentLang === 'hi';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Initialize or sync initial message whenever chatbot opens or app language changes
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const switchLanguage = (newLang) => {
    i18n.changeLanguage(newLang);
    const confirmMsg = newLang === 'hi'
      ? 'भाषा हिंदी चुनी गई है। 🌾\nआज मैं आपकी क्या सहायता कर सकता हूँ?'
      : 'Language set to English. 🌾\nHow can I help you today?';
    
    setMessages(prev => [
      ...prev,
      { from: 'bot', isGreeting: true, text: confirmMsg, time: new Date() }
    ]);
  };

  const sendMessage = async (textToSend = input) => {
    const trimmed = typeof textToSend === 'string' ? textToSend.trim() : '';
    if (!trimmed || loading) return;

    const userMsg = { from: 'user', text: trimmed, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (textToSend === input) setInput('');
    setLoading(true);

    try {
      const res = await chatbotService.ask(trimmed, currentLang);
      if (res && res.success && res.data) {
        setMessages(prev => [...prev, { from: 'bot', text: res.data.response, time: new Date() }]);
      } else {
        const errorText = isHindi 
          ? 'अप्रत्याशित प्रतिक्रिया मिली। कृपया पुन: प्रयास करें।' 
          : 'I received an unexpected response. Please try again.';
        setMessages(prev => [...prev, { from: 'bot', text: errorText, time: new Date() }]);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      const networkErrorText = isHindi
        ? 'क्षमा करें, वर्तमान में कनेक्ट करने में समस्या हो रही है। कृपया अपना नेटवर्क जांचें या कुछ समय बाद प्रयास करें।'
        : 'Sorry, I am having trouble connecting right now. Please check your network or try again shortly.';
      setMessages(prev => [...prev, { from: 'bot', text: networkErrorText, time: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = isHindi ? [
    "क्रेडिट स्कोर कैसे काम करता है?",
    "स्लॉट कैसे बुक करें?",
    "आज का मंडी भाव",
    "भुगतान की स्थिति",
    "तत्काल बुकिंग",
  ] : [
    "How does Credit Score work?",
    "How to book a slot?",
    "Today's mandi rates",
    "My payment status",
    "Tatkaal booking",
  ];

  return (
    <div className="chatbot-bubble">
      {/* Chat Window */}
      {open && (
        <div style={{
          width: '350px',
          maxWidth: 'calc(100vw - 2rem)',
          height: '500px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginBottom: '0.75rem',
          animation: 'fadeIn 0.25s ease',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}>
            <div style={{
              width: 36, height: 36,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                {t('chatbotTitle')}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem' }}>
                🟢 Online • {t('chatbotSubtitle')}
              </div>
            </div>

            {/* Language switch button in header */}
            <button
              onClick={() => switchLanguage(isHindi ? 'en' : 'hi')}
              title={isHindi ? "English में बदलें" : "Switch to Hindi"}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '12px',
                color: 'white',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontWeight: 700,
              }}
            >
              <Globe size={13} color="white" />
              {isHindi ? 'EN' : 'हिं'}
            </button>

            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none', border: 'none',
                color: 'white', cursor: 'pointer', padding: '0.25rem'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '0.75rem',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
            background: '#F9FAF9',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: '0.4rem',
              }}>
                {msg.from === 'bot' && (
                  <div style={{
                    width: 28, height: 28, background: '#E8F5E9', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Bot size={14} color="#2E7D32" />
                  </div>
                )}
                <div style={{
                  maxWidth: '82%',
                  background: msg.from === 'user' ? '#2E7D32' : 'white',
                  color: msg.from === 'user' ? 'white' : '#1C1C1C',
                  padding: '0.65rem 0.85rem',
                  borderRadius: msg.from === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  {msg.text}
                </div>
                {msg.from === 'user' && (
                  <div style={{
                    width: 28, height: 28, background: '#E3F2FD', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <User size={14} color="#1565C0" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{
                  width: 28, height: 28, background: '#E8F5E9', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Bot size={14} color="#2E7D32" />
                </div>
                <div style={{
                  background: 'white', padding: '0.5rem 0.8rem', borderRadius: '14px 14px 14px 2px',
                  fontSize: '0.8rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.4rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                }}>
                  <Loader2 size={14} className="animate-spin" color="#2E7D32" />
                  <span>{isHindi ? 'कृषिमित्र AI विचार कर रहा है...' : 'KrishiMitra AI is thinking...'}</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Questions */}
          <div style={{
            padding: '0.5rem 0.75rem',
            display: 'flex',
            gap: '0.4rem',
            flexWrap: 'wrap',
            borderTop: '1px solid #E5E7EB',
            background: 'white',
          }}>
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                disabled={loading}
                style={{
                  background: '#E8F5E9', color: '#2E7D32',
                  border: '1px solid #C8E6C9', borderRadius: '20px',
                  padding: '0.2rem 0.6rem', fontSize: '0.72rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500, whiteSpace: 'nowrap',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding: '0.6rem',
            display: 'flex',
            gap: '0.5rem',
            borderTop: '1px solid #E5E7EB',
            background: 'white',
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder={t('typeMessage')}
              disabled={loading}
              style={{
                flex: 1, border: '1.5px solid #E5E7EB', borderRadius: '8px',
                padding: '0.5rem 0.75rem', fontSize: '0.85rem',
                fontFamily: 'inherit', outline: 'none',
                minHeight: 'unset', height: '38px',
              }}
              onFocus={e => e.target.style.borderColor = '#2E7D32'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, background: (loading || !input.trim()) ? '#9E9E9E' : '#2E7D32',
                border: 'none', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer', flexShrink: 0,
              }}
            >
              <Send size={16} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
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
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="KrishiMitra AI - Chat with us!"
      >
        {open ? <X size={24} color="white" /> : <MessageCircle size={24} color="white" />}
      </button>
    </div>
  );
};

export default Chatbot;
