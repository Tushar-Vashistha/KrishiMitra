import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { chatbotService } from '../services/api';

const Chatbot = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: t('chatGreeting'), time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (textToSend = input) => {
    const trimmed = typeof textToSend === 'string' ? textToSend.trim() : '';
    if (!trimmed) return;
    
    const userMsg = { from: 'user', text: trimmed, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (textToSend === input) setInput('');
    
    try {
      const res = await chatbotService.ask(trimmed);
      if (res.success && res.data) {
        setMessages(prev => [...prev, { from: 'bot', text: res.data.response, time: new Date() }]);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, { from: 'bot', text: 'Sorry, I am having trouble connecting right now.', time: new Date() }]);
    }
  };

  const quickQuestions = [
    "How does Credit Score work?",
    "How to book a slot?",
    "Today's mandi rates",
    "My payment status",
    "Cancel my slot",
  ];

  return (
    <div className="chatbot-bubble">
      {/* Chat Window */}
      {open && (
        <div style={{
          width: '320px',
          maxWidth: 'calc(100vw - 2rem)',
          height: '460px',
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
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                {t('chatbotTitle')}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem' }}>
                🟢 Online • {t('chatbotSubtitle')}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
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
                  maxWidth: '78%',
                  background: msg.from === 'user' ? '#2E7D32' : 'white',
                  color: msg.from === 'user' ? 'white' : '#1C1C1C',
                  padding: '0.5rem 0.75rem',
                  borderRadius: msg.from === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
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
                style={{
                  background: '#E8F5E9', color: '#2E7D32',
                  border: '1px solid #C8E6C9', borderRadius: '20px',
                  padding: '0.2rem 0.6rem', fontSize: '0.72rem',
                  cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
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
              onClick={sendMessage}
              style={{
                width: 38, height: 38, background: '#2E7D32',
                border: 'none', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
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
