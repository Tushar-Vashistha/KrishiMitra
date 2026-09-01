import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { cropService, centreService, tatkaalService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const TatkaalBooking = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  
  const [dbCrops, setDbCrops] = useState([]);
  const [dbCentres, setDbCentres] = useState([]);
  const [slots, setSlots] = useState([]);
  
  const [selectedCropId, setSelectedCropId] = useState('');
  const [selectedCropName, setSelectedCropName] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [quantity, setQuantity] = useState('20');
  const [errorMsg, setErrorMsg] = useState('');
  const [booked, setBooked] = useState(false);
  const [assignedToken, setAssignedToken] = useState('T-09');

  // 1. Fetch crops & centres on load
  useEffect(() => {
    const initData = async () => {
      try {
        const cropsRes = await cropService.getAll();
        if (cropsRes.success && cropsRes.data) {
          setDbCrops(cropsRes.data);
          if (cropsRes.data.length > 0) {
            setSelectedCropId(cropsRes.data[0].id.toString());
            setSelectedCropName(cropsRes.data[0].name);
          }
        }
        
        const centresRes = await centreService.getNearby(26.8467, 80.9462, 100);
        if (centresRes.success && centresRes.data) {
          setDbCentres(centresRes.data);
          if (centresRes.data.length > 0) {
            setSelectedCentre(centresRes.data[0].id.toString());
          }
        }
      } catch (err) {
        console.error('Failed to load crops/centres:', err);
      }
    };
    initData();
  }, []);

  // 2. Fetch Tatkaal slots availability when centre changes (date is always today)
  useEffect(() => {
    if (!selectedCentre || !selectedDate) return;
    const fetchSlots = async () => {
      try {
        const slotsRes = await tatkaalService.getAvailability(selectedCentre, selectedDate);
        if (slotsRes.success && slotsRes.data) {
          setSlots(slotsRes.data);
          if (slotsRes.data.length > 0) {
            setSelectedSlot(slotsRes.data[0].id);
            setSelectedSlotTime(slotsRes.data[0].time);
          } else {
            setSelectedSlot('');
            setSelectedSlotTime('');
          }
        }
      } catch (err) {
        console.error('Failed to load Tatkaal slots:', err);
      }
    };
    fetchSlots();
  }, [selectedCentre, selectedDate]);

  const handleTatkaal = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedSlot) {
      setErrorMsg('Please select a time slot.');
      return;
    }
    try {
      const activeSlotObj = slots.find(s => s.id === selectedSlot);
      const payload = {
        cropId: parseInt(selectedCropId),
        weight: parseFloat(quantity),
        centreId: parseInt(selectedCentre),
        date: selectedDate,
        slotTime: activeSlotObj ? activeSlotObj.time : '14:00 - 15:00',
        vehicleNumber: '',
        vehicleType: '',
      };
      const res = await tatkaalService.create(payload);
      if (res.success && res.data) {
        setAssignedToken(`T-${res.data.queueToken?.tokenNumber || '09'}`);
        setSelectedSlotTime(payload.slotTime);
        setBooked(true);
        setTimeout(() => {
          navigate('/farmer/track-slot');
        }, 2000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to book Tatkaal slot.');
    }
  };

  if (booked) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '480px', width: '100%', background: '#FFFFFF' }}>
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
              ? `आज ${selectedSlotTime || '02:00 PM - 05:00 PM'} की निकासी के लिए प्राथमिकता टोकन #${assignedToken} सौंपा गया।` 
              : `Priority Token #${assignedToken} assigned for today ${selectedSlotTime || '02:00 PM - 05:00 PM'} clearance.`}
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

        {errorMsg && (
          <div style={{
            backgroundColor: '#FEE2E2', border: '1.5px solid #FCA5A5',
            borderRadius: '12px', padding: '0.85rem 1.1rem',
            color: '#DC2626', fontSize: '0.88rem', fontWeight: 600, textAlign: 'center', marginBottom: '1.5rem'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

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
              <select
                value={selectedCentre}
                onChange={(e) => setSelectedCentre(e.target.value)}
                className="input-field"
                style={{ cursor: 'pointer', height: '48px' }}
                required
              >
                {dbCentres.map(c => (
                  <option key={c.id} value={c.id}>
                    {isHindi ? c.nameHi : c.name} ({isHindi ? c.distance.replace('km', 'किमी') : c.distance})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">{isHindi ? 'फसल चुनें' : 'Select Crop'}</label>
              <select
                value={selectedCropId}
                onChange={(e) => {
                  setSelectedCropId(e.target.value);
                  const selectedCrop = dbCrops.find(c => c.id.toString() === e.target.value);
                  if (selectedCrop) setSelectedCropName(selectedCrop.name);
                }}
                className="input-field"
                style={{ cursor: 'pointer', height: '48px' }}
                required
              >
                {dbCrops.map(crop => (
                  <option key={crop.id} value={crop.id}>
                    {isHindi ? (crop.nameHi || crop.name) : crop.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">{isHindi ? 'मात्रा (क्विंटल)' : 'Quantity (Quintals)'}</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field"
                required
                min="1"
                max="100"
                style={{ height: '48px' }}
              />
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="input-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                {isHindi ? 'समय स्लॉट चुनें' : 'Select Time Slot'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                {slots.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1.5rem', color: '#64748B', fontWeight: 600 }}>
                    {isHindi ? 'आज इस केंद्र पर कोई तत्काल स्लॉट उपलब्ध नहीं है।' : 'No Tatkaal slots available today for this centre.'}
                  </div>
                ) : (
                  slots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => { if (slot.available) setSelectedSlot(slot.id); }}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        border: `2px solid ${
                          !slot.available
                            ? '#E2E8F0'
                            : selectedSlot === slot.id ? '#D97706' : '#E2E8F0'
                        }`,
                        background: !slot.available
                          ? '#F1F5F9'
                          : selectedSlot === slot.id ? '#FFFBEB' : '#FFFFFF',
                        cursor: slot.available ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        opacity: slot.available ? 1 : 0.6,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#1E293B', fontSize: '0.92rem' }}>
                        <Clock size={16} color={slot.available ? '#D97706' : '#64748B'} /> {slot.time}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: slot.available ? '#B45309' : '#94A3B8', marginTop: '0.4rem', fontWeight: 700 }}>
                        {slot.available ? `${slot.remainingCount} ${isHindi ? 'खाली हैं' : 'slots left'}` : (isHindi ? 'भरी हुई (Full)' : 'Full')}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.15rem' }}>
                        {isHindi ? `शुल्क: ₹${slot.fee}` : `Fee: ₹${slot.fee}`}
                      </div>
                    </div>
                  ))
                )}
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
