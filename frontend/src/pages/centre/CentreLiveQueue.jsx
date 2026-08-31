import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { mockBookings, mockCounters, mockCancelledSlots } from '../../data/mockData';
import {
  ArrowLeft, Users, CheckCircle2, Clock, Phone, MapPin, Search,
  AlertCircle, XCircle, ArrowUpRight, Filter, RefreshCw, Zap,
  Activity, Play, Check, ShieldAlert, Sparkles, ChevronRight
} from 'lucide-react';

const COUNTER_THEMES = {
  Processing: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', dot: 'bg-emerald-500', label: 'Processing' },
  Verification: { color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', dot: 'bg-amber-500', label: 'Verification' },
  Available: { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', dot: 'bg-slate-400', label: 'Available' },
};

const CentreLiveQueue = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isHindi = i18n.language === 'hi';

  const [activeTab, setActiveTab] = useState('booked'); // 'booked' | 'cancelled' | 'counters'
  const [bookings, setBookings] = useState(mockBookings.centre);
  const [cancelledList, setCancelledList] = useState(mockCancelledSlots);
  const [counters, setCounters] = useState(mockCounters);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCrop, setFilterCrop] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Move booking status to next stage
  const advanceBookingStatus = (id) => {
    setBookings(prev => prev.map(b => {
      if (b.id === id) {
        const nextStatus = b.status === 'Processing' ? 'Verification' : b.status === 'Verification' ? 'Confirmed' : 'Processing';
        return { ...b, status: nextStatus };
      }
      return b;
    }));
    showToast(isHindi ? `टोकन ${id} की स्थिति सफलतापूर्वक अपडेट की गई!` : `Token ${id} status advanced!`);
  };

  // Release a cancelled slot directly to Tatkaal
  const handleReleaseToTatkaal = (cancelledId) => {
    setCancelledList(prev => prev.map(c => {
      if (c.id === cancelledId) {
        return { ...c, releasedToTatkaal: true, tatkaalToken: `TAT-${Math.floor(Math.random() * 800 + 100)}` };
      }
      return c;
    }));
    showToast(isHindi ? 'रद्द स्लॉट को तत्काल पूल में जारी कर दिया गया है!' : 'Slot released to Tatkaal pool!');
  };

  // Call next farmer to counter
  const callNextToCounter = (counterId) => {
    const nextTokenNum = Math.floor(Math.random() * 20) + 50;
    setCounters(prev => prev.map(c => {
      if (c.id === counterId) {
        return { ...c, token: nextTokenNum, farmer: 'Kisan (Called Next)', status: 'Processing' };
      }
      return c;
    }));
    showToast(isHindi ? `काउंटर #${counterId} पर नया टोकन #${nextTokenNum} बुलाया गया!` : `Token #${nextTokenNum} called to Counter #${counterId}`);
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.mobile.includes(searchQuery);
    const matchesCrop = filterCrop === 'all' ? true : b.crop.toLowerCase() === filterCrop.toLowerCase();
    return matchesSearch && matchesCrop;
  });

  const filteredCancelled = cancelledList.filter(c => {
    return c.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.reason.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)', paddingBottom: '4rem' }}>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#064E3B',
          color: '#FFFFFF',
          padding: '0.85rem 1.75rem',
          borderRadius: '14px',
          boxShadow: '0 20px 35px -10px rgba(6, 78, 59, 0.4)',
          zIndex: 9999,
          fontSize: '0.9rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          border: '1px solid #34D399'
        }}>
          <CheckCircle2 size={20} color="#34D399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div style={{
        background: 'linear-gradient(135deg, #064E3B 0%, #065F46 45%, #047857 80%, #059669 100%)',
        padding: '2.25rem 1.5rem 3.5rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container" style={{ maxWidth: '1100px' }}>
          <button
            onClick={() => navigate('/centre/dashboard')}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '12px',
              padding: '0.45rem 0.9rem',
              color: 'white',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '1.25rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            <ArrowLeft size={16} /> {isHindi ? 'डैशबोर्ड पर वापस' : 'Back to Dashboard'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="hero-badge" style={{ background: 'rgba(255,255,255,0.18)', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                <Activity size={13} color="#86EFAC" />
                {isHindi ? 'लाइव कतार प्रबंधन' : 'LIVE OPERATIONAL QUEUE'}
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                {isHindi ? 'लाइव किसान कतार और रद्द स्लॉट' : 'Live Farmer Queue & Cancelled Slots'}
              </h1>
              <p style={{ opacity: 0.85, fontSize: '0.88rem', marginTop: '0.3rem', maxWidth: '650px' }}>
                {isHindi
                  ? 'बुक किए गए किसानों के विवरण देखें, वजन व गुणवत्ता जांच प्रबंधित करें और रद्द किए गए स्लॉट ट्रैक करें।'
                  : 'Monitor verified farmer bookings, live counter serving tokens, and cancelled slots with Tatkaal re-allocation.'}
              </p>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '14px',
                padding: '0.65rem 1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>
                  {isHindi ? 'सक्रिय कतार' : 'In Queue'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                  {bookings.length}
                </div>
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(248, 113, 113, 0.4)',
                borderRadius: '14px',
                padding: '0.65rem 1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#FECACA', textTransform: 'uppercase', fontWeight: 700 }}>
                  {isHindi ? 'रद्द स्लॉट' : 'Cancelled'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#FECACA' }}>
                  {cancelledList.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1100px', marginTop: '-2rem', position: 'relative', zIndex: 10 }}>

        {/* Live Counters Overview Card */}
        <div className="card" style={{ marginBottom: '1.5rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#064E3B', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                {isHindi ? 'लाइव कांटा व परीक्षण काउंटर' : 'Active Intake & Weighbridge Counters'}
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              {isHindi ? 'क्लिक करके अगला टोकन कॉल करें' : 'Click Call Next to pull next farmer token'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {counters.map((c) => {
              const theme = COUNTER_THEMES[c.status];
              return (
                <div
                  key={c.id}
                  style={{
                    padding: '1.1rem',
                    background: c.status === 'Processing' ? '#F0FDF4' : '#F8FAFC',
                    border: `1.5px solid ${theme.border}`,
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#334155' }}>Counter #{c.id}</span>
                      <span style={{
                        background: theme.bg, color: theme.color, border: `1px solid ${theme.border}`,
                        padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800
                      }}>
                        {theme.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                      {isHindi ? 'वर्तमान टोकन' : 'Serving Token'}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.6rem', color: c.token ? '#0F172A' : '#94A3B8', fontFamily: "'Outfit', monospace", marginTop: '1px' }}>
                      {c.token ? `#TK-${c.token}` : '— Idle —'}
                    </div>
                    {c.farmer && (
                      <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, marginTop: '0.3rem' }}>
                        👨‍🌾 {c.farmer}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => callNextToCounter(c.id)}
                    style={{
                      marginTop: '0.85rem',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#059669',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.background = '#ECFDF5'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#FFFFFF'; }}
                  >
                    <Play size={12} /> {isHindi ? 'अगला टोकन बुलाएं' : 'Call Next Token'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs Switcher: Booked Farmers Queue vs. Cancelled Slots Log */}
        <div className="card" style={{ padding: '1.75rem', borderRadius: '22px' }}>
          
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem',
            borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem'
          }}>
            {/* Segmented Tab buttons */}
            <div style={{
              display: 'inline-flex', background: '#F1F5F9', padding: '4px',
              borderRadius: '14px', border: '1px solid #E2E8F0'
            }}>
              <button
                onClick={() => setActiveTab('booked')}
                style={{
                  background: activeTab === 'booked' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'booked' ? '#065F46' : '#64748B',
                  boxShadow: activeTab === 'booked' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  border: 'none', borderRadius: '10px', padding: '0.5rem 1.25rem',
                  fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <Users size={16} />
                <span>{isHindi ? `बुक किए गए किसान (${bookings.length})` : `Booked Farmers Queue (${bookings.length})`}</span>
              </button>

              <button
                onClick={() => setActiveTab('cancelled')}
                style={{
                  background: activeTab === 'cancelled' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'cancelled' ? '#DC2626' : '#64748B',
                  boxShadow: activeTab === 'cancelled' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  border: 'none', borderRadius: '10px', padding: '0.5rem 1.25rem',
                  fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <XCircle size={16} />
                <span>{isHindi ? `रद्द किए गए स्लॉट (${cancelledList.length})` : `Cancelled Slots Log (${cancelledList.length})`}</span>
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isHindi ? "किसान, फसल या टोकन खोजें..." : "Search farmer, token, reason..."}
                style={{
                  paddingLeft: '2.4rem', paddingRight: '0.75rem', height: '40px',
                  fontSize: '0.85rem', borderRadius: '10px', border: '1.5px solid #CBD5E1',
                  width: '100%', outline: 'none', background: '#F8FAFC'
                }}
              />
            </div>
          </div>

          {/* TAB 1: Booked Farmers Queue */}
          {activeTab === 'booked' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {filteredBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                  <AlertCircle size={36} color="#94A3B8" style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B' }}>
                    {isHindi ? 'कोई बुकिंग नहीं मिली' : 'No active queue bookings found'}
                  </div>
                </div>
              ) : (
                filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      padding: '1.2rem',
                      background: '#F8FAFC',
                      borderRadius: '16px',
                      border: '1.5px solid #E2E8F0',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: '14px',
                        background: 'linear-gradient(135deg, #ECFDF5, #A7F3D0)',
                        border: '1px solid #6EE7B7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, color: '#047857', fontSize: '1.15rem',
                        flexShrink: 0
                      }}>
                        {b.farmer?.[0] || '👨‍🌾'}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
                            {b.farmer}
                          </span>
                          <span style={{
                            background: '#F1F5F9', color: '#475569', padding: '2px 8px',
                            borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, fontFamily: 'monospace'
                          }}>
                            {b.id}
                          </span>
                          <span style={{
                            background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE',
                            padding: '2px 9px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800
                          }}>
                            🌾 {b.crop} • {b.weight} Qtl
                          </span>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={13} color="#94A3B8" /> Slot: {b.slot}
                          </span>
                          <span>•</span>
                          <a
                            href={`tel:${b.mobile}`}
                            style={{
                              color: '#059669', textDecoration: 'none', fontWeight: 700,
                              display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                            }}
                          >
                            <Phone size={13} /> {b.mobile}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        background: b.status === 'Processing' ? '#ECFDF5' : b.status === 'Verification' ? '#FEF3C7' : '#EFF6FF',
                        color: b.status === 'Processing' ? '#059669' : b.status === 'Verification' ? '#D97706' : '#1D4ED8',
                        border: `1px solid ${b.status === 'Processing' ? '#A7F3D0' : b.status === 'Verification' ? '#FDE68A' : '#BFDBFE'}`,
                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800
                      }}>
                        ● {b.status}
                      </span>

                      <button
                        onClick={() => advanceBookingStatus(b.id)}
                        className="btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '10px' }}
                      >
                        {isHindi ? 'स्थिति आगे बढ़ाएं' : 'Advance Stage'} <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Cancelled Slots Log */}
          {activeTab === 'cancelled' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '14px',
                padding: '0.85rem 1.1rem',
                color: '#991B1B',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <ShieldAlert size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                <span>
                  {isHindi
                    ? 'नीति: रद्द किए गए स्लॉट स्वतः तत्काल (Tatkaal) स्लॉट में परिवर्तित हो जाते हैं और आपातकालीन/देरी से आने वाले किसानों को आवंटित किए जा सकते हैं।'
                    : 'Policy: Cancelled slots can be released into the emergency Tatkaal pool for late arrivals or blacklisted farmers (daily quota limit applies).'}
                </span>
              </div>

              {filteredCancelled.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                  <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B' }}>
                    {isHindi ? 'कोई रद्द स्लॉट रिकॉर्ड नहीं मिला' : 'No cancelled slot records'}
                  </div>
                </div>
              ) : (
                filteredCancelled.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      padding: '1.2rem',
                      background: '#FFF5F5',
                      borderRadius: '16px',
                      border: '1.5px solid #FECDD3',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: '14px',
                        background: '#FEE2E2',
                        border: '1px solid #FCA5A5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, color: '#DC2626', fontSize: '1.15rem',
                        flexShrink: 0
                      }}>
                        ✕
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
                            {isHindi ? c.farmerHi : c.farmer}
                          </span>
                          <span style={{
                            background: '#FEE2E2', color: '#991B1B', padding: '2px 8px',
                            borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, fontFamily: 'monospace'
                          }}>
                            {c.id}
                          </span>
                          <span style={{
                            background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1',
                            padding: '2px 9px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800
                          }}>
                            🌾 {isHindi ? c.cropHi : c.crop} • {c.weight} Qtl
                          </span>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.35rem' }}>
                          <strong>{isHindi ? 'रद्द करने का कारण:' : 'Reason:'}</strong> {isHindi ? c.reasonHi : c.reason} • 
                          <span style={{ color: '#991B1B', fontWeight: 700, marginLeft: '4px' }}>{c.trustScorePenalty}</span>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                          {isHindi ? 'मूल स्लॉट:' : 'Original Slot:'} {c.slot} • {isHindi ? 'रद्द समय:' : 'Cancelled at:'} {c.cancelledAt}
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div>
                      {c.releasedToTatkaal ? (
                        <span style={{
                          background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A',
                          padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800,
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                        }}>
                          <Zap size={14} color="#D97706" />
                          <span>{isHindi ? `तत्काल टोकन #${c.tatkaalToken} जारी` : `Released as #${c.tatkaalToken}`}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleReleaseToTatkaal(c.id)}
                          style={{
                            background: '#DC2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '0.5rem 1.1rem',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                          }}
                        >
                          <Zap size={14} />
                          <span>{isHindi ? 'तत्काल स्लॉट में जारी करें' : 'Release to Tatkaal'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default CentreLiveQueue;
