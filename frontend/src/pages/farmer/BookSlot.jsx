import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cropService, centreService, bookingService } from '../../services/api';
import { Calendar, Clock, MapPin, Wheat, CheckCircle2, ChevronRight, AlertCircle, Info, Sparkles, Check, ArrowRight } from 'lucide-react';

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

// Configurable processing rates in Quintals per minute
const DEFAULT_PROCESSING_RATES = {
  'Wheat': { rateQtlPerMin: 0.5, rateKgPerMin: 50 },
  'Paddy': { rateQtlPerMin: 0.4, rateKgPerMin: 40 },
  'Rice': { rateQtlPerMin: 0.4, rateKgPerMin: 40 },
  'Mustard': { rateQtlPerMin: 0.35, rateKgPerMin: 35 },
  'Maize': { rateQtlPerMin: 0.5, rateKgPerMin: 50 },
  'Sugarcane': { rateQtlPerMin: 1.0, rateKgPerMin: 100 },
  'Chana': { rateQtlPerMin: 0.4, rateKgPerMin: 40 },
  'Soybean': { rateQtlPerMin: 0.4, rateKgPerMin: 40 },
  'Groundnut': { rateQtlPerMin: 0.35, rateKgPerMin: 35 },
  'DEFAULT': { rateQtlPerMin: 0.4, rateKgPerMin: 40 },
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

  const [dbCrops, setDbCrops] = useState([]);
  const [dbCentres, setDbCentres] = useState([]);
  const [slots, setSlots] = useState([]);
  const [processingRates, setProcessingRates] = useState(DEFAULT_PROCESSING_RATES);
  
  const [selectedCropId, setSelectedCropId] = useState('1');
  const [selectedCropName, setSelectedCropName] = useState('Wheat');
  const [quantity, setQuantity] = useState('25');
  const [selectedCentre, setSelectedCentre] = useState('1');
  const [selectedDate, setSelectedDate] = useState(getTomorrowDate());
  const [selectedSlot, setSelectedSlot] = useState('S1');
  const [booked, setBooked] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [autoSelectedNotice, setAutoSelectedNotice] = useState('');

  // 1. Calculate estimated procurement time based on crop type & quantity
  const estimatedProcurementTime = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    if (qty <= 0) return 0;
    const rateInfo = processingRates[selectedCropName] || processingRates['DEFAULT'] || { rateQtlPerMin: 0.4 };
    const rate = rateInfo.rateQtlPerMin || 0.4;
    return Math.max(5, Math.ceil(qty / rate));
  }, [quantity, selectedCropName, processingRates]);

  // 2. Fetch crops, centres & processing rates on load
  useEffect(() => {
    const initData = async () => {
      let crops = [];
      let centres = [];

      try {
        const cropsRes = await cropService.getAll();
        if (cropsRes.success && Array.isArray(cropsRes.data)) {
          crops = cropsRes.data;
        }
      } catch (err) {
        console.error('Failed to fetch crops:', err);
      }
      setDbCrops(crops);
      if (crops.length > 0) {
        setSelectedCropId(crops[0].id.toString());
        setSelectedCropName(crops[0].name);
      }

      try {
        const ratesRes = await cropService.getProcessingRates();
        if (ratesRes.success && ratesRes.data) {
          setProcessingRates(ratesRes.data);
        }
      } catch (err) {
        console.warn('Processing rates fallback to defaults:', err);
      }
      
      try {
        const centresRes = await centreService.getNearby(26.8467, 80.9462, 100);
        if (centresRes.success && Array.isArray(centresRes.data)) {
          centres = centresRes.data;
        }
      } catch (err) {
        console.error('Failed to fetch centres:', err);
      }
      setDbCentres(centres);
      if (centres.length > 0) {
        setSelectedCentre(centres[0].id.toString());
      }
    };
    initData();
  }, []);

  // 3. Fetch smart slots availability when centre, date, crop, or quantity changes
  useEffect(() => {
    if (!selectedCentre || !selectedDate) return;
    const fetchSlots = async () => {
      let availableSlots = [];
      let nextAvailable = null;

      try {
        const slotsRes = await centreService.getSlotsAvailability(
          selectedCentre,
          selectedDate,
          selectedCropId,
          quantity
        );

        if (slotsRes.success) {
          availableSlots = Array.isArray(slotsRes.data) ? slotsRes.data : (slotsRes.data?.slots || slotsRes.slots || []);
          nextAvailable = slotsRes.nextAvailableSlot || slotsRes.meta?.nextAvailableSlot;
        }
      } catch (err) {
        console.warn('Backend slots fetch fallback to calculated slots:', err);
      }

      if (availableSlots.length === 0) {
        // Fallback default slots with smart capacity simulation
        const reqTime = estimatedProcurementTime;
        availableSlots = [
          { id: 'S1', time: '07:00 AM - 10:00 AM', totalCapacityMinutes: 180, bookedMinutes: 110, remainingMinutes: 70, capacity: 10, bookedCount: 2, remainingCount: 8 },
          { id: 'S2', time: '10:00 AM - 01:00 PM', totalCapacityMinutes: 180, bookedMinutes: 60, remainingMinutes: 120, capacity: 10, bookedCount: 1, remainingCount: 9 },
          { id: 'S3', time: '02:00 PM - 05:00 PM', totalCapacityMinutes: 180, bookedMinutes: 160, remainingMinutes: 20, capacity: 10, bookedCount: 3, remainingCount: 7 },
          { id: 'S4', time: '05:00 PM - 08:00 PM', totalCapacityMinutes: 180, bookedMinutes: 180, remainingMinutes: 0, capacity: 10, bookedCount: 4, remainingCount: 6 },
        ].map(s => {
          const avail = s.remainingMinutes >= reqTime;
          let status = 'available';
          if (!avail || s.remainingMinutes <= 0) status = 'full';
          else if (s.remainingMinutes <= 30) status = 'limited';
          return { ...s, available: avail, status };
        });
      }

      setSlots(availableSlots);

      // Find first available slot
      if (!nextAvailable) {
        nextAvailable = availableSlots.find(s => s.available);
      }

      // Check if current selected slot is available for this quantity
      const activeSlot = availableSlots.find(s => s.id === selectedSlot);
      if (activeSlot && !activeSlot.available) {
        if (nextAvailable) {
          setSelectedSlot(nextAvailable.id);
          setAutoSelectedNotice(
            isHindi
              ? `चुने गए स्लॉट में आपकी फसल मात्रा (${estimatedProcurementTime} मिनट) के लिए पर्याप्त समय नहीं है। हमने स्वचालित रूप से अगला उपलब्ध स्लॉट (${nextAvailable.time}) चुन लिया है।`
              : `The previous slot cannot accommodate your crop quantity (${estimatedProcurementTime} mins required). We have automatically selected the next available slot (${nextAvailable.time}).`
          );
        } else {
          setSelectedSlot('');
          setAutoSelectedNotice(
            isHindi
              ? `इस तिथि पर कोई भी स्लॉट आपकी फसल मात्रा (${estimatedProcurementTime} मिनट) के लिए पर्याप्त नहीं है। कृपया अगली तिथि चुनें।`
              : `No slots available for this date that can accommodate ${estimatedProcurementTime} minutes. Please choose another date.`
          );
        }
      } else if (activeSlot && activeSlot.available) {
        setAutoSelectedNotice('');
      } else if (!selectedSlot && nextAvailable) {
        setSelectedSlot(nextAvailable.id);
        setAutoSelectedNotice('');
      }
    };

    fetchSlots();
  }, [selectedCentre, selectedDate, selectedCropId, quantity, estimatedProcurementTime]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg('');

    if (!selectedSlot) {
      setErrorMsg(isHindi ? 'कृपया एक उपलब्ध समय स्लॉट चुनें।' : 'Please select an available time slot.');
      return;
    }

    const activeSlotObj = slots.find(s => s.id === selectedSlot);
    if (activeSlotObj && !activeSlotObj.available) {
      setErrorMsg(
        isHindi
          ? `यह स्लॉट आपकी फसल मात्रा (${estimatedProcurementTime} मिनट) के लिए पर्याप्त नहीं है। कृपया अगला उपलब्ध स्लॉट चुनें।`
          : `This slot does not have enough capacity for your crop quantity (${estimatedProcurementTime} mins required, only ${activeSlotObj.remainingMinutes || 0} mins remaining). Please select another available slot.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const activeCropObj = dbCrops.find(c => c.id.toString() === selectedCropId);
      const activeCentreObj = dbCentres.find(c => c.id.toString() === selectedCentre);
      const slotTimeStr = activeSlotObj ? activeSlotObj.time : '07:00 AM - 10:00 AM';

      const payload = {
        cropId: parseInt(selectedCropId),
        weight: parseFloat(quantity),
        centreId: parseInt(selectedCentre),
        date: selectedDate,
        slotTime: slotTimeStr,
        unit: 'Quintal',
      };

      let backendRes = null;
      try {
        const res = await bookingService.create(payload);
        if (res.success && res.data) {
          backendRes = res.data;
        }
      } catch (err) {
        // If slot capacity was exceeded concurrently, inform farmer and select next slot
        if (err.response?.data?.nextAvailableSlot || err.nextAvailableSlot) {
          const nextS = err.response?.data?.nextAvailableSlot || err.nextAvailableSlot;
          const matchSlot = slots.find(s => s.time === nextS.time || s.id === nextS.id);
          if (matchSlot) setSelectedSlot(matchSlot.id);
        }
        throw err;
      }

      const bookingInfo = backendRes?.booking || backendRes;
      const tokenInfo = backendRes?.token || {};
      const tokenNumber = backendRes?.tokenNumber || tokenInfo.tokenNumber || 1;
      const formattedToken = backendRes?.formattedToken || tokenInfo.formattedToken || `Token #${String(tokenNumber).padStart(3, '0')}`;
      const bookingId = backendRes?.bookingId || bookingInfo.id;
      const procTime = backendRes?.estimatedProcessingTime || estimatedProcurementTime;

      const confirmedData = {
        bookingId,
        tokenNumber,
        formattedToken,
        centreName: activeCentreObj?.name || "Procurement Centre",
        date: selectedDate,
        slotTime: slotTimeStr,
        crop: activeCropObj?.name || selectedCropName,
        quantity: `${quantity} Quintal`,
        estimatedProcessingTime: procTime,
      };

      // Format local booking object for instant dashboard & queue sync
      const slotCode = slotTimeStr.includes("07:") ? "7-10" : 
                       slotTimeStr.includes("10:") ? "10-1" : 
                       slotTimeStr.includes("14:") || slotTimeStr.includes("02:") ? "2-5" : "5-8";

      const newBookingObj = {
        id: bookingId,
        token: tokenNumber,
        formattedToken: formattedToken,
        queueTokenId: tokenInfo.id || null,
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
        estimatedProcessingTime: procTime,
        isTatkaal: false,
        aadhaar: "XXXX-XXXX-1234",
        paymentStatus: "Due",
      };

      const existingLocal = JSON.parse(localStorage.getItem('krishimitra_local_bookings') || '[]');
      localStorage.setItem('krishimitra_local_bookings', JSON.stringify([newBookingObj, ...existingLocal]));

      setConfirmedBookingData(confirmedData);
      setBooked(true);

      setTimeout(() => {
        navigate('/farmer/track-slot');
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to book slot. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (booked && confirmedBookingData) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '520px', width: '100%', background: '#FFFFFF', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', borderRadius: '24px' }}>
          <div style={{
            width: 84, height: 84, background: 'linear-gradient(135deg, #DCFCE7, #86EFAC)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem', boxShadow: '0 10px 25px rgba(34,197,94,0.35)'
          }}>
            <CheckCircle2 size={50} color="#15803D" />
          </div>

          <span style={{
            display: 'inline-block',
            background: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            color: '#166534',
            fontSize: '0.82rem',
            fontWeight: 800,
            padding: '4px 14px',
            borderRadius: '20px',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
          }}>
            {isHindi ? '✅ स्लॉट सफलतापूर्वक बुक हुआ' : '✅ Booking Confirmed'}
          </span>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#14532D', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
            {confirmedBookingData.formattedToken}
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.92rem', marginBottom: '1.75rem' }}>
            {isHindi ? 'विशिष्ट टोकन संख्या आवंटित कर दी गई है' : 'Unique token allocated for your procurement slot'}
          </p>

          <div style={{
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: '16px',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '1.75rem',
            display: 'grid',
            gap: '0.65rem',
            fontSize: '0.88rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>{isHindi ? 'बुकिंग आईडी:' : 'Booking ID:'}</span>
              <span style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{confirmedBookingData.bookingId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>{isHindi ? 'खरीद केंद्र:' : 'Procurement Centre:'}</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{confirmedBookingData.centreName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>{isHindi ? 'दिनांक एवं समय:' : 'Date & Slot:'}</span>
              <span style={{ fontWeight: 700, color: '#15803D' }}>{confirmedBookingData.date} | {confirmedBookingData.slotTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>{isHindi ? 'फसल एवं मात्रा:' : 'Crop & Quantity:'}</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{confirmedBookingData.crop} ({confirmedBookingData.quantity})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>{isHindi ? 'अनुमानित समय:' : 'Estimated Time:'}</span>
              <span style={{ fontWeight: 800, color: '#047857' }}>⏱️ {confirmedBookingData.estimatedProcessingTime} {isHindi ? 'मिनट' : 'mins'}</span>
            </div>
          </div>

          <div className="badge-green" style={{ fontSize: '0.85rem', padding: '8px 20px', borderRadius: '30px' }}>
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
            {isHindi ? '📅 स्मार्ट स्लॉट बुकिंग पोर्टल' : '📅 SMART SLOT BOOKING PORTAL'}
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
              ? 'फसल की मात्रा एवं प्रसंस्करण समय आधारित वास्तविक स्लॉट उपलब्धता' 
              : 'Smart capacity allocation based on crop type, quantity & estimated processing time'}
          </p>
        </div>

        {/* Booking Policy Banner */}
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

        {/* Auto Next Slot Selection Notice Banner */}
        {autoSelectedNotice && (
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1.5px solid #93C5FD',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            color: '#1E40AF',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
          }}>
            <Sparkles size={22} color="#2563EB" style={{ flexShrink: 0 }} />
            <div style={{ lineHeight: 1.45 }}>{autoSelectedNotice}</div>
          </div>
        )}

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

          {/* 1. Crop Selection with Images & Quantity */}
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
                const cropRate = processingRates[crop.name]?.rateQtlPerMin || DEFAULT_PROCESSING_RATES[crop.name]?.rateQtlPerMin || 0.4;
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
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                        ⚡ {cropRate} {isHindi ? 'क्विंटल/मिनट' : 'Qtl/min'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quantity Input */}
            <div style={{ marginTop: '1.25rem' }}>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t('estimatedQuantity')} (Quintal / क्विंटल)</span>
                <span style={{ fontSize: '0.78rem', color: '#15803D', fontWeight: 700 }}>
                  1 {isHindi ? 'क्विंटल' : 'Quintal'} = 100 kg
                </span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field"
                placeholder={isHindi ? 'उदा. 25' : 'e.g. 25'}
                min="1"
                required
              />

              {/* Dynamic Estimated Processing Time Card */}
              <div style={{
                marginTop: '0.85rem',
                padding: '0.9rem 1.1rem',
                backgroundColor: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Clock size={20} color="#15803D" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#166534' }}>
                      {isHindi ? 'अनुमानित खरीद प्रसंस्करण समय:' : 'Estimated Procurement Processing Time:'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#15803D', marginTop: '2px' }}>
                      {isHindi
                        ? `${quantity || 0} क्विंटल ${selectedCropName} @ ${(processingRates[selectedCropName]?.rateQtlPerMin || DEFAULT_PROCESSING_RATES[selectedCropName]?.rateQtlPerMin || 0.4)} क्विंटल/मिनट`
                        : `${quantity || 0} Qtl ${selectedCropName} @ ${(processingRates[selectedCropName]?.rateQtlPerMin || DEFAULT_PROCESSING_RATES[selectedCropName]?.rateQtlPerMin || 0.4)} Qtl/min handling rate`}
                    </div>
                  </div>
                </div>

                <div style={{
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  color: '#14532D',
                  background: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}>
                  <span>⏱️</span>
                  <span>{estimatedProcurementTime} {isHindi ? 'मिनट' : 'mins'}</span>
                </div>
              </div>
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

          {/* 3. Time Slots with Real-Time Crop Capacity Display */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#14532D', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

              <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                {isHindi
                  ? `आपकी फसल के लिए आवश्यक समय: ${estimatedProcurementTime} मिनट`
                  : `Capacity Required: ${estimatedProcurementTime} mins`}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {slots.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1.5rem', color: '#64748B', fontWeight: 600 }}>
                  {isHindi ? 'इस तिथि के लिए कोई समय स्लॉट उपलब्ध नहीं है।' : 'No time slots available for this date.'}
                </div>
              ) : (
                slots.map((slot) => {
                  const isSelected = selectedSlot === slot.id;
                  const isAvailable = slot.available;
                  const isLimited = slot.status === 'limited';
                  const isFull = slot.status === 'full' || !isAvailable;
                  const remainingMinutes = slot.remainingMinutes !== undefined ? slot.remainingMinutes : 75;
                  const totalDuration = slot.totalCapacityMinutes || slot.totalSlotDuration || 180;
                  const bookedMinutes = slot.bookedMinutes || 0;
                  const percentBooked = Math.min(100, Math.round((bookedMinutes / totalDuration) * 100));

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedSlot(slot.id);
                          setErrorMsg('');
                        } else {
                          setErrorMsg(
                            isHindi
                              ? `यह स्लॉट आपकी फसल मात्रा (${estimatedProcurementTime} मिनट) के लिए पर्याप्त नहीं है। कृपया उपलब्ध स्लॉट चुनें।`
                              : `This slot does not have enough capacity for your crop quantity (${estimatedProcurementTime} mins required, only ${remainingMinutes} mins left). Please select another slot.`
                          );
                        }
                      }}
                      style={{
                        padding: '1.15rem 1.1rem',
                        borderRadius: '16px',
                        border: isSelected
                          ? '2.5px solid #22C55E'
                          : isFull
                          ? '1.5px solid #FCA5A5'
                          : isLimited
                          ? '1.5px solid #FCD34D'
                          : '1.5px solid #E2E8F0',
                        background: isFull
                          ? '#FEF2F2'
                          : isSelected
                          ? '#F0FDF4'
                          : isLimited
                          ? '#FFFBEB'
                          : '#FFFFFF',
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        opacity: isAvailable ? 1 : 0.65,
                        boxShadow: isSelected ? '0 6px 16px rgba(34, 197, 94, 0.2)' : 'none',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Slot Header */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.4rem', marginBottom: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, color: '#1E293B', fontSize: '0.94rem' }}>
                            <Clock size={16} color={isFull ? '#DC2626' : (isAvailable ? '#15803D' : '#64748B')} />
                            <span>{slot.time}</span>
                          </div>

                          {/* Status Badge */}
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: isFull ? '#FEE2E2' : (isLimited ? '#FEF3C7' : '#DCFCE7'),
                            color: isFull ? '#B91C1C' : (isLimited ? '#92400E' : '#15803D'),
                            border: `1px solid ${isFull ? '#FCA5A5' : (isLimited ? '#FDE68A' : '#86EFAC')}`,
                          }}>
                            {isFull
                              ? (isHindi ? 'भरी हुई (FULL)' : 'FULL')
                              : isLimited
                              ? (isHindi ? 'सीमित क्षमता' : 'Limited Capacity')
                              : (isHindi ? 'उपलब्ध' : 'Available')}
                          </span>
                        </div>

                        {/* Capacity Text */}
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isFull ? '#DC2626' : (isLimited ? '#B45309' : '#15803D'), marginTop: '0.2rem' }}>
                          {isFull
                            ? (remainingMinutes <= 0
                                ? (isHindi ? 'कोई क्षमता शेष नहीं' : 'No Capacity Available')
                                : `${isHindi ? 'शेष क्षमता' : 'Remaining Capacity'}: ${remainingMinutes} ${isHindi ? 'मिनट' : 'mins'}`)
                            : `${isHindi ? 'शेष क्षमता' : 'Remaining Capacity'}: ${remainingMinutes} ${isHindi ? 'मिनट' : 'mins'}`
                          }
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginTop: '0.6rem' }}>
                          <div style={{
                            width: '100%',
                            height: '6px',
                            borderRadius: '4px',
                            backgroundColor: '#E2E8F0',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${percentBooked}%`,
                              height: '100%',
                              backgroundColor: isFull ? '#EF4444' : (isLimited ? '#F59E0B' : '#10B981'),
                              borderRadius: '4px',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>
                            <span>{bookedMinutes}m / {totalDuration}m {isHindi ? 'बुक' : 'booked'}</span>
                            <span>{slot.bookedCount || 0} {isHindi ? 'किसान' : 'farmers'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div style={{
                          marginTop: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: '#15803D',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                        }}>
                          <Check size={14} color="#15803D" />
                          <span>{isHindi ? 'यह स्लॉट चुना गया है' : 'Selected for booking'}</span>
                        </div>
                      )}
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
              minHeight: '54px',
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
              {submitting
                ? (isHindi ? 'विशिष्ट टोकन जनरेट हो रहा है...' : 'Allocating Unique Token & Validating Slot...')
                : t('confirmAndGenerateToken')}
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
      `}</style>
    </div>
  );
};

export default BookSlot;
