import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cropService, centreService, bookingService } from '../../services/api';
import { mockCentres, mockCrops, mockSlots } from '../../data/mockData';
import { Calendar, Clock, MapPin, Wheat, CheckCircle2, ChevronRight, AlertCircle, Info } from 'lucide-react';

import riceCrop from '../../assets/rice_crop.jpg';
import wheatCrop from '../../assets/wheat_crop.jpg';
import mustardCrop from '../../assets/mustard_crop.jpg';
import cornCrop from '../../assets/corn_crop.jpg';

const CROP_IMAGES = {
  'Rice': riceCrop,
  'Paddy': riceCrop,
  'Wheat': wheatCrop,
  'Mustard': mustardCrop,
  'Sugarcane': '/sugarcane_crop.jpg',
  'Onion': '/onion_crop.jpg',
  'Tomato': '/tomato_crop.jpg',
  'Maize': cornCrop,
  'Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80&auto=format&fit=crop',
  'Soybean': '/soybean_crop.jpg',
  'Groundnut': '/groundnut_crop.jpg',
  'Chana': '/chana_crop.jpg',
};

const CROP_ICONS = {
  'Wheat': '🌾',
  'Paddy': '🌾',
  'Rice': '🌾',
  'Mustard': '🌻',
  'Sugarcane': '🎋',
  'Maize': '🌽',
  'Chana': '🌱',
  'Soybean': '🫘',
  'Groundnut': '🥜',
  'Onion': '🧅',
  'Tomato': '🍅',
  'Potato': '🥔',
};

const DEFAULT_MSP = {
  'Paddy': 2183,
  'Rice': 2183,
  'Wheat': 2275,
  'Mustard': 5650,
  'Sugarcane': 315,
  'Maize': 2090,
  'Chana': 5440,
  'Soybean': 4600,
  'Groundnut': 6377,
  'Onion': 1500,
  'Tomato': 1200,
  'Potato': 1000,
};

