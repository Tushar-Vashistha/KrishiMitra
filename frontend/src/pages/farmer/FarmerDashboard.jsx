import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { farmerService, notificationService, bookingService } from '../../services/api';
import { mockUser } from '../../data/mockData';
import {
  CalendarPlus, Navigation, Shield, TrendingUp, CreditCard,
  Zap, Star, Clock, CheckCircle, AlertCircle, Wheat, MapPin, ChevronRight,
  Bell, CheckCheck, Trash2, X, Sparkles, FileText, UserCheck, XCircle, Activity
} from 'lucide-react';
import {
  getFarmerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications
} from '../../data/notifications';

const FarmerDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isHindi = i18n.language === 'hi';

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const [stats, setStats] = useState({ totalBookings: 0, completedBookings: 0, trustScore: 100 });
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingsHistory, setBookingsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const statsRes = await farmerService.getStatistics();
      if (statsRes.success && statsRes.data) {
        setStats({
          totalBookings: statsRes.data.totalBookings,
          completedBookings: statsRes.data.completedBookings,
          trustScore: statsRes.data.trustScore
        });
      }

      const bookingsRes = await farmerService.getBookings();
      if (bookingsRes.success && bookingsRes.data) {
        const list = bookingsRes.data;
        const active = list.find(b => ['BOOKED', 'ARRIVED', 'CALLED', 'PROCESSING'].includes(b.status));
        setActiveBooking(active);
        
        const mappedHistory = list.map(b => {
          const isDone = b.status === 'COMPURED' || b.status === 'COMPLETED' || b.transaction?.payment?.status === 'SUCCESS';
          return {
            id: b.id,
            date: new Date(b.date).toISOString().split('T')[0],
            crop: b.crop?.name || 'Wheat',
            cropHi: b.crop?.nameHi || 'गेहूं',
            weight: `${b.weight} Qtl`,
            weightHi: `${b.weight} क्विंटल`,
            centre: b.centre?.name || 'Procurement Centre',
            centreHi: b.centre?.nameHi || 'खरीद केंद्र',
            slot: b.slotTime,
            slotHi: b.slotTime,
            status: b.status,
            paymentStatus: isDone ? 'Done' : ['CANCELLED', 'NO_SHOW'].includes(b.status) ? 'Cancelled' : 'Processing',
            paymentStatusHi: isDone ? 'पूर्ण' : ['CANCELLED', 'NO_SHOW'].includes(b.status) ? 'रद्द' : 'प्रक्रिया में है',
            amount: b.transaction?.amount || 0,
            queueToken: b.queueToken
          };
        });
        setBookingsHistory(mappedHistory);
      }

      const notifRes = await notificationService.getMy();
      if (notifRes.success && notifRes.data) {
        const mappedNotifs = notifRes.data.map(n => ({
          id: n.id.toString(),
          title: n.title,
          titleEn: n.title,
          message: n.message,
          messageEn: n.message,
          type: n.type.toLowerCase(),
          read: n.isRead,
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: 'Today',
          timestamp: new Date(n.createdAt).getTime(),
        }));
        setNotifications(mappedNotifs);
      }
    } catch (err) {
      console.error('Failed to load farmer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const updateNotifs = () => {
      loadDashboardData();
    };
    window.addEventListener('storage', updateNotifs);
    window.addEventListener('krishimitra_notification_update', updateNotifs);
    return () => {
      window.removeEventListener('storage', updateNotifs);
      window.removeEventListener('krishimitra_notification_update', updateNotifs);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const latestNotif = notifications[0];

  const historicalBookings = [
    {
      id: "BK-2026-102",
      date: "2026-08-28",
      crop: "Wheat",
      cropHi: "गेहूं",
      weight: "25 Qtl",
      weightHi: "25 क्विंटल",
      centre: "Govt. Procurement Centre",
      centreHi: "सरकारी खरीद केंद्र",
      slot: "10:00 AM - 11:00 AM",
      slotHi: "सुबह 10:00 - 11:00 बजे",
      paymentStatus: "Processing",
      paymentStatusHi: "प्रक्रिया में है",
      amount: 56875
    },
    {
      id: "BK-2026-101",
      date: "2026-08-25",
      crop: "Wheat",
      cropHi: "गेहूं",
      weight: "20 Qtl",
      weightHi: "20 क्विंटल",
      centre: "Govt. Procurement Centre",
      centreHi: "सरकारी खरीद केंद्र",
      slot: "08:00 AM - 09:00 AM",
      slotHi: "सुबह 08:00 - 09:00 बजे",
      paymentStatus: "Done",
      paymentStatusHi: "पूर्ण",
      amount: 45500
    },
    {
      id: "BK-2026-095",
      date: "2026-08-10",
      crop: "Mustard",
      cropHi: "सरसों",
      weight: "15 Qtl",
      weightHi: "15 क्विंटल",
      centre: "Cooperative Centre",
      centreHi: "सहकारी खरीद केंद्र",
      slot: "11:00 AM - 12:00 PM",
      slotHi: "सुबह 11:00 - दोपहर 12:00 बजे",
      paymentStatus: "Done",
      paymentStatusHi: "पूर्ण",
      amount: 84750
    },
    {
      id: "BK-2026-088",
      date: "2026-07-28",
      crop: "Paddy",
      cropHi: "धान / चावल",
      weight: "35 Qtl",
      weightHi: "35 क्विंटल",
      centre: "Govt. Procurement Centre",
      centreHi: "सरकारी खरीद केंद्र",
      slot: "02:00 PM - 03:00 PM",
      slotHi: "दोपहर 02:00 - 03:00 बजे",
      paymentStatus: "Done",
      paymentStatusHi: "पूर्ण",
      amount: 76405
    },
    {
      id: "BK-2026-072",
      date: "2026-07-15",
      crop: "Maize",
      cropHi: "मक्का",
      weight: "10 Qtl",
      weightHi: "10 क्विंटल",
      centre: "PACS Procurement Centre",
      centreHi: "PACS खरीद केंद्र",
      slot: "09:00 AM - 10:00 AM",
      slotHi: "सुबह 09:00 - 10:00 बजे",
      paymentStatus: "Done",
      paymentStatusHi: "पूर्ण",
      amount: 20900
    }
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');

  const cards = [
    {
      label: t('bookSlot'),
      labelHi: 'स्लॉट बुक करें',
      icon: <CalendarPlus size={26} />,
      to: '/farmer/book-slot',
      bg: 'linear-gradient(135deg, #15803D 0%, #22C55E 100%)',
      badge: '8 slots open',
    },
    {
      label: t('trackSlot'),
      labelHi: 'स्लॉट ट्रैक करें',
      icon: <Navigation size={26} />,
      to: '/farmer/track-slot',
      bg: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
      badge: 'Token #42 Active',
    },
    {
      label: t('myTrustScore'),
      labelHi: 'विश्वास स्कोर',
      icon: <Shield size={26} />,
      to: '/farmer/trust-score',
      bg: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
      badge: '100 Verified',
    },
    {
      label: t('mandiRates'),
      labelHi: 'मंडी दर',
      icon: <TrendingUp size={26} />,
      to: '/farmer/mandi-rates',
      bg: 'linear-gradient(135deg, #D97706 0%, #FBBF24 100%)',
      badge: 'Live MSP Rates',
    },
    {
      label: t('paymentHistory'),
      labelHi: 'भुगतान इतिहास',
      icon: <CreditCard size={26} />,
      to: '/farmer/payment-history',
      bg: 'linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%)',
      badge: '₹1.85L Settled',
    },
    {
      label: t('tatkaalbooking'),
      labelHi: 'तत्काल बुकिंग',
      icon: <Zap size={26} />,
      to: '/farmer/tatkaal',
      bg: 'linear-gradient(135deg, #DC2626 0%, #F87171 100%)',
      badge: 'Fast Clearance',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)', paddingBottom: '5rem' }}>

      {/* Hero Profile Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #15803D 100%)',
        padding: '2.5rem 1.5rem 4rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', right: '-50px', top: '-50px', width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 64, height: 64,
              background: 'linear-gradient(135deg, #DCFCE7, #86EFAC)',
              borderRadius: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              fontSize: '2rem',
            }}>👨‍🌾</div>
            <div>
              <div style={{ opacity: 0.85, fontSize: '0.9rem', fontWeight: 600 }}>{greeting}!</div>
              <h1 style={{ fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.2 }}>
                {isHindi ? (user?.nameHi || (user?.name === 'Ramesh Kumar' || !user?.name ? 'रमेश कुमार' : user.name)) : (user?.name || mockUser.farmer.name)}
              </h1>
              <div style={{ opacity: 0.8, fontSize: '0.82rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} color="#86EFAC" />
                {isHindi ? (user?.villageHi || 'भगवानपुर') : (user?.village || 'Bhagwanpur')} • {isHindi ? (user?.districtHi || 'लखनऊ') : (user?.district || 'Lucknow')}, {isHindi ? 'उ.प्र.' : 'UP'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="hero-badge" style={{ background: 'rgba(255,255,255,0.15)', fontSize: '0.8rem' }}>
              {isHindi ? '✓ खसरा सत्यापित' : '✓ Khasra Verified'}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Metrics Header */}
      <div className="container" style={{ marginTop: '-2.5rem', position: 'relative', zIndex: 10 }}>
        <div className="card" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          padding: '1.25rem 1rem',
          textAlign: 'center',
          background: '#FFFFFF',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          boxShadow: '0 12px 30px -10px rgba(21, 128, 61, 0.12)',
        }}>
          <div>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>📋</div>
            <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#15803D' }}>{stats.totalBookings}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{isHindi ? 'कुल बुकिंग' : 'Total Bookings'}</div>
          </div>
          <div style={{ borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>✅</div>
            <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#15803D' }}>{stats.completedBookings}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{isHindi ? 'पूर्ण' : 'Completed'}</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>⭐</div>
            <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#D97706' }}>{stats.trustScore}%</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{isHindi ? 'विश्वास स्कोर' : 'Trust Score'}</div>
          </div>
        </div>
      </div>

      {/* Live Procurement Centre Real-Time Notification Banner */}
      {latestNotif && (
        <div className="container" style={{ marginTop: '1.25rem' }}>
          <div
            onClick={() => setShowNotifModal(true)}
            style={{
              background: latestNotif.type === 'bill' ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : latestNotif.type === 'cancelled' ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' : 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: latestNotif.type === 'bill' ? '1.5px solid #6EE7B7' : latestNotif.type === 'cancelled' ? '1.5px solid #FCA5A5' : '1.5px solid #93C5FD',
              borderRadius: '16px',
              padding: '0.9rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              gap: '0.85rem',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)',
              transition: 'transform 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                background: latestNotif.type === 'bill' ? '#10B981' : latestNotif.type === 'cancelled' ? '#EF4444' : '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0
              }}>
                <Bell size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontWeight: 900,
                    fontSize: '0.92rem',
                    color: latestNotif.type === 'bill' ? '#065F46' : latestNotif.type === 'cancelled' ? '#991B1B' : '#1E40AF'
                  }}>
                    {isHindi ? (latestNotif.title || latestNotif.titleEn) : (latestNotif.titleEn || latestNotif.title)}
                  </span>
                  <span style={{
                    background: 'rgba(255,255,255,0.7)',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '6px',
                    color: '#475569'
                  }}>
                    ⏱️ {latestNotif.time || "Live"}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: latestNotif.type === 'bill' ? '#047857' : latestNotif.type === 'cancelled' ? '#B91C1C' : '#1E3A8A',
                  marginTop: '0.15rem'
                }}>
                  {isHindi ? (latestNotif.message || latestNotif.messageEn) : (latestNotif.messageEn || latestNotif.message)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#047857', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
              <span className="hide-mobile">{isHindi ? 'विवरण देखें' : 'View Updates'}</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      )}

      {/* Active Token Notification */}
      {activeBooking && (
        <div className="container" style={{ marginTop: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            border: '1.5px solid #6EE7B7',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
          }}>
            <div style={{
              width: 44, height: 44, background: '#10B981', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0
            }}>
              <CheckCircle size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#065F46' }}>
                {isHindi ? `सक्रिय बुकिंग टोकन #${activeBooking.queueToken?.tokenNumber || ''} (${activeBooking.crop?.nameHi || activeBooking.crop?.name})` : `Active Booking Token #${activeBooking.queueToken?.tokenNumber || ''} (${activeBooking.crop?.name})`}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.1rem' }}>
                {isHindi ? `${activeBooking.centre?.nameHi || activeBooking.centre?.name} • आज ${activeBooking.slotTime} • ${activeBooking.weight} क्विंटल` : `${activeBooking.centre?.name} • Today ${activeBooking.slotTime} • ${activeBooking.weight} Qtl`}
              </div>
            </div>
            <Link to="/farmer/track-slot" className="btn-primary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem', borderRadius: '10px' }}>
              {isHindi ? 'लाइव ट्रैक करें' : 'Track Live'} <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="container" style={{ marginTop: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#14532D' }}>
            🌾 {isHindi ? 'किसान सेवाएं' : 'Farmer Services'}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 700 }}>{isHindi ? 'त्वरित पोर्टल' : 'Quick Portal Access'}</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
        }}>
          {cards.map((card, i) => (
            <Link
              key={i}
              to={card.to}
              style={{
                background: card.bg,
                borderRadius: '18px',
                padding: '1.25rem',
                textDecoration: 'none',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '130px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '0.5rem', display: 'inline-flex' }}>
                  {card.icon}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '0.75rem', lineHeight: 1.2 }}>
                  {isHindi ? card.labelHi : card.label}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Red Warning Line Notice */}
        <div style={{
          marginTop: '1rem',
          background: '#FEF2F2',
          border: '1.5px solid #F87171',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)'
        }}>
          <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#DC2626', lineHeight: 1.4 }}>
            <span>{isHindi ? '⚠️ आवश्यक सूचना: ' : '⚠️ Important Rule: '}</span>
            <span style={{ color: '#991B1B' }}>
              {isHindi
                ? 'स्लॉट बुकिंग कम से कम 1 दिन पहले होगी (उसी दिन की बुकिंग मान्य नहीं है)। यदि आज ही फसल बेचनी है तो "तत्काल बुकिंग" का प्रयोग करें।'
                : 'Slot booking must be done at least 1 day in advance (Same day booking is not allowed). For emergency selling today, please use "Tatkaal Booking".'}
            </span>
          </div>
        </div>
      </div>

      {/* Booking History Box */}
      <div className="container" style={{ marginTop: '2.5rem' }}>
        <div className="card" style={{
          padding: '1.5rem',
          background: '#FFFFFF',
          border: '1px solid rgba(34, 197, 94, 0.18)',
          boxShadow: '0 12px 30px -10px rgba(16, 185, 129, 0.08), 0 4px 16px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#14532D', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📅</span> {isHindi ? 'बुकिंग इतिहास' : 'Booking History'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              {isHindi ? 'विवरण देखने के लिए क्लिक करें' : 'Click to view details'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {bookingsHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.88rem' }}>
                {isHindi ? 'कोई बुकिंग इतिहास नहीं मिला।' : 'No booking history found.'}
              </div>
            ) : (
              bookingsHistory.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#10B981';
                  e.currentTarget.style.background = '#F0FDF4';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.background = '#F8FAFC';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B' }}>
                      {isHindi ? booking.cropHi : booking.crop}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px' }}>
                      {booking.id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                    📍 {isHindi ? booking.centreHi : booking.centre}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                      {booking.date}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>
                      {isHindi ? booking.slotHi : booking.slot}
                    </div>
                  </div>
                  <ChevronRight size={18} color="#94A3B8" />
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.25rem',
          backdropFilter: 'blur(6px)'
        }}
        onClick={() => setSelectedBooking(null)}
        >
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '2rem 1.75rem',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
          onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#064E3B', margin: 0 }}>
                {isHindi ? 'बुकिंग विवरण' : 'Booking Details'}
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#64748B',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
              >
                ✕
              </button>
            </div>

            {/* Content Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
                  {isHindi ? 'दिनांक' : 'Booking Date'}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>
                  {selectedBooking.date}
                </span>
              </div>

              {/* Crop */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
                  {isHindi ? 'फसल' : 'Crop'}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#15803D' }}>
                  🌾 {isHindi ? selectedBooking.cropHi : selectedBooking.crop}
                </span>
              </div>

              {/* Weight */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
                  {isHindi ? 'वजन' : 'Weight'}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>
                  ⚖️ {isHindi ? selectedBooking.weightHi : selectedBooking.weight}
                </span>
              </div>

              {/* Procurement Centre */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
                  {isHindi ? 'खरीद केंद्र' : 'Procurement Centre'}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', background: '#F8FAFC', padding: '0.75rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  📍 {isHindi ? selectedBooking.centreHi : selectedBooking.centre}
                </span>
              </div>

              {/* Time Slot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
                  {isHindi ? 'समय स्लॉट' : 'Time Slot'}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>
                  🕒 {isHindi ? selectedBooking.slotHi : selectedBooking.slot}
                </span>
              </div>

              {/* Payment Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
                  {isHindi ? 'भुगतान स्थिति' : 'Payment Status'}
                </span>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  color: selectedBooking.paymentStatus === 'Done' ? '#15803D' : selectedBooking.paymentStatus === 'Processing' ? '#0284C7' : '#D97706',
                  background: selectedBooking.paymentStatus === 'Done' ? '#DCFCE7' : selectedBooking.paymentStatus === 'Processing' ? '#E0F2FE' : '#FEF3C7',
                  border: `1px solid ${selectedBooking.paymentStatus === 'Done' ? '#86EFAC' : selectedBooking.paymentStatus === 'Processing' ? '#7DD3FC' : '#FDE68A'}`
                }}>
                  {isHindi ? selectedBooking.paymentStatusHi : selectedBooking.paymentStatus}
                </span>
              </div>

              {/* Amount */}
              {selectedBooking.amount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #E2E8F0', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
                    {isHindi ? 'अनुमानित भुगतान' : 'Estimated Amount'}
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#15803D' }}>
                    ₹{selectedBooking.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* OK Button */}
            <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setSelectedBooking(null)}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                {isHindi ? 'ठीक है' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FARMER NOTIFICATIONS CENTER */}
      {showNotifModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #064E3B 0%, #047857 60%, #0284C7 100%)',
              color: '#FFFFFF',
              padding: '1.4rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem'
                }}>
                  🔔
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>
                    {isHindi ? 'सरकारी खरीद केंद्र सूचनाएं' : 'Procurement Centre Updates'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#A7F3D0' }}>
                    {unreadCount > 0 ? (isHindi ? `${unreadCount} अपठित सूचनाएं` : `${unreadCount} new unread updates`) : (isHindi ? 'सभी सूचनाएं अद्यतन हैं' : 'All notifications up to date')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNotifModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions Header Bar */}
            <div style={{
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              padding: '0.65rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem'
            }}>
              <span style={{ fontWeight: 800, color: '#475569' }}>
                {notifications.length} {isHindi ? 'कुल केंद्र अलर्ट' : 'Total Alerts Received'}
              </span>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    style={{
                      background: '#ECFDF5',
                      border: '1px solid #86EFAC',
                      color: '#047857',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <CheckCheck size={13} />
                    {isHindi ? 'सभी पढ़ा हुआ मार्क करें' : 'Mark all read'}
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <Trash2 size={13} />
                    {isHindi ? 'साफ़ करें' : 'Clear'}
                  </button>
                )}
              </div>
            </div>

            {/* Notifications Content */}
            <div style={{ padding: '0.75rem 1.25rem', maxHeight: '52vh', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                  <CheckCircle2 size={40} color="#10B981" style={{ margin: '0 auto 0.75rem' }} />
                  <h4 style={{ margin: 0, fontWeight: 900, color: '#0F172A' }}>
                    {isHindi ? 'कोई नई सूचना नहीं है' : 'No Notifications'}
                  </h4>
                  <p style={{ fontSize: '0.82rem', margin: '0.35rem 0 0', opacity: 0.8 }}>
                    {isHindi ? 'जब खरीद केंद्र आपकी फसल या स्लॉट की स्थिति बदलेगा, तो सूचना तुरंत यहाँ दिखाई देगी।' : 'When a procurement centre updates your slot, moisture test, or bill, it will appear here in real-time.'}
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isUnread = !notif.read;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.link) {
                          setShowNotifModal(false);
                        }
                      }}
                      style={{
                        background: isUnread ? '#F0FDF4' : '#FFFFFF',
                        border: isUnread ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
                        borderRadius: '16px',
                        padding: '1rem',
                        marginBottom: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: isUnread ? '0 4px 12px rgba(16, 185, 129, 0.1)' : '0 2px 5px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                        {/* Icon */}
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: '12px',
                          background: notif.type === 'bill' ? '#DCFCE7' : notif.type === 'arrived' ? '#E0F2FE' : notif.type === 'processing' ? '#FEF3C7' : notif.type === 'cancelled' ? '#FEE2E2' : '#F1F5F9',
                          color: notif.type === 'bill' ? '#15803D' : notif.type === 'arrived' ? '#0369A1' : notif.type === 'processing' ? '#B45309' : notif.type === 'cancelled' ? '#DC2626' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {notif.type === 'bill' ? <FileText size={18} /> : notif.type === 'arrived' ? <UserCheck size={18} /> : notif.type === 'processing' ? <Activity size={18} /> : notif.type === 'cancelled' ? <XCircle size={18} /> : <Bell size={18} />}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 900, fontSize: '0.92rem', color: '#0F172A' }}>
                              {isHindi ? (notif.title || notif.titleEn) : (notif.titleEn || notif.title)}
                            </span>
                            {isUnread && (
                              <span style={{
                                background: '#10B981',
                                color: '#FFFFFF',
                                fontSize: '0.65rem',
                                fontWeight: 900,
                                padding: '1px 6px',
                                borderRadius: '6px'
                              }}>
                                NEW
                              </span>
                            )}
                          </div>

                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                            {isHindi ? (notif.message || notif.messageEn) : (notif.messageEn || notif.message)}
                          </p>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '0.6rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px dashed #E2E8F0',
                            fontSize: '0.74rem',
                            color: '#64748B'
                          }}>
                            <span>🏛️ {notif.centreName || "Govt. Centre"}</span>
                            <span>⏱️ {notif.time || "Recently"}</span>
                          </div>
                        </div>
                      </div>

                      {notif.link && (
                        <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <Link
                            to={notif.link}
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              setShowNotifModal(false);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              background: '#ECFDF5',
                              color: '#047857',
                              padding: '0.35rem 0.85rem',
                              borderRadius: '8px',
                              fontWeight: 800,
                              fontSize: '0.76rem',
                              textDecoration: 'none',
                              border: '1px solid #A7F3D0'
                            }}
                          >
                            <span>{notif.type === 'bill' ? (isHindi ? 'रसीद व भुगतान देखें' : 'View Receipt & DBT') : (isHindi ? 'लाइव स्थिति ट्रैक करें' : 'Track Status')}</span>
                            <ChevronRight size={13} />
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.25rem',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Link
                to="/farmer/track-slot"
                onClick={() => setShowNotifModal(false)}
                style={{
                  color: '#047857',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <span>📍 {isHindi ? 'लाइव स्लॉट ट्रैकर' : 'Go to Live Track Slot'}</span>
                <ChevronRight size={14} />
              </Link>

              <button
                onClick={() => setShowNotifModal(false)}
                className="btn-outline"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: 800 }}
              >
                {isHindi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="mobile-bottom-nav" style={{
        justifyContent: 'space-around', alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {[
          { icon: '🏠', label: 'Home', to: '/farmer/dashboard' },
          { icon: '📅', label: 'Book', to: '/farmer/book-slot' },
          { icon: '📍', label: 'Track', to: '/farmer/track-slot' },
          { icon: '💰', label: 'Payment', to: '/farmer/payment-history' },
        ].map((item, i) => (
          <Link key={i} to={item.to} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '0.15rem', textDecoration: 'none', color: '#64748B',
            fontSize: '0.68rem', fontWeight: 700, padding: '0.25rem 0.5rem',
            minHeight: 'unset',
          }}>
            <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default FarmerDashboard;
