import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { mockCentres } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

const TIME_SLOTS = [
  { id: '1', time: '07:00 AM - 10:00 AM', slots: 1 },
  { id: '2', time: '10:00 AM - 01:00 PM', slots: 0 },
  { id: '3', time: '02:00 PM - 05:00 PM', slots: 3 },
  { id: '4', time: '05:00 PM - 08:00 PM', slots: 2 },
];

const TatkaalBooking = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const [reason, setReason] = useState('Available Slot');
  const [selectedSlot, setSelectedSlot] = useState('3');
  const [booked, setBooked] = useState(false);

  const handleTatkaal = (e) => {
    e.preventDefault();
    setBooked(true);
    setTimeout(() => {
      navigate('/farmer/track-slot');
    }, 2000);
  };

  if (booked) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '480px', width: '100%' }}>
          <div style={{
            width: 80, height: 80, background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem', boxShadow: '0 10px 25px rgba(245,158,11,0.3)'
          }}>
            <Zap size={44} color="#D97706" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#92400E', marginBottom: '0.5rem' }}>
            {isHindi ? 'तत्काल आपातकालीन टोकन स्वीकृत! ⚡' : 'Tatkaal Emergency Token Approved! ⚡'}
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {isHindi 
              ? `आज ${TIME_SLOTS.find(s => s.id === selectedSlot)?.time || '02:00 PM - 05:00 PM'} की निकासी के लिए प्राथमिकता टोकन #T-09 सौंपा गया।` 
              : `Priority Token #T-09 assigned for today ${TIME_SLOTS.find(s => s.id === selectedSlot)?.time || '02:00 PM - 05:00 PM'} clearance.`}
          </p>
          <div className="badge-yellow" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
            {isHindi ? 'लाइव ट्रैकिंग पर रीडायरेक्ट किया जा रहा है...' : 'Redirecting to live tracking...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FFFBEB 0%, #F8FAFC 100%)', paddingBottom: '4rem' }}>

      <div className="container" style={{ marginTop: '2rem', maxWidth: '1100px' }}>

        {/* Modern Header Title */}
        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
          <span style={{ 
            background: 'rgba(217, 119, 6, 0.12)', 
            color: '#B45309', 
            padding: '4px 12px', 
            borderRadius: '20px', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            display: 'inline-block',
            marginBottom: '0.5rem'
          }}>
            {isHindi ? '⚡ आपातकालीन खरीद' : '⚡ EMERGENCY PROCUREMENT'}
          </span>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 900, 
            color: '#78350F',
            margin: '0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '-0.03em',
            lineHeight: 1.15
          }}>
            {isHindi ? 'तत्काल प्राथमिकता स्लॉट बुकिंग' : 'Tatkaal Priority Slot Booking'}
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.95rem', marginTop: '0.5rem', marginBlockEnd: 0, lineHeight: 1.45 }}>
            {isHindi 
              ? 'बारिश के जोखिम, कीट प्रकोप, या त्वरित परिवहन उपलब्धता के लिए उसी दिन आपातकालीन स्लॉट आवंटन।' 
              : 'Same-day emergency slot allocation for rain risk, pest outbreak, or quick transport availability.'}
          </p>
        </div>

        <div className="card" style={{ border: '1.5px solid #FCD34D', padding: '2.5rem 2.25rem' }}>
          <form onSubmit={handleTatkaal} style={{ display: 'grid', gap: '1.5rem' }}>

            {/* Visible red rule text */}
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FECACA',
              borderRadius: '12px',
              padding: '0.85rem 1.1rem',
              color: '#DC2626',
              fontSize: '0.88rem',
              fontWeight: 600,
              lineHeight: 1.6,
            }}>
              ⚠️ {isHindi
                ? 'यदि कोई किसान अपने निर्धारित समय पर नहीं पहुंचता है और उसका स्लॉट खरीद केंद्र द्वारा रद्द कर दिया जाता है, तो वह स्लॉट तत्काल बुकिंग के लिए उपलब्ध हो जाएगा।'
                : 'If a farmer does not arrive on time and their slot is cancelled by the procurement centre, that slot will become available for Tatkaal booking.'}
            </div>

            <div>
              <label className="input-label">{isHindi ? 'खरीद केंद्र' : 'Procurement Centre'}</label>
              <select className="input-field" style={{ cursor: 'pointer', height: '48px' }}>
                {mockCentres.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.distance})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">{isHindi ? 'मात्रा (क्विंटल)' : 'Quantity (Quintals)'}</label>
              <input type="number" defaultValue="20" className="input-field" required min="1" max="100" style={{ height: '48px' }} />
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="input-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                {isHindi ? 'समय स्लॉट चुनें' : 'Select Time Slot'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    style={{
                      padding: '1rem',
                      borderRadius: '14px',
                      border: `2px solid ${selectedSlot === slot.id ? '#D97706' : '#E2E8F0'}`,
                      background: selectedSlot === slot.id ? '#FFFBEB' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#1E293B', fontSize: '0.92rem' }}>
                      <Clock size={16} color="#D97706" /> {slot.time}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.4rem' }}>
                      {slot.slots} {isHindi ? 'टोकन स्लॉट खाली हैं' : 'token slots left'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-gold" style={{ padding: '1rem', fontSize: '1.1rem', borderRadius: '14px', marginTop: '0.5rem' }}>
              {isHindi ? 'तत्काल स्लॉट बुक करें' : 'Book Immediate Tatkaal Slot'} <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
      <style>{`
        .card-info-tooltip-container:hover .card-info-tooltip,
        .card-info-tooltip-container:focus-within .card-info-tooltip {
          visibility: visible !important;
          opacity: 1 !important;
        }
        .card-info-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: #ef4444 transparent transparent transparent;
        }
      `}</style>
    </div>
  );
};

export default TatkaalBooking;
