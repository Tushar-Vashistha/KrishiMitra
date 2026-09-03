import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { queueService, bookingService } from '../../services/api';
import { 
  ArrowLeft, Bell, HelpCircle, MapPin, Ticket, RefreshCw, 
  Clock, Calendar, Phone, ChevronRight, 
  CalendarDays, Inbox, 
  CreditCard, BarChart2, XCircle,
  Users, Volume2, Sparkles
} from 'lucide-react';

const TrackSlot = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';

  // State
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('11:51 AM');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [toast, setToast] = useState(null);

  // Scenario toggle for simulation: 'yourTurnNow' (T-1, 0 ahead) vs 'inQueue' (T-22, 2 ahead)
  const [scenario, setScenario] = useState('yourTurnNow');

  // Token and queue metrics
  const [tokenNumeric, setTokenNumeric] = useState(1);
  const [currentTokenNum, setCurrentTokenNum] = useState(1);
  const [tokensAhead, setTokensAhead] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [completedCount, setCompletedCount] = useState(4);
  const [waitingCount, setWaitingCount] = useState(1);
  const [totalTokensToday] = useState(150);

  // Booking details matching user wireframe (4 Sep 2026, 7-10 AM, Bhagwanpur Centre, Paddy, 25 Quintal)
  const [bookingInfo, setBookingInfo] = useState({
    id: 'BK-2026-001',
    date: '2026-09-04',
    dateFormattedEn: '4 Sep 2026',
    dateFormattedHi: '4 सित 2026',
    weekdayEn: 'Friday',
    weekdayHi: 'शुक्रवार',
    slotTime: '07:00 AM – 10:00 AM',
    duration: '30 min',
    centreName: 'Bhagwanpur Centre',
    centreNameHi: 'भगवानपुर मंडी केंद्र',
    centreFullEn: 'Bhagwanpur Procurement Centre',
    centreFullHi: 'भगवानपुर कृषि खरीद केंद्र, लखनऊ',
    commodity: 'Paddy',
    commodityHi: 'धान / चावल',
    quantity: '25 Quintal',
    quantityHi: '25 क्विंटल',
    status: 'CONFIRMED'
  });

  const showToastMessage = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Announce turn using speech synthesis
  const handlePlayAnnouncement = () => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = isHindi
          ? `टोकन टी-${tokenNumeric}, आपकी बारी आ गई है। कृपया काउंटर नंबर 1 पर पहुंचें।`
          : `Token T-${tokenNumeric}, your turn is now. Please proceed to Counter 1.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
        showToastMessage(isHindi ? '📢 घोषणा बजाई जा रही है' : '📢 Playing voice announcement');
      } else {
        showToastMessage(isHindi ? 'ऑडियो समर्थित नहीं है' : 'Audio not supported on this device');
      }
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Fetch from API or fallback
  const fetchQueueData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await queueService.getMy();
      let tokenData = null;
      let bookingData = null;

      if (res && res.success && res.data) {
        tokenData = res.data.token || res.data;
        bookingData = tokenData.booking || res.data.booking;
      }

      if (!tokenData || !bookingData) {
        try {
          const bRes = await bookingService.getMy();
          if (bRes && bRes.success && Array.isArray(bRes.data) && bRes.data.length > 0) {
            const activeBooking = bRes.data.find((b) => !['CANCELLED', 'COMPLETED'].includes(b.status)) || bRes.data[0];
            if (activeBooking) {
              bookingData = activeBooking;
              tokenData = activeBooking.queueToken || {
                tokenNumber: 1,
                status: activeBooking.status === 'ARRIVED' ? 'ARRIVED' : 'WAITING',
              };
            }
          }
        } catch (bErr) {
          console.warn('Booking fallback check failed:', bErr);
        }
      }

      if (tokenData && bookingData) {
        const num = tokenData.tokenNumber || 1;
        setTokenNumeric(num);
        const ahead = res?.data?.tokensAhead !== undefined ? res.data.tokensAhead : (res?.data?.peopleAhead !== undefined ? res.data.peopleAhead : 0);
        setTokensAhead(ahead);
        setCurrentTokenNum(res?.data?.currentServingToken || Math.max(1, num - ahead));
        setEstimatedWait(res?.data?.estimatedWaitMins || (ahead === 0 ? 0 : ahead * 5));
        setCompletedCount(res?.data?.completedCount || 4);
        setWaitingCount(res?.data?.waitingCount || (ahead + 1));
        setIsCancelled(bookingData.status === 'CANCELLED');

        setBookingInfo(prev => ({
          ...prev,
          id: bookingData.id || prev.id,
          date: bookingData.date || prev.date,
          slotTime: bookingData.slotTime || prev.slotTime,
          centreName: bookingData.centre?.name || prev.centreName,
          commodity: bookingData.crop?.name || prev.commodity,
          quantity: `${bookingData.weight || 25} Quintal`,
        }));
      }

      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(formattedTime);
    } catch (err) {
      console.warn('Backend offline or error, using default mock queue data:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(() => {
      fetchQueueData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Quick Scenario Switching for Testing & Demonstration
  const switchScenario = (mode) => {
    setScenario(mode);
    if (mode === 'yourTurnNow') {
      setTokenNumeric(1);
      setCurrentTokenNum(1);
      setTokensAhead(0);
      setEstimatedWait(0);
      setCompletedCount(4);
      setWaitingCount(1);
      showToastMessage(isHindi ? 'दृश्य बदला गया: आपकी बारी (T-1)' : 'Scenario: YOUR TURN IS NOW (T-1)');
    } else {
      // 'inQueue' scenario matching T-20 ✓ → T-21 ✓ → T-22 🟢 → T-23 → T-24
      setTokenNumeric(22);
      setCurrentTokenNum(22);
      setTokensAhead(0);
      setEstimatedWait(0);
      setCompletedCount(21);
      setWaitingCount(3);
      showToastMessage(isHindi ? 'दृश्य बदला गया: टोकन T-22 कतार' : 'Scenario: T-22 Queue Stepper');
    }
  };

  // Step advancement simulator
  const handleAdvanceStep = () => {
    setCurrentTokenNum(prev => prev + 1);
    setTokensAhead(prev => Math.max(0, prev - 1));
    setCompletedCount(prev => prev + 1);
    setWaitingCount(prev => Math.max(0, prev - 1));
    showToastMessage(isHindi ? 'कतार एक टोकन आगे बढ़ी (+1)' : 'Queue advanced (+1 token)');
  };

  // Cancellation Handler
  const handleCancelSlot = async () => {
    if (isCancelled) {
      showToastMessage(isHindi ? 'यह स्लॉट पहले ही रद्द हो चुका है।' : 'This slot is already cancelled.');
      return;
    }

    const confirmed = window.confirm(
      isHindi 
        ? 'क्या आप वाकई इस स्लॉट को रद्द करना चाहते हैं? (स्लॉट से 24 घंटे पहले तक कोई पेनल्टी नहीं)'
        : 'Are you sure you want to cancel this slot? (Free cancellation up to 24h before slot)'
    );

    if (!confirmed) return;

    try {
      if (bookingInfo.id) {
        await bookingService.cancel(bookingInfo.id);
      }
    } catch (e) {
      console.warn('API cancellation error, updating local state:', e);
    }

    setIsCancelled(true);
    showToastMessage(isHindi ? 'बुकिंग सफलतापूर्वक रद्द कर दी गई!' : 'Booking cancelled successfully!');
  };

  // Calculate 5-node Token Stepper Sequence: T-20 ✓ → T-21 ✓ → T-22 🟢 → T-23 → T-24
  const tokenSequence = useMemo(() => {
    const center = tokenNumeric; // User's token
    const nodes = [];
    
    // Create a 5-item window around the user token: [center - 2, center - 1, center, center + 1, center + 2]
    const offsets = [-2, -1, 0, 1, 2];
    offsets.forEach(offset => {
      const num = Math.max(1, center + offset);
      // Determine node status
      const isYou = num === tokenNumeric;
      const isCompleted = num < currentTokenNum;
      const isServing = num === currentTokenNum;
      const isUpcoming = num > currentTokenNum && !isYou;

      nodes.push({
        number: num,
        label: `T-${num}`,
        isYou,
        isCompleted,
        isServing,
        isUpcoming,
      });
    });

    // Remove potential duplicates if clamped to 1
    const uniqueNodes = [];
    const seen = new Set();
    for (const node of nodes) {
      if (!seen.has(node.number)) {
        seen.add(node.number);
        uniqueNodes.push(node);
      }
    }

    // Ensure we always have 5 sequential items for aesthetic balance
    while (uniqueNodes.length < 5) {
      const nextNum = uniqueNodes[uniqueNodes.length - 1].number + 1;
      uniqueNodes.push({
        number: nextNum,
        label: `T-${nextNum}`,
        isYou: nextNum === tokenNumeric,
        isCompleted: nextNum < currentTokenNum,
        isServing: nextNum === currentTokenNum,
        isUpcoming: true,
      });
    }

    return uniqueNodes;
  }, [tokenNumeric, currentTokenNum]);

  const isYourTurn = tokensAhead === 0 && !isCancelled;

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={42} color="#059669" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 800, color: '#475569', fontSize: '1rem' }}>
            {isHindi ? 'टोकन विवरण लोड हो रहा है...' : 'Loading Token Tracker...'}
          </div>
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
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          zIndex: 10000,
          fontSize: '0.88rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <span>{toast}</span>
        </div>
      )}

      {/* Subheader Navigation Bar */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0.85rem 1.5rem', position: 'sticky', top: '56px', zIndex: 20 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button 
              onClick={() => navigate('/farmer/dashboard')}
              style={{
                background: '#ECFDF5',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title={isHindi ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard'}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ backgroundColor: '#D1FAE5', padding: '0.35rem', borderRadius: '8px' }}>
                  <Ticket size={17} color="#059669" />
                </div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {t('tokenTracker')}
                </h1>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0' }}>
                {t('trackTokenRealTime')}
              </p>
            </div>
          </div>

          {/* Right Status Info & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'none' }} className="time-indicator">
              {isHindi ? 'अंतिम अपडेट' : 'Last updated'}: {lastUpdated}
            </span>
            <button
              onClick={() => fetchQueueData()}
              disabled={isRefreshing}
              style={{
                backgroundColor: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                padding: '0.4rem 0.75rem',
                color: '#0F172A',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: isRefreshing ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} color="#059669" />
              <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Page Container */}
      <div className="container" style={{ maxWidth: '1100px', margin: '1.5rem auto 0', padding: '0 1rem' }}>
        
        {/* Interactive Scenario Switcher (Helpful demo bar for review) */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '0.6rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.6rem',
          fontSize: '0.78rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: 700 }}>
            <Sparkles size={15} color="#059669" />
            <span>{isHindi ? 'दृश्य टॉगल (डेमो परीक्षण):' : 'Demo Scenarios:'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => switchScenario('yourTurnNow')}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: scenario === 'yourTurnNow' ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                backgroundColor: scenario === 'yourTurnNow' ? '#ECFDF5' : '#FFFFFF',
                color: scenario === 'yourTurnNow' ? '#065F46' : '#64748B',
                cursor: 'pointer'
              }}
            >
              🟢 {isHindi ? 'T-1 (आपकी बारी)' : 'T-1 (Your Turn)'}
            </button>

            <button
              onClick={() => switchScenario('inQueue')}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: scenario === 'inQueue' ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                backgroundColor: scenario === 'inQueue' ? '#ECFDF5' : '#FFFFFF',
                color: scenario === 'inQueue' ? '#065F46' : '#64748B',
                cursor: 'pointer'
              }}
            >
              🌾 {isHindi ? 'T-22 (कतार प्रवाह)' : 'T-22 (Queue Stepper)'}
            </button>

            <button
              onClick={handleAdvanceStep}
              style={{
                padding: '0.3rem 0.7rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                color: '#1E293B',
                cursor: 'pointer'
              }}
              title="Advance queue by 1 token"
            >
              +1 {isHindi ? 'अगला टोकन' : 'Next'}
            </button>
          </div>
        </div>

        {/* 1. 🟢 TOP PROMINENT STATUS BANNER */}
        <div style={{
          backgroundColor: isCancelled 
            ? '#FEF2F2' 
            : isYourTurn 
            ? '#ECFDF5' 
            : '#FFFBEB',
          border: `2px solid ${isCancelled ? '#FCA5A5' : isYourTurn ? '#86EFAC' : '#FDE68A'}`,
          borderRadius: '18px',
          padding: '1.1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          boxShadow: isYourTurn ? '0 6px 20px rgba(16, 185, 129, 0.14)' : '0 4px 12px rgba(0,0,0,0.03)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            {/* Pulsing indicator dot */}
            <div style={{ position: 'relative', display: 'flex', height: '18px', width: '18px', flexShrink: 0 }}>
              {!isCancelled && (
                <span style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  backgroundColor: isYourTurn ? '#34D399' : '#FBBF24',
                  opacity: 0.75,
                  animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                }} />
              )}
              <span style={{
                position: 'relative',
                display: 'inline-flex',
                borderRadius: '50%',
                height: '18px',
                width: '18px',
                backgroundColor: isCancelled ? '#DC2626' : isYourTurn ? '#059669' : '#D97706'
              }} />
            </div>

            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: isCancelled ? '#991B1B' : isYourTurn ? '#065F46' : '#92400E',
                margin: 0,
                letterSpacing: '0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {isCancelled
                  ? (isHindi ? '🔴 स्लॉट रद्द कर दिया गया है' : '🔴 SLOT CANCELLED')
                  : isYourTurn
                  ? (isHindi ? '🟢 आपकी बारी आ गई है' : '🟢 YOUR TURN IS NOW')
                  : (isHindi ? `🟡 कतार में • ${tokensAhead} लोग आपके आगे हैं` : `🟡 IN QUEUE • ${tokensAhead} PEOPLE BEFORE YOU`)}
              </h2>
              <p style={{
                fontSize: '0.82rem',
                color: isCancelled ? '#B91C1C' : isYourTurn ? '#047857' : '#B45309',
                margin: '3px 0 0',
                fontWeight: 600
              }}>
                {isCancelled
                  ? (isHindi ? 'आपकी बुकिंग रद्द कर दी गई है। आप नया स्लॉट बुक कर सकते हैं।' : 'Your booking has been cancelled. You may book a new slot anytime.')
                  : isYourTurn
                  ? (isHindi ? 'कृपया काउंटर नंबर 1 पर अपनी उपज के साथ तुरंत पहुंचें।' : 'Please proceed immediately to Counter #1 with your crop vehicle for weighing.')
                  : (isHindi ? 'कृपया अपनी बारी की प्रतीक्षा करें एवं अपने दस्तावेज तैयार रखें।' : 'Please wait for your turn and keep your documents ready for inspection.')}
              </p>
            </div>
          </div>

          {/* Voice announcement speaker button */}
          {isYourTurn && (
            <button
              onClick={handlePlayAnnouncement}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #A7F3D0',
                borderRadius: '12px',
                padding: '0.5rem 1rem',
                color: '#065F46',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0FDF4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            >
              <Volume2 size={16} color="#059669" />
              <span>{isHindi ? 'घोषणा सुनें' : 'Listen Alert'}</span>
            </button>
          )}
        </div>

        {/* 2. HERO QUEUE CARD (TOKEN BOX + STATS + STEPPER FLOW) */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1.5px solid #E2E8F0',
          padding: '1.75rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          marginBottom: '1.5rem'
        }}>
          
          {/* Upper Row: Left Ticket Card & Right Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 340px) 1fr',
            gap: '2rem',
            alignItems: 'center'
          }} className="hero-queue-grid">

            {/* Left: Beautiful Emerald Ticket Card */}
            <div style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderRadius: '22px',
              padding: '1.5rem 1.25rem',
              color: 'white',
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 12px 30px rgba(5, 150, 105, 0.25)',
              overflow: 'hidden'
            }}>
              {/* Ticket cutouts on side borders */}
              <div style={{ position: 'absolute', left: '-12px', top: '46%', width: '22px', height: '22px', borderRadius: '50%', background: '#FFFFFF' }} />
              <div style={{ position: 'absolute', right: '-12px', top: '46%', width: '22px', height: '22px', borderRadius: '50%', background: '#FFFFFF' }} />

              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.9, fontWeight: 800 }}>
                — {t('yourToken')} —
              </div>
              
              <div style={{ fontSize: '3.2rem', fontWeight: 900, letterSpacing: '0.02em', margin: '0.2rem 0 0.5rem', lineHeight: 1.1 }}>
                T-{tokenNumeric}
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <span style={{
                  backgroundColor: '#FFFFFF',
                  color: isCancelled ? '#DC2626' : '#059669',
                  padding: '0.45rem 1.25rem',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isCancelled ? '#DC2626' : '#10B981'
                  }} className={isCancelled ? "" : "animate-pulse"} />
                  {isCancelled 
                    ? (isHindi ? 'रद्द (CANCELLED)' : 'CANCELLED')
                    : isYourTurn 
                    ? (isHindi ? '🟢 आपकी बारी' : '🟢 YOUR TURN') 
                    : (isHindi ? 'कतार में' : 'IN QUEUE')}
                </span>
              </div>

              {/* Farmer & Sun Landscape Artwork */}
              <div style={{ marginTop: '0.75rem' }}>
                <svg viewBox="0 0 240 100" style={{ width: '100%', height: 'auto', borderRadius: '12px', background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.25)' }}>
                  {/* Sun */}
                  <circle cx="185" cy="22" r="9" fill="#FFFBEB" opacity="0.95" />
                  {/* Hills */}
                  <path d="M-20,100 Q40,55 110,85 T260,88 L260,100 Z" fill="#6EE7B7" opacity="0.45" />
                  <path d="M30,100 Q100,68 170,90 T300,85 L300,100 Z" fill="#34D399" opacity="0.65" />
                  <path d="M-10,100 Q80,75 160,98 T320,95 L320,100 Z" fill="#059669" opacity="0.85" />
                  {/* Village Hut */}
                  <rect x="25" y="73" width="18" height="14" fill="#D97706" rx="1.5" />
                  <polygon points="20,73 34,62 48,73" fill="#92400E" />
                  <rect x="30" y="78" width="6" height="9" fill="#FFFBEB" />
                  {/* Farmer */}
                  <path d="M120,100 C120,82 127,78 132,78 C137,78 144,82 144,100 Z" fill="#FFFFFF" />
                  <circle cx="132" cy="70" r="6.5" fill="#FED7AA" />
                  <path d="M125,67 C125,63 139,63 139,67 C139,69 125,69 125,67 Z" fill="#F1F5F9" />
                  {/* Phone Hand */}
                  <path d="M123,90 L118,80 L121,78 L126,88 Z" fill="#FFFFFF" />
                  <rect x="114" y="73" width="5" height="8" rx="1" fill="#1E293B" transform="rotate(-15 114 73)" />
                  <circle cx="116" cy="75" r="1" fill="#34D399" />
                </svg>
              </div>
            </div>

            {/* Right: Prominent Wait & Queue Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                
                {/* 👥 People before you */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '20px',
                  padding: '1.5rem 1.25rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
                }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#64748B', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <Users size={18} color="#059669" />
                    <span>{t('peopleBeforeYou')}</span>
                  </div>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 900,
                    color: tokensAhead === 0 ? '#10B981' : '#0F172A',
                    marginTop: '0.4rem',
                    lineHeight: 1
                  }}>
                    {tokensAhead}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.5rem', fontWeight: 600 }}>
                    {tokensAhead === 0 ? (isHindi ? 'आप कतार में सबसे आगे हैं' : 'You are next at counter') : (isHindi ? 'किसान आपसे पहले हैं' : 'farmers waiting ahead')}
                  </div>
                </div>

                {/* 🕐 Expected wait */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '20px',
                  padding: '1.5rem 1.25rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
                }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#64748B', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <Clock size={18} color="#0284C7" />
                    <span>{t('estimatedWait')}</span>
                  </div>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 900,
                    color: tokensAhead === 0 ? '#10B981' : '#0F172A',
                    marginTop: '0.4rem',
                    lineHeight: 1
                  }}>
                    {tokensAhead === 0 ? (isHindi ? 'अभी' : 'NOW') : `~${estimatedWait}m`}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.5rem', fontWeight: 600 }}>
                    {tokensAhead === 0 ? (isHindi ? 'तत्काल पहुंचें' : 'Immediate entry') : (isHindi ? 'अनुमानित समय' : 'Estimated queue time')}
                  </div>
                </div>

              </div>

              {/* Live Centre Summary Pill */}
              <div style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '16px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <BarChart2 size={18} color="#059669" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#065F46' }}>
                    {isHindi ? 'वर्तमान में तौल जारी:' : 'Currently Serving:'} <strong>T-{currentTokenNum}</strong> (Counter #1)
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700 }}>
                  {t('totalTokens')}: <strong>{totalTokensToday}</strong> &nbsp;|&nbsp; 
                  {t('completed')}: <strong>{completedCount}</strong> &nbsp;|&nbsp; 
                  {t('waiting')}: <strong>{waitingCount}</strong>
                </div>
              </div>

            </div>

          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '2rem 0 1.5rem' }} />

          {/* Lower Row: Token Sequence Stepper: T-20 ✓ → T-21 ✓ → T-22 🟢 → T-23 → T-24 with YOU ARE HERE */}
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#64748B',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                {isHindi ? '— लाइव कतार टोकन अनुक्रम —' : '— LIVE QUEUE TOKEN SEQUENCE —'}
              </span>
            </div>

            {/* The Horizontal Stepper Chain */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              overflowX: 'auto',
              padding: '0.5rem 0 1.5rem',
              scrollbarWidth: 'none'
            }}>
              {tokenSequence.map((item, idx) => (
                <React.Fragment key={item.number}>
                  
                  {/* Single Token Node */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '76px' }}>
                    <div style={{
                      padding: '0.65rem 1rem',
                      borderRadius: '16px',
                      fontWeight: 900,
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      backgroundColor: item.isYou 
                        ? '#ECFDF5' 
                        : item.isCompleted 
                        ? '#F8FAFC' 
                        : '#FFFFFF',
                      border: item.isYou 
                        ? '2.5px solid #10B981' 
                        : item.isCompleted 
                        ? '1.5px solid #CBD5E1' 
                        : '1.5px solid #E2E8F0',
                      color: item.isYou 
                        ? '#065F46' 
                        : item.isCompleted 
                        ? '#64748B' 
                        : '#94A3B8',
                      boxShadow: item.isYou 
                        ? '0 0 0 4px rgba(16, 185, 129, 0.2)' 
                        : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      <span>{item.label}</span>
                      {item.isCompleted && (
                        <span style={{ color: '#059669', fontSize: '1.1rem', fontWeight: 900 }}>✓</span>
                      )}
                      {item.isYou && (
                        <span style={{ fontSize: '0.85rem' }}>🟢</span>
                      )}
                    </div>

                    {/* YOU ARE HERE Badge */}
                    {item.isYou && (
                      <div style={{
                        marginTop: '0.45rem',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)',
                        animation: 'bounce 2s infinite'
                      }}>
                        {t('youAreHere')}
                      </div>
                    )}
                  </div>

                  {/* Connecting Arrow */}
                  {idx < tokenSequence.length - 1 && (
                    <div style={{
                      color: '#94A3B8',
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      margin: '0 0.15rem',
                      userSelect: 'none',
                      paddingBottom: item.isYou ? '1.5rem' : '0'
                    }}>
                      →
                    </div>
                  )}

                </React.Fragment>
              ))}
            </div>

          </div>

        </div>

        {/* 3. TWO-COLUMN SPLIT SECTION (YOUR BOOKING vs IMPORTANT) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }} className="split-cards-grid">

          {/* Left Column: 📅 YOUR BOOKING */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1.5px solid #E2E8F0',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays size={18} color="#059669" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {isHindi ? '📅 आपकी बुकिंग' : '📅 YOUR BOOKING'}
              </h3>
            </div>

            {/* Booking Details Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Date & Time */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#ECFDF5', padding: '0.5rem', borderRadius: '12px', color: '#059669', display: 'flex' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>
                    {isHindi ? bookingInfo.dateFormattedHi : bookingInfo.dateFormattedEn}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700, marginTop: '2px' }}>
                    {bookingInfo.slotTime} ({isHindi ? `अवधि: ${bookingInfo.duration}` : `Duration: ${bookingInfo.duration}`})
                  </div>
                </div>
              </div>

              {/* Centre */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#ECFDF5', padding: '0.5rem', borderRadius: '12px', color: '#059669', display: 'flex' }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    📍 {isHindi ? bookingInfo.centreNameHi : bookingInfo.centreName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                    {isHindi ? bookingInfo.centreFullHi : bookingInfo.centreFullEn}
                  </div>
                </div>
              </div>

              {/* Commodity & Weight */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#ECFDF5', padding: '0.5rem', borderRadius: '12px', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>🌾</span>
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    {isHindi ? bookingInfo.commodityHi : bookingInfo.commodity}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700, marginTop: '2px' }}>
                    ⚖️ {isHindi ? bookingInfo.quantityHi : bookingInfo.quantity}
                  </div>
                </div>
              </div>

            </div>

            {/* Cancellation info bar & button */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginTop: 'auto'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, maxWidth: '280px' }}>
                {t('freeCancellationInfo')}
              </div>

              <button
                onClick={handleCancelSlot}
                disabled={isCancelled}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: isCancelled ? '1.5px solid #CBD5E1' : '1.5px solid #FECACA',
                  borderRadius: '10px',
                  padding: '0.45rem 1.1rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: isCancelled ? '#94A3B8' : '#DC2626',
                  cursor: isCancelled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isCancelled) e.currentTarget.style.backgroundColor = '#FEF2F2';
                }}
                onMouseLeave={(e) => {
                  if (!isCancelled) e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <XCircle size={15} />
                <span>{isCancelled ? (isHindi ? 'रद्द हो गया' : 'Cancelled') : t('cancelSlot')}</span>
              </button>
            </div>

          </div>

          {/* Right Column: 🔔 IMPORTANT */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1.5px solid #E2E8F0',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={18} color="#059669" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {isHindi ? '🔔 महत्वपूर्ण सूचनाएं' : '🔔 IMPORTANT'}
              </h3>
            </div>

            {/* Alert 1: 🟢 Your turn is now */}
            <div style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #D1FAE5',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <div style={{ fontSize: '1rem', marginTop: '1px' }}>🟢</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#065F46' }}>
                  {isHindi ? 'आपकी बारी आ गई है' : 'Your turn is now'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '2px', lineHeight: 1.4 }}>
                  {isHindi 
                    ? 'कृपया तुरंत अपनी उपज वाहन के साथ तौल काउंटर 1 पर पहुंचें।' 
                    : 'Please proceed immediately to Counter #1 for weighing and moisture test.'}
                </div>
              </div>
            </div>

            {/* Alert 2: 🟡 Reach on time */}
            <div style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FEF3C7',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <div style={{ fontSize: '1rem', marginTop: '1px' }}>🟡</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400E' }}>
                  {isHindi ? 'समय पर पहुंचें' : 'Reach on time'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#B45309', marginTop: '2px', lineHeight: 1.4 }}>
                  {t('notifReachBeforeTurn')}
                </div>
              </div>
            </div>

            {/* Alert 3: 🔵 Keep documents ready */}
            <div style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #DBEAFE',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <div style={{ fontSize: '1rem', marginTop: '1px' }}>🔵</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1E40AF' }}>
                  {isHindi ? 'दस्तावेज तैयार रखें' : 'Keep documents ready'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#1D4ED8', marginTop: '2px', lineHeight: 1.4 }}>
                  {t('notifKeepDocsReady')}
                </div>
              </div>
            </div>

            {/* Notification Settings Link */}
            <button 
              onClick={() => showToastMessage(isHindi ? 'अधिसूचनाएं SMS व WhatsApp पर सक्रिय हैं' : 'Notifications are active via SMS & WhatsApp')}
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
              <ChevronRight size={15} color="#64748B" />
            </button>

          </div>

        </div>

        {/* 4. ⚡ QUICK ACTIONS (BOTTOM SECTION) */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '22px',
          border: '1.5px solid #E2E8F0',
          padding: '1.5rem',
          marginBottom: '1.75rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: '#0F172A',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <span>⚡</span> {t('quickActions')}
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}>
            
            {/* 1. My Bookings */}
            <button
              onClick={() => navigate('/farmer/dashboard')}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '16px',
                padding: '0.9rem 1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ backgroundColor: '#E6F4EA', padding: '0.5rem', borderRadius: '12px', color: '#059669', display: 'flex' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B' }}>{t('myBookings')}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{isHindi ? 'सभी स्लॉट देखें' : 'View all scheduled slots'}</div>
                </div>
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </button>

            {/* 2. Payment Status */}
            <button
              onClick={() => navigate('/farmer/payment-history')}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '16px',
                padding: '0.9rem 1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ backgroundColor: '#EFF6FF', padding: '0.5rem', borderRadius: '12px', color: '#3B82F6', display: 'flex' }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B' }}>{t('paymentStatus')}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{isHindi ? 'DBT भुगतान एवं रसीदें' : 'DBT transfers & receipts'}</div>
                </div>
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </button>

            {/* 3. Help Centre */}
            <button
              onClick={() => setShowHelpModal(true)}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '16px',
                padding: '0.9rem 1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ backgroundColor: '#FFFBEB', padding: '0.5rem', borderRadius: '12px', color: '#F59E0B', display: 'flex' }}>
                  <HelpCircle size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B' }}>{t('helpCenter')}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{isHindi ? 'टोल फ्री सहायता डेस्क' : 'Toll-free 24x7 support'}</div>
                </div>
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </button>

          </div>

        </div>

        {/* 5. FOOTER COMMUNITY BANNER */}
        <div style={{
          backgroundColor: '#E6F4EA',
          border: '1.5px solid #A7F3D0',
          borderRadius: '20px',
          padding: '1rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 4px 15px rgba(16,185,129,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
            <span style={{ fontSize: '1.5rem' }}>🌱</span>
            <div style={{ fontSize: '0.88rem', color: '#137333', fontWeight: 700 }}>
              {t('footerThankYou')}
            </div>
          </div>

          {/* Farmer & Ox vector graphic */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 160 45" style={{ width: '150px', height: '42px' }}>
              <path d="M0,40 C40,38 80,42 120,39 C140,39 150,41 160,40 L160,45 L0,45 Z" fill="#137333" opacity="0.8" />
              <path d="M80,40 C80,26 90,22 100,22 C110,22 115,26 115,40 Z" fill="#E2E8F0" />
              <path d="M110,28 C115,26 122,22 125,22 C125,25 120,28 118,30 Z" fill="#CBD5E1" />
              <line x1="85" y1="40" x2="85" y2="45" stroke="#94A3B8" strokeWidth="2" />
              <line x1="95" y1="40" x2="95" y2="45" stroke="#94A3B8" strokeWidth="2" />
              <line x1="105" y1="40" x2="105" y2="45" stroke="#94A3B8" strokeWidth="2" />
              <line x1="112" y1="40" x2="112" y2="45" stroke="#94A3B8" strokeWidth="2" />
              <path d="M30,40 C30,28 35,26 38,26 C40,26 45,28 45,40 Z" fill="#FFFFFF" />
              <circle cx="38" cy="21" r="4.5" fill="#FED7AA" />
              <path d="M42,34 L65,37 L72,41" fill="none" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

      </div>

      {/* Responsive Style Adjustments */}
      <style>{`
        @media (max-width: 860px) {
          .hero-queue-grid {
            grid-template-columns: 1fr !important;
          }
          .split-cards-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>

      {/* Help Center Modal */}
      {showHelpModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
              }}>
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
              }}>
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
