import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { mockUser } from '../../data/mockData';
import {
  CalendarPlus, Navigation, Shield, TrendingUp, CreditCard,
  Zap, Star, Clock, CheckCircle, AlertCircle, Wheat, MapPin, ChevronRight
} from 'lucide-react';

const FarmerDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isHindi = i18n.language === 'hi';

  const [selectedBooking, setSelectedBooking] = useState(null);

  const historicalBookings = [
    {
      id: "BK-2026-102",
      date: "2026-08-28",
      crop: "Wheat",
      cropHi: "गेहूं",
      weight: "25 Qtl",
      weightHi: "25 क्विंटल",
      centre: "Bhagwanpur Govt. Procurement Centre",
      centreHi: "भगवानपुर सरकारी खरीद केंद्र",
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
      centre: "Bhagwanpur Govt. Procurement Centre",
      centreHi: "भगवानपुर सरकारी खरीद केंद्र",
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
      centre: "Mohanlalganj Cooperative Centre",
      centreHi: "मोहनलालगंज सहकारी केंद्र",
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
      centre: "Bhagwanpur Govt. Procurement Centre",
      centreHi: "भगवानपुर सरकारी खरीद केंद्र",
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
      centre: "Malihabad PACS Centre",
      centreHi: "मलिहाबाद PACS केंद्र",
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
                {user?.name || mockUser.farmer.name}
              </h1>
              <div style={{ opacity: 0.8, fontSize: '0.82rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} color="#86EFAC" />
                {user?.village || 'Bhagwanpur'} • {user?.district || 'Lucknow'}, UP
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <span className="hero-badge" style={{ background: 'rgba(255,255,255,0.15)', fontSize: '0.8rem' }}>
              ✓ Khasra Verified
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
            <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#15803D' }}>{mockUser.farmer.totalBookings}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Total Bookings</div>
          </div>
          <div style={{ borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>✅</div>
            <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#15803D' }}>{mockUser.farmer.completedBookings}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Completed</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>⭐</div>
            <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#D97706' }}>{mockUser.farmer.trustScore}%</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Trust Score</div>
          </div>
        </div>
      </div>

      {/* Active Token Notification */}
      <div className="container" style={{ marginTop: '1.25rem' }}>
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
              Active Booking Token #42 (Wheat)
            </div>
            <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.1rem' }}>
              Bhagwanpur Procurement Centre • Today 10:00 AM • 25 Qtl
            </div>
          </div>
          <Link to="/farmer/track-slot" className="btn-primary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem', borderRadius: '10px' }}>
            Track Live <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Services Grid */}
      <div className="container" style={{ marginTop: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#14532D' }}>
            🌾 {isHindi ? 'किसान सेवाएं' : 'Farmer Services'}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 700 }}>Quick Portal Access</span>
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
            {historicalBookings.map((booking) => (
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
            ))}
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