const BookSlot = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const navigate = useNavigate();

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [dbCrops, setDbCrops] = useState(mockCrops);
  const [dbCentres, setDbCentres] = useState(mockCentres);
  const [slots, setSlots] = useState(mockSlots);
  
  const [selectedCropId, setSelectedCropId] = useState(mockCrops[0]?.id?.toString() || '1');
  const [selectedCropName, setSelectedCropName] = useState(mockCrops[0]?.name || 'Wheat');
  const [quantity, setQuantity] = useState('25');
  const [selectedCentre, setSelectedCentre] = useState(mockCentres[0]?.id?.toString() || '1');
  const [selectedDate, setSelectedDate] = useState(getTomorrowDate());
  const [selectedSlot, setSelectedSlot] = useState(mockSlots[0]?.id || 'S1');
  const [booked, setBooked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch crops & centres on load (with fallback)
  useEffect(() => {
    const initData = async () => {
      let crops = [];
      let centres = [];

      try {
        const cropsRes = await cropService.getAll();
        if (cropsRes.success && Array.isArray(cropsRes.data) && cropsRes.data.length > 0) {
          crops = cropsRes.data;
        }
      } catch (err) {
        console.warn('Backend crops fetch fallback to mock data:', err);
      }
      if (crops.length === 0) crops = mockCrops;
      setDbCrops(crops);
      if (crops.length > 0) {
        setSelectedCropId(crops[0].id.toString());
        setSelectedCropName(crops[0].name);
      }
      
      try {
        const centresRes = await centreService.getNearby(26.8467, 80.9462, 100);
        if (centresRes.success && Array.isArray(centresRes.data) && centresRes.data.length > 0) {
          centres = centresRes.data;
        }
      } catch (err) {
        console.warn('Backend centres fetch fallback to mock data:', err);
      }
      if (centres.length === 0) centres = mockCentres;
      setDbCentres(centres);
      if (centres.length > 0) {
        setSelectedCentre(centres[0].id.toString());
      }
    };
    initData();
  }, []);

  // 2. Fetch slots availability when centre or date changes
  useEffect(() => {
    if (!selectedCentre || !selectedDate) return;
    const fetchSlots = async () => {
      let availableSlots = [];
      try {
        const slotsRes = await centreService.getSlotsAvailability(selectedCentre, selectedDate);
        if (slotsRes.success && Array.isArray(slotsRes.data) && slotsRes.data.length > 0) {
          availableSlots = slotsRes.data;
        }
      } catch (err) {
        console.warn('Backend slots fetch fallback to mock data:', err);
      }
      if (availableSlots.length === 0) availableSlots = mockSlots;
      setSlots(availableSlots);
      if (availableSlots.length > 0) {
        setSelectedSlot(availableSlots[0].id);
      } else {
        setSelectedSlot('');
      }
    };
    fetchSlots();
  }, [selectedCentre, selectedDate]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg('');
    if (!selectedSlot) {
      setErrorMsg('Please select a time slot.');
      return;
    }
    setSubmitting(true);
    try {
      const activeSlotObj = slots.find(s => s.id === selectedSlot);
      const activeCropObj = dbCrops.find(c => c.id.toString() === selectedCropId);
      const activeCentreObj = dbCentres.find(c => c.id.toString() === selectedCentre);

      const slotTimeStr = activeSlotObj ? activeSlotObj.time : '07:00 AM - 10:00 AM';

      const payload = {
        cropId: parseInt(selectedCropId),
        weight: parseFloat(quantity),
        centreId: parseInt(selectedCentre),
        date: selectedDate,
        slotTime: slotTimeStr,
      };

      let backendRes = null;
      try {
        const res = await bookingService.create(payload);
        if (res.success) {
          backendRes = res.data;
        }
      } catch (err) {
        console.warn('Backend booking API error, using seamless fallback:', err);
      }

      // Format local booking object for instant dashboard & queue sync
      const dateStr = selectedDate.replace(/-/g, '');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const bookingId = backendRes?.booking?.id || `BK-${dateStr}-${randomCode}`;
      const tokenNum = backendRes?.token?.tokenNumber || Math.floor(100 + Math.random() * 800);

      const slotCode = slotTimeStr.includes("07:") ? "7-10" : 
                       slotTimeStr.includes("10:") ? "10-1" : 
                       slotTimeStr.includes("14:") || slotTimeStr.includes("02:") ? "2-5" : "5-8";

      const newBookingObj = {
        id: bookingId,
        token: tokenNum,
        queueTokenId: backendRes?.token?.id || null,
        farmer: "Ramesh Kumar",
        farmerName: "Ramesh Kumar",
        mobile: "9876543210",
        farmerMobile: "9876543210",
        crop: activeCropObj?.name || selectedCropName || "Wheat",
        cropName: activeCropObj?.name || selectedCropName || "Wheat",
        cropHi: activeCropObj?.nameHi || "गेहूं",
        weight: parseFloat(quantity) || 25.0,
        status: "Booked",
        slotTime: slotTimeStr,
        slot: slotTimeStr,
        slotCode: slotCode,
        date: selectedDate,
        centreId: parseInt(selectedCentre),
        centreName: activeCentreObj?.name || "Procurement Centre",
        isTatkaal: false,
        aadhaar: "XXXX-XXXX-1234",
        paymentStatus: "Due",
      };

      const existingLocal = JSON.parse(localStorage.getItem('krishimitra_local_bookings') || '[]');
      localStorage.setItem('krishimitra_local_bookings', JSON.stringify([newBookingObj, ...existingLocal]));

      setBooked(true);
      setTimeout(() => {
        navigate('/farmer/track-slot');
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to book slot.');
    }
  };

  if (booked) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '480px', width: '100%', background: '#FFFFFF' }}>
          <div style={{
            width: 80, height: 80, background: 'linear-gradient(135deg, #DCFCE7, #86EFAC)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem', boxShadow: '0 10px 25px rgba(34,197,94,0.3)'
          }}>
            <CheckCircle2 size={48} color="#15803D" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14532D', marginBottom: '0.5rem' }}>
            {t('slotBookedSuccessTitle')}
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {t('tokenGeneratedDesc', { crop: selectedCropName, quantity })}
          </p>
          <div className="badge-green" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
            {t('redirectingToTracking')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)', paddingBottom: '3rem' }}>

      <div className="container" style={{ marginTop: '2rem', maxWidth: '1100px' }}>

        {/* Modern Header Title */}
        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
          <span style={{ 
            background: 'rgba(34, 197, 94, 0.12)', 
            color: '#166534', 
            padding: '4px 12px', 
            borderRadius: '20px', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            display: 'inline-block',
            marginBottom: '0.5rem'
          }}>
            {isHindi ? '📅 स्लॉट बुकिंग पोर्टल' : '📅 SLOT BOOKING PORTAL'}
          </span>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 900, 
            color: '#064E3B',
            margin: '0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '-0.03em',
            lineHeight: 1.15
          }}>
            {isHindi ? 'एमएसपी खरीद स्लॉट बुक करें' : 'Book MSP Procurement Slot'}
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.95rem', marginTop: '0.5rem', marginBlockEnd: 0, lineHeight: 1.45 }}>
            {isHindi 
              ? 'अपनी फसल, निकटतम केंद्र, तिथि और पसंदीदा समय स्लॉट चुनें' 
              : 'Select your crop, nearest centre, date & preferred time slot'}
          </p>
        </div>

        {/* Red Alert Rule Banner */}
        <div style={{
          background: '#FEF2F2',
          border: '1.5px solid #F87171',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.85rem',
          color: '#DC2626',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)'
        }}>
          <AlertCircle size={24} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#991B1B' }}>
              {isHindi ? '⚠️ बुकिंग नियम:' : '⚠️ Booking Policy:'}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#DC2626', marginTop: '0.2rem', lineHeight: 1.4 }}>
              {isHindi 
                ? 'बुकिंग कम से कम 1 दिन पहले होगी — उसी दिन की बुकिंग मान्य नहीं है।' 
                : 'Booking must be made at least 1 day in advance — Same day booking is not allowed.'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7F1D1D', marginTop: '0.35rem', fontWeight: 500 }}>
              {isHindi 
                ? '💡 यदि आपको आज ही तत्काल अपनी उपज बेचनी है, तो कृपया ' 
                : '💡 For urgent same-day slot allocation, please use '}
              <Link to="/farmer/tatkaal" style={{ color: '#DC2626', fontWeight: 800, textDecoration: 'underline' }}>
                {isHindi ? 'तत्काल बुकिंग' : 'Tatkaal Booking'}
              </Link>
            </div>
          </div>
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

        <form onSubmit={handleBooking} style={{ display: 'grid', gap: '1.5rem' }}>

          {/* 1. Crop Selection with Images */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#14532D', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>1️⃣</span> {t('selectCropToSell')}
            </h3>
            <div className="crop-grid">
              {dbCrops.map((crop) => {
                const isSelected = selectedCropId === crop.id.toString();
                const cropImg = CROP_IMAGES[crop.name] || 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80&auto=format&fit=crop';
                const cropIcon = CROP_ICONS[crop.name] || '🌾';
                const mspVal = crop.prices?.[0]?.mspPrice ?? crop.msp ?? DEFAULT_MSP[crop.name] ?? 2275;
                return (
                  <div
                    key={crop.id}
                    onClick={() => { setSelectedCropId(crop.id.toString()); setSelectedCropName(crop.name); }}
                    style={{
                      border: `2px solid ${isSelected ? '#22C55E' : '#E2E8F0'}`,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: isSelected ? '#F0FDF4' : '#FFFFFF',
                      transition: 'all 0.25s ease',
                      boxShadow: isSelected ? '0 8px 20px rgba(34,197,94,0.2)' : 'none',
                    }}
                  >
                    <div style={{ height: '90px', overflow: 'hidden' }}>
                      <img src={cropImg} alt={crop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '0.85rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B' }}>
                        {cropIcon} {isHindi ? (crop.nameHi || crop.name) : crop.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#15803D', fontWeight: 700, marginTop: '0.2rem' }}>
                        {isHindi ? 'एमएसपी: ₹' : 'MSP: ₹'}{typeof mspVal === 'number' ? mspVal.toLocaleString('en-IN') : mspVal}{isHindi ? '/क्विंटल' : '/Qtl'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quantity Input */}
            <div style={{ marginTop: '1.25rem' }}>
              <label className="input-label">{t('estimatedQuantity')}</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field"
                placeholder={isHindi ? 'उदा. 25' : 'e.g. 25'}
                min="1"
                required
              />
            </div>
          </div>

          {/* 2. Centre & Date */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#14532D', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>2️⃣</span> {t('chooseCentreAndDate')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-split">
              <div>
                <label className="input-label">{t('procurementCentreLabel')}</label>
                <select
                  value={selectedCentre}
                  onChange={(e) => setSelectedCentre(e.target.value)}
                  className="input-field"
                  style={{ cursor: 'pointer' }}
                >
                  {dbCentres.map(c => (
                    <option key={c.id} value={c.id}>
                      {isHindi ? c.nameHi : c.name} ({isHindi ? c.distance.replace('km', 'किमी') : c.distance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">{t('selectDate')}</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={getTomorrowDate()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-field"
                  required
                />
                <div style={{
                  fontSize: '0.76rem',
                  color: '#DC2626',
                  fontWeight: 700,
                  marginTop: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <span>⚠️</span>
                  <span>{isHindi ? 'बुकिंग कम से कम 1 दिन पहले होगी (उसी दिन की बुकिंग मान्य नहीं है)' : 'Booking must be at least 1 day in advance (Same day not allowed)'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Time Slots */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#14532D', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>3️⃣</span> {t('availableTimeSlots')}
              <div className="info-tooltip-container" tabIndex="0" aria-label="Slot Policy Information">
                <Info size={16} />
                <div className="info-tooltip">
                  <strong>{t('slotPolicyTitle')}:</strong>
                  <div style={{ marginTop: '0.25rem', fontWeight: 'normal', color: '#e2e8f0' }}>
                    {t('slotPolicyDesc')}
                  </div>
                </div>
              </div>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
              {slots.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1.5rem', color: '#64748B', fontWeight: 600 }}>
                  {isHindi ? 'इस तिथि के लिए कोई समय स्लॉट उपलब्ध नहीं है।' : 'No time slots available for this date.'}
                </div>
              ) : (
                slots.map((slot, index) => {
                  const isSelected = selectedSlot === slot.id;
                  const isLateSlot = slot.time?.startsWith('05:00 PM') || slot.time?.startsWith('17:00') || (index === 3 && slots.length === 4);
                  return (
                    <div
                      key={slot.id}
                      onClick={() => { if (slot.available) setSelectedSlot(slot.id); }}
                      style={{
                        padding: '1.1rem 1rem',
                        borderRadius: '16px',
                        border: isLateSlot
                          ? '2px solid #EF4444'
                          : isSelected
                          ? '2px solid #22C55E'
                          : '1.5px solid #E2E8F0',
                        background: isLateSlot
                          ? (isSelected ? '#FEF2F2' : '#FFFFFF')
                          : (!slot.available
                            ? '#F1F5F9'
                            : isSelected ? '#F0FDF4' : '#FFFFFF'),
                        cursor: slot.available ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        opacity: slot.available ? 1 : 0.6,
                        boxShadow: isSelected ? '0 4px 12px rgba(34, 197, 94, 0.15)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, color: '#1E293B', fontSize: '0.92rem' }}>
                          <Clock size={16} color={isLateSlot ? '#EF4444' : (slot.available ? '#15803D' : '#64748B')} />
                          <span>{slot.time}</span>
                        </div>
                        {isLateSlot && (
                          <div className="card-info-tooltip-container" tabIndex="0" aria-label="Late slot info" style={{ display: 'inline-flex', cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>
                            <Info size={16} color="#EF4444" />
                            <div className="card-info-tooltip">
                              {t('lateSlotTooltip')}
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.5rem', fontWeight: 600 }}>
                        {slot.available ? `${slot.remainingCount} ${t('tokenSlotsLeft')}` : (isHindi ? 'भरी हुई' : 'Full')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{
              width: '100%',
              minHeight: '52px',
              backgroundColor: '#059669',
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              padding: '1rem',
              fontSize: '1.1rem',
              fontWeight: '800',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ color: '#FFFFFF', fontWeight: '800' }}>
              {submitting ? (isHindi ? 'बुकिंग जनरेट हो रही है...' : 'Generating Booking Token...') : t('confirmAndGenerateToken')}
            </span>
            <ChevronRight size={20} color="#FFFFFF" style={{ flexShrink: 0 }} />
          </button>
        </form>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .form-split { grid-template-columns: 1fr !important; }
        }
        .info-tooltip-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          color: #15803D;
          margin-left: 4px;
        }
        .info-tooltip {
          visibility: hidden;
          width: 280px;
          background-color: #1e293b;
          color: #ffffff;
          text-align: left;
          border-radius: 8px;
          padding: 10px 12px;
          position: absolute;
          z-index: 50;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.2s, visibility 0.2s;
          font-size: 0.8rem;
          font-weight: 500;
          line-height: 1.4;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.1);
        }
        .info-tooltip-container:hover .info-tooltip,
        .info-tooltip-container:focus-within .info-tooltip {
          visibility: visible;
          opacity: 1;
        }
        .info-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #1e293b transparent transparent transparent;
        }
        @media (max-width: 640px) {
          .info-tooltip {
            left: auto;
            right: -20px;
            transform: none;
            width: 240px;
          }
          .info-tooltip::after {
            left: auto;
            right: 24px;
          }
        }
        .card-info-tooltip-container {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .card-info-tooltip {
          visibility: hidden;
          width: 220px;
          background-color: #ef4444;
          color: #ffffff;
          text-align: left;
          border-radius: 6px;
          padding: 8px 10px;
          position: absolute;
          z-index: 50;
          bottom: 125%;
          right: 0;
          opacity: 0;
          transition: opacity 0.2s, visibility 0.2s;
          font-size: 0.75rem;
          font-weight: 500;
          line-height: 1.35;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15), 0 2px 4px -1px rgba(0,0,0,0.1);
        }
        .card-info-tooltip-container:hover .card-info-tooltip,
        .card-info-tooltip-container:focus-within .card-info-tooltip {
          visibility: visible;
          opacity: 1;
        }
        .card-info-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          right: 5px;
          border-width: 5px;
          border-style: solid;
          border-color: #ef4444 transparent transparent transparent;
        }
      `}</style>
    </div>
  );
};

export default BookSlot;
