import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { queueService, bookingService } from '../../services/api';
import { 
  ArrowLeft, Bell, HelpCircle, MapPin, Ticket, RefreshCw, 
  Clock, Calendar, MessageSquare, Phone, ChevronRight, 
  Info, CalendarDays, Inbox, AlertCircle, 
  TrendingUp, CreditCard, ShieldAlert, BarChart2, XCircle
} from 'lucide-react';

const TrackSlot = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';

  // State for interactive queue status simulation
  const [activeToken, setActiveToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTokenNum, setCurrentTokenNum] = useState(119);
  const [tokensAhead, setTokensAhead] = useState(8);
  const [estimatedWait, setEstimatedWait] = useState(40);
  const [completedCount, setCompletedCount] = useState(118);
  const [waitingCount, setWaitingCount] = useState(32);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('10:24 AM');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [toast, setToast] = useState(null);

  const showToastMessage = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchQueueData = async () => {
    setIsRefreshing(true);
    try {
      const res = await queueService.getMy();
      if (res.success && res.data) {
        setActiveToken(res.data);
        setCurrentTokenNum(res.data.currentServingToken || 0);
        setTokensAhead(res.data.tokensAhead || 0);
        setEstimatedWait(res.data.estimatedWaitMins || 0);
        setCompletedCount(res.data.completedCount || 0);
        setWaitingCount(res.data.waitingCount || 0);
        setIsCancelled(res.data.status === 'CANCELLED');
        
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastUpdated(formattedTime);
      } else {
        setActiveToken(null);
      }
    } catch (err) {
      console.error('Failed to load active queue token details:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, []);

  const handleCancelSlot = async () => {
    if (!activeToken || !activeToken.bookingId) {
      showToastMessage(isHindi ? 'कोई सक्रिय बुकिंग नहीं मिली।' : 'No active booking found.');
      return;
    }
    
    // Check if cancellation is allowed
    const slotDateStr = activeToken.booking?.date;
    const slotTimeStr = activeToken.booking?.slotTime;
    if (!slotDateStr || !slotTimeStr) return;
    
    const datePart = slotDateStr.split('T')[0];
    const startTimePart = slotTimeStr.split('-')[0].trim();
    const slotStart = new Date(`${datePart}T${startTimePart}`);
    const now = new Date();
    const diffMs = slotStart - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
      showToastMessage(isHindi ? 'रद्दीकरण की समय सीमा समाप्त हो गई है।' : 'Cancellation window has passed.');
      return;
    }

    const isFree = diffHours >= 24;
    const confirmMsg = isFree
      ? (isHindi ? 'क्या आप वाकई इस बुकिंग को रद्द करना चाहते हैं? (कोई जुर्माना नहीं)' : 'Are you sure you want to cancel this booking? (No penalty)')
      : (isHindi ? '24 घंटे से कम समय बचा है। रद्द करने पर विश्वास स्कोर में -25 की कमी होगी। क्या आप वाकई रद्द करना चाहते हैं?' : 'Less than 24h remaining. Cancelling now will penalize your trust score by -25 points. Proceed?');

    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    try {
      await bookingService.cancel(activeToken.bookingId);
      setIsCancelled(true);
      showToastMessage(isHindi ? 'बुकिंग सफलतापूर्वक रद्द कर दी गई!' : 'Booking cancelled successfully!');
      setTimeout(() => {
        navigate('/farmer/dashboard');
      }, 2000);
    } catch (err) {
      showToastMessage(err.message || 'Failed to cancel slot.');
    }
  };

  // Handle support triggers
  const triggerSupport = () => {
    alert(t('connectingSupport'));
  };

  // Simulates refreshing the queue data
  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    setTimeout(() => {
      setIsRefreshing(false);
      
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedTime = `${hours % 12 || 12}:${minutes} ${ampm}`;
      setLastUpdated(formattedTime);

      setCurrentTokenNum((prev) => {
        const next = prev + Math.floor(Math.random() * 2) + 1;
        const target = 127;
        const finalVal = Math.min(next, target);
        
        const diff = target - finalVal;
        setTokensAhead(diff);
        setEstimatedWait(diff * 5); // 5 mins per token
        setCompletedCount(118 + (finalVal - 119));
        setWaitingCount(32 - (finalVal - 119));
        
        return finalVal;
      });
    }, 800);
  };

  // Percent representing current token progression from T-100 to T-127
  const span = 25;
  const startNum = activeToken ? Math.max(1, activeToken.tokenNumber - span) : 100;
  const progressPercent = activeToken ? Math.min(((currentTokenNum - startNum) / span) * 100, 100) : 50;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={44} color="#059669" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 700, color: '#475569' }}>{isHindi ? 'लोड हो रहा है...' : 'Loading Token Tracker...'}</div>
        </div>
      </div>
    );
  }

  if (!activeToken) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: '1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '480px', width: '100%', background: '#FFFFFF' }}>
          <div style={{
            width: 80, height: 80, background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem', boxShadow: '0 10px 25px rgba(16,185,129,0.1)'
          }}>
            <Ticket size={42} color="#059669" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
            {isHindi ? 'कोई सक्रिय टोकन नहीं मिला' : 'No Active Token Found'}
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {isHindi 
              ? 'वर्तमान में कोई सक्रिय स्लॉट बुकिंग या लाइव ट्रैकिंग टोकन उपलब्ध नहीं है। कृपया नया स्लॉट बुक करें।' 
              : 'You do not have any active slot bookings or live queue tokens at the moment. Please book a new slot.'}
          </p>
          <button onClick={() => navigate('/farmer/book-slot')} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', margin: '0 auto' }}>
            {isHindi ? 'स्लॉट बुक करें' : 'Book a Slot'} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '4rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Floating Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1E293B',
          color: '#FFFFFF',
          padding: '0.75rem 1.5rem',
          borderRadius: '10px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 10000,
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {toast}
        </div>
      )}

      {/* 1. Header Bar */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '1rem 1.5rem', sticky: 'top', zIndex: 10 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', maxWidth: '1200px' }}>
          
          {/* Back Action & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/farmer/dashboard')}
              style={{
                background: '#ECFDF5',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: 'auto'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#D1FAE5'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ECFDF5'}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ backgroundColor: '#D1FAE5', padding: '0.4rem', borderRadius: '8px' }}>
                  <Ticket size={18} color="#059669" />
                </div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                  {t('tokenTracker')}
                </h1>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, marginTop: '2px' }}>
                {t('trackTokenRealTime')}
              </p>
            </div>
          </div>



        </div>
      </div>

      {/* Main Container */}
      <div className="container" style={{ maxWidth: '1200px', marginTop: '2rem', padding: '0 1.5rem' }}>
        
        {/* 2. Three Column Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }} className="main-dashboard-grid">
          
          {/* Column 1: YOUR TOKEN */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>— {t('yourToken')} —</span>
            </div>

            {/* Inner Ticket Card */}
            <div style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderRadius: '20px',
              padding: '1.5rem',
              color: 'white',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(5,150,105,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Ticket cutouts on sides */}
              <div style={{ position: 'absolute', left: '-10px', top: '42%', width: '20px', height: '20px', borderRadius: '50%', background: '#FFFFFF' }} />
              <div style={{ position: 'absolute', right: '-10px', top: '42%', width: '20px', height: '20px', borderRadius: '50%', background: '#FFFFFF' }} />
              
              <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '0.02em', margin: '0.5rem 0 0.75rem' }}>
                T-{activeToken.tokenNumber}
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  backgroundColor: '#FFFFFF',
                  color: currentTokenNum === activeToken.tokenNumber ? '#059669' : '#15803D',
                  padding: '0.35rem 1.2rem',
                  borderRadius: '30px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <span className="animate-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentTokenNum === activeToken.tokenNumber ? '#10B981' : '#059669' }}></span>
                  {currentTokenNum === activeToken.tokenNumber ? t('yourTurn') : t('inQueue')}
                </span>
              </div>

              {/* Farmer in field Illustration */}
              <div style={{ marginTop: '1.25rem' }}>
                <svg viewBox="0 0 240 115" style={{ width: '100%', height: 'auto', borderRadius: '12px', background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {/* Sun */}
                  <circle cx="180" cy="25" r="10" fill="#FFFBEB" opacity="0.9" />
                  {/* Hills */}
                  <path d="M-20,115 Q40,65 110,95 T260,100 L260,115 Z" fill="#6EE7B7" opacity="0.4" />
                  <path d="M30,115 Q100,75 170,100 T300,95 L300,115 Z" fill="#34D399" opacity="0.6" />
                  <path d="M-10,115 Q80,85 160,110 T320,105 L320,115 Z" fill="#059669" opacity="0.8" />
                  {/* House */}
                  <rect x="25" y="85" width="20" height="15" fill="#D97706" rx="1.5" />
                  <polygon points="20,85 35,73 50,85" fill="#92400E" />
                  <rect x="31" y="91" width="6" height="9" fill="#FFFBEB" />
                  {/* Farmer */}
                  <path d="M120,115 C120,95 128,92 133,92 C138,92 146,95 146,115 Z" fill="#FFFFFF" /> {/* Kurta */}
                  <circle cx="133" cy="83" r="7" fill="#FED7AA" /> {/* Face */}
                  <path d="M126,80 C126,76 140,76 140,80 C140,82 126,82 126,80 Z" fill="#F1F5F9" /> {/* Turban */}
                  {/* Phone Arm */}
                  <path d="M124,105 L118,92 L121,90 L127,101 Z" fill="#FFFFFF" />
                  <rect x="114" y="84" width="5" height="9" rx="1" fill="#1E293B" transform="rotate(-15 114 84)" /> {/* Phone */}
                  <circle cx="116" cy="87" r="1.2" fill="#34D399" />
                </svg>
              </div>
            </div>

            {/* Megaphone alert bar */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: '16px',
              padding: '1rem',
              alignItems: 'flex-start'
            }}>
              <div style={{ color: '#D97706', marginTop: '2px' }}>
                <AlertCircle size={18} />
              </div>
              <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 600, lineHeight: '1.4', textAlign: 'left' }}>
                {t('cancellationWarning')}
              </div>
            </div>
          </div>

          {/* Column 2: QUEUE STATUS */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', margin: 0 }}>
                {isHindi ? 'कतार की स्थिति' : 'Queue Status'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{isHindi ? 'अंतिम अपडेट' : 'Last updated'}: {lastUpdated}</span>
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    cursor: isRefreshing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    minHeight: 'auto'
                  }}
                >
                  <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Row of 3 mini metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              
              {/* Current Token */}
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', backgroundColor: '#DCFCE7', padding: '0.35rem', borderRadius: '50%', marginBottom: '0.4rem' }}>
                  <Inbox size={14} color="#15803D" />
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{t('currentToken')}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>T-{currentTokenNum}</div>
              </div>

              {/* Tokens Ahead */}
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', backgroundColor: '#FFEDD5', padding: '0.35rem', borderRadius: '50%', marginBottom: '0.4rem' }}>
                  <TrendingUp size={14} color="#C2410C" />
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{t('tokensAhead')}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: tokensAhead === 0 ? '#10B981' : '#EA580C', marginTop: '2px' }}>{tokensAhead}</div>
              </div>

              {/* Estimated Wait */}
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', backgroundColor: '#EFF6FF', padding: '0.35rem', borderRadius: '50%', marginBottom: '0.4rem' }}>
                  <Clock size={14} color="#1D4ED8" />
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{t('estimatedWait')}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
                  {tokensAhead === 0 ? (isHindi ? 'अभी' : 'Now') : `~${estimatedWait} ${isHindi ? 'मिनट' : 'min'}`}
                </div>
              </div>

            </div>

            {/* Slider queue representation */}
            <div style={{ padding: '0.75rem 0.5rem 1.25rem' }}>
              <div style={{ position: 'relative', height: '6px', background: '#E2E8F0', borderRadius: '3px', width: '100%', marginBottom: '1.25rem' }}>
                
                {/* Completed Solid Green Line */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: '#22C55E',
                  borderRadius: '3px',
                  transition: 'width 0.4s ease'
                }} />

                {/* Remaining Dash Line */}
                <div style={{
                  position: 'absolute',
                  left: `${progressPercent}%`,
                  right: 0,
                  height: '100%',
                  backgroundImage: 'linear-gradient(to right, #EA580C 50%, rgba(255,255,255,0) 0%)',
                  backgroundPosition: 'bottom',
                  backgroundSize: '8px 6px',
                  backgroundRepeat: 'repeat-x',
                  transition: 'left 0.4s ease'
                }} />

                {/* Start Point (Completed reference T-100) */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#22C55E',
                  border: '2px solid #FFFFFF',
                  zIndex: 2
                }} />

                {/* Current Point T-119 */}
                <div style={{
                  position: 'absolute',
                  left: `${progressPercent}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#EA580C',
                  border: '3px solid #FFFFFF',
                  boxShadow: '0 2px 8px rgba(234,88,12,0.4)',
                  transition: 'left 0.4s ease',
                  zIndex: 3
                }} />

                {/* Your Token Point T-127 */}
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translate(50%, -50%)',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: currentTokenNum === activeToken.tokenNumber ? '#22C55E' : '#FFFFFF',
                  border: `3px solid ${currentTokenNum === activeToken.tokenNumber ? '#FFFFFF' : '#059669'}`,
                  boxShadow: currentTokenNum === activeToken.tokenNumber ? '0 2px 8px rgba(34,197,94,0.4)' : 'none',
                  zIndex: 2
                }} />

              </div>

              {/* Slider Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontWeight: 800, color: '#475569', display: 'block' }}>T-{startNum}</span>
                  <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>{t('completed')}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#EA580C', display: 'block' }}>T-{currentTokenNum}</span>
                  <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>{t('currentToken')}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 800, color: '#059669', display: 'block' }}>T-{activeToken.tokenNumber}</span>
                  <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>{t('yourToken')}</span>
                </div>
              </div>
            </div>

            {/* Bottom green queue stats block */}
            <div style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '16px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: 'center',
              marginTop: 'auto'
            }}>
              <BarChart2 size={16} color="#059669" />
              <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}>
                {t('totalTokens')}: <strong style={{ color: '#065F46' }}>150</strong> &nbsp;|&nbsp; 
                {t('completed')}: <strong style={{ color: '#065F46' }}>{completedCount}</strong> &nbsp;|&nbsp; 
                {t('waiting')}: <strong style={{ color: '#065F46' }}>{waitingCount}</strong>
              </div>
            </div>

          </div>

          {/* Column 3: NOTIFICATIONS */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Bell size={16} color="#059669" /> {isHindi ? 'अधिसूचनाएं' : 'Notifications'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Alert 1 */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', backgroundColor: '#ECFDF5', borderRadius: '12px', border: '1px solid #D1FAE5' }}>
                <div style={{ backgroundColor: '#D1FAE5', padding: '0.35rem', borderRadius: '50%', color: '#059669', display: 'flex', flexShrink: 0 }}>
                  <Bell size={14} />
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600, lineHeight: '1.4', textAlign: 'left' }}>
                  {t('notif3NumbersAway')}
                </div>
              </div>

              {/* Alert 2 */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', backgroundColor: '#FFFBEB', borderRadius: '12px', border: '1px solid #FEF3C7' }}>
                <div style={{ backgroundColor: '#FEF3C7', padding: '0.35rem', borderRadius: '50%', color: '#D97706', display: 'flex', flexShrink: 0 }}>
                  <Bell size={14} />
                </div>
                <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 600, lineHeight: '1.4', textAlign: 'left' }}>
                  {t('notifReachBeforeTurn')}
                </div>
              </div>

              {/* Alert 3 */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', backgroundColor: '#EFF6FF', borderRadius: '12px', border: '1px solid #DBEAFE' }}>
                <div style={{ backgroundColor: '#DBEAFE', padding: '0.35rem', borderRadius: '50%', color: '#1D4ED8', display: 'flex', flexShrink: 0 }}>
                  <Bell size={14} />
                </div>
                <div style={{ fontSize: '0.78rem', color: '#1D4ED8', fontWeight: 600, lineHeight: '1.4', textAlign: 'left' }}>
                  {t('notifKeepDocsReady')}
                </div>
              </div>

            </div>

            {/* Notification Settings Link */}
            <button 
              style={{
                marginTop: 'auto',
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              <span>{t('notifSettings')}</span>
              <ChevronRight size={14} />
            </button>
          </div>

        </div>

        {/* 3. Bottom Row Cards (Slot Details & Quick Actions) */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }} className="bottom-dashboard-grid">
          
          {/* Your Slot Details */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CalendarDays size={16} color="#059669" /> {t('yourSlotDetails')}
              </h3>
            </div>

            {/* 4 Detail Grid Cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
              
              {/* Date */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#E6F4EA', padding: '0.5rem', borderRadius: '10px', color: '#137333', display: 'flex' }}>
                  <Calendar size={18} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>{t('date')}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
                    {activeToken.booking?.date ? new Date(activeToken.booking.date).toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    {activeToken.booking?.date ? new Date(activeToken.booking.date).toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', { weekday: 'long' }) : ''}
                  </div>
                </div>
              </div>

              {/* Time Slot */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#E6F4EA', padding: '0.5rem', borderRadius: '10px', color: '#137333', display: 'flex' }}>
                  <Clock size={18} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>{t('timeSlot')}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>{activeToken.booking?.slotTime}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{t('duration')}: 30 {isHindi ? 'मिनट' : 'min'}</div>
                </div>
              </div>

              {/* Procurement Centre */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#E6F4EA', padding: '0.5rem', borderRadius: '10px', color: '#137333', display: 'flex' }}>
                  <MapPin size={18} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>{t('centreLabel')}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
                    {isHindi ? (activeToken.booking?.centre?.nameHi || activeToken.booking?.centre?.name) : activeToken.booking?.centre?.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    {isHindi ? (activeToken.booking?.centre?.addressHi || activeToken.booking?.centre?.address) : activeToken.booking?.centre?.address}
                  </div>
                </div>
              </div>

              {/* Commodity */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#E6F4EA', padding: '0.5rem', borderRadius: '10px', color: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>🌾</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>{t('commodity')}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
                    {isHindi ? (activeToken.booking?.crop?.nameHi || activeToken.booking?.crop?.name) : activeToken.booking?.crop?.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{t('quantity')}: {activeToken.booking?.weight} {isHindi ? 'क्विंटल' : 'Quintal'}</div>
                </div>
              </div>

            </div>

            {/* Bottom info banner */}
            {!isCancelled ? (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '16px',
                padding: '0.75rem 1rem',
                flexWrap: 'wrap',
                gap: '1rem',
                marginTop: '0.5rem'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', textAlign: 'left' }}>
                  <Info size={16} color="#1D4ED8" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 600 }}>
                    {t('cancellationWarning')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>


                  <button 
                    onClick={handleCancelSlot}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #FECACA',
                      borderRadius: '10px',
                      padding: '0.4rem 0.9rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#DC2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: 'auto'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    <XCircle size={14} />
                    <span>{t('cancelSlot')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                textAlign: 'center',
                color: '#DC2626',
                fontWeight: 700,
                fontSize: '0.85rem',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <XCircle size={16} /> {t('slotCancelledSuccess')}
              </div>
            )}

          </div>

          {/* Quick Actions */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ⚡ {t('quickActions')}
              </h3>
            </div>

            {/* 4 action buttons grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {/* My Bookings */}
              <button 
                onClick={() => navigate('/farmer/dashboard')}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10B981';
                  e.currentTarget.style.backgroundColor = '#ECFDF5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: '#E6F4EA', padding: '0.35rem', borderRadius: '50%', display: 'flex' }}>
                    <Calendar size={16} color="#059669" />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>{t('myBookings')}</span>
                </div>
                <ChevronRight size={16} color="#64748B" />
              </button>

              {/* Payment Status */}
              <button 
                onClick={() => navigate('/farmer/payment-history')}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: '#EFF6FF', padding: '0.35rem', borderRadius: '50%', display: 'flex' }}>
                    <CreditCard size={16} color="#3B82F6" />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>{t('paymentStatus')}</span>
                </div>
                <ChevronRight size={16} color="#64748B" />
              </button>

              {/* Help Center */}
              <button 
                onClick={() => setShowHelpModal(true)}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#F59E0B';
                  e.currentTarget.style.backgroundColor = '#FFFBEB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: '#FFFBEB', padding: '0.35rem', borderRadius: '50%', display: 'flex' }}>
                    <HelpCircle size={16} color="#F59E0B" />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>{t('helpCenter')}</span>
                </div>
                <ChevronRight size={16} color="#64748B" />
              </button>



            </div>
          </div>

        </div>

        {/* 4. Footer Banner */}
        <div style={{
          backgroundColor: '#E6F4EA',
          border: '1.5px solid #A7F3D0',
          borderRadius: '20px',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 4px 15px rgba(16,185,129,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
            <span style={{ fontSize: '1.5rem' }}>🌱</span>
            <div style={{ fontSize: '0.9rem', color: '#137333', fontWeight: 600 }}>
              {t('footerThankYou')}
            </div>
          </div>

          {/* Farmer & Ox vector */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 160 50" style={{ width: '160px', height: '50px' }}>
              {/* Soil paths */}
              <path d="M0,45 C40,43 80,47 120,44 C140,44 150,46 160,45 L160,50 L0,50 Z" fill="#137333" opacity="0.8" />
              {/* Ox */}
              <path d="M80,45 C80,30 90,25 100,25 C110,25 115,30 115,45 Z" fill="#E2E8F0" />
              <path d="M110,32 C115,30 122,25 125,25 C125,28 120,32 118,34 Z" fill="#CBD5E1" />
              <path d="M125,25 L128,20 M124,24 L125,18" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="85" y1="45" x2="85" y2="50" stroke="#94A3B8" strokeWidth="2.5" />
              <line x1="95" y1="45" x2="95" y2="50" stroke="#94A3B8" strokeWidth="2.5" />
              <line x1="105" y1="45" x2="105" y2="50" stroke="#94A3B8" strokeWidth="2.5" />
              <line x1="112" y1="45" x2="112" y2="50" stroke="#94A3B8" strokeWidth="2.5" />
              {/* Farmer plowing */}
              <path d="M30,45 C30,32 35,30 38,30 C40,30 45,32 45,45 Z" fill="#FFFFFF" />
              <circle cx="38" cy="24" r="5" fill="#FED7AA" />
              <path d="M33,22 C33,18 43,18 43,22 Z" fill="#E2E8F0" />
              {/* Plow frame */}
              <path d="M42,38 L65,42 L72,46" fill="none" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="65" y1="42" x2="65" y2="48" stroke="#78350F" strokeWidth="2" />
              {/* Connecting line */}
              <path d="M72,32 L88,32" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
            </svg>
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .main-dashboard-grid {
            grid-template-columns: 1fr !important;
          }
          .bottom-dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Help Center Modal */}
      {showHelpModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderRadius: '20px',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <HelpCircle size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.5rem' }}>
              {t('helpCenterTitle')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {t('helpCenterDesc')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem', textAlign: 'left' }}>
              {/* Toll Free */}
              <a href="tel:18001234567" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                border: '1.5px solid #FEF3C7',
                backgroundColor: '#FFFBEB',
                borderRadius: '12px',
                color: '#B45309',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF3C7'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFBEB'}
              >
                <Phone size={18} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#B45309', opacity: 0.8, textTransform: 'uppercase', fontWeight: 800 }}>{t('tollFreeLabel')}</div>
                  <div>1800-123-4567</div>
                </div>
              </a>

              {/* Complaint Email */}
              <a href="mailto:complaints@krishimitra.gov.in?subject=Token%20Complaint" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                border: '1.5px solid #EFF6FF',
                backgroundColor: '#F0F9FF',
                borderRadius: '12px',
                color: '#1D4ED8',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F0F9FF'}
              >
                <Inbox size={18} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#1D4ED8', opacity: 0.8, textTransform: 'uppercase', fontWeight: 800 }}>{t('complaintBoxEmail')}</div>
                  <div>complaints@krishimitra.gov.in</div>
                </div>
              </a>
            </div>

            <button 
              onClick={() => setShowHelpModal(false)}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrackSlot;
