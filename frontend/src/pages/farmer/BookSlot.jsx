import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mockCentres } from '../../data/mockData';
import { Calendar, Clock, MapPin, Wheat, CheckCircle2, ChevronRight, AlertCircle, Info } from 'lucide-react';

import riceCrop from '../../assets/rice_crop.jpg';
import wheatCrop from '../../assets/wheat_crop.jpg';
import mustardCrop from '../../assets/mustard_crop.jpg';
import cornCrop from '../../assets/corn_crop.jpg';

const CROPS = [
  { name: 'Rice (धान / चावल)', icon: '🌾', msp: '₹2,183/Qtl', img: riceCrop },
  { name: 'Wheat (गेहूं)', icon: '🌾', msp: '₹2,275/Qtl', img: wheatCrop },
  { name: 'Mustard (सरसों)', icon: '🌻', msp: '₹5,650/Qtl', img: mustardCrop },
  { name: 'Sugarcane (गन्ना)', icon: '🎋', msp: '₹315/Qtl', img: '/sugarcane_crop.jpg' },
  { name: 'Onion (प्याज़)', icon: '🧅', msp: '₹1,500/Qtl', img: '/onion_crop.png' },
  { name: 'Tomato (टमाटर)', icon: '🍅', msp: '₹1,200/Qtl', img: '/tomato_crop.jpg' },
  { name: 'Maize (मक्का)', icon: '🌽', msp: '₹2,090/Qtl', img: cornCrop },
  { name: 'Potato (आलू)', icon: '🥔', msp: '₹1,000/Qtl', img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80&auto=format&fit=crop' },
  { name: 'Soybean (सोयाबीन)', icon: '🫘', msp: '₹4,600/Qtl', img: '/soybean_crop.jpg' },
  { name: 'Groundnut (मूंगफली)', icon: '🥜', msp: '₹6,377/Qtl', img: '/groundnut_crop.jpg' },
  { name: 'Chana (चना)', icon: '🟤', msp: '₹5,440/Qtl', img: '/chana_crop.jpg' },
];

const TIME_SLOTS = [
  { id: '1', time: '07:00 AM - 10:00 AM', status: 'available', slots: 4 },
  { id: '2', time: '10:00 AM - 01:00 PM', status: 'filling_fast', slots: 2 },
  { id: '3', time: '02:00 PM - 05:00 PM', status: 'available', slots: 6 },
  { id: '4', time: '05:00 PM - 08:00 PM', status: 'available', slots: 5 },
];

const BookSlot = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const navigate = useNavigate();

  const [selectedCrop, setSelectedCrop] = useState(CROPS[0].name);
  const [quantity, setQuantity] = useState('25');
  const [selectedCentre, setSelectedCentre] = useState(mockCentres[0].id);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0].id);
  const [booked, setBooked] = useState(false);

  const handleBooking = (e) => {
    e.preventDefault();
    setBooked(true);
    setTimeout(() => {
      navigate('/farmer/track-slot');
    }, 2000);
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
            {t('tokenGeneratedDesc', { crop: selectedCrop, quantity })}
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

        <form onSubmit={handleBooking} style={{ display: 'grid', gap: '1.5rem' }}>

          {/* 1. Crop Selection with Images */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#14532D', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>1️⃣</span> {t('selectCropToSell')}
            </h3>
            <div className="crop-grid">
              {CROPS.map((crop) => (
                <div
                  key={crop.name}
                  onClick={() => setSelectedCrop(crop.name)}
                  style={{
                    border: `2px solid ${selectedCrop === crop.name ? '#22C55E' : '#E2E8F0'}`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: selectedCrop === crop.name ? '#F0FDF4' : '#FFFFFF',
                    transition: 'all 0.25s ease',
                    boxShadow: selectedCrop === crop.name ? '0 8px 20px rgba(34,197,94,0.2)' : 'none',
                  }}
                >
                  <div style={{ height: '90px', overflow: 'hidden' }}>
                    <img src={crop.img} alt={crop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '0.85rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B' }}>{crop.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#15803D', fontWeight: 700, marginTop: '0.2rem' }}>MSP: {crop.msp}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quantity Input */}
            <div style={{ marginTop: '1.25rem' }}>
              <label className="input-label">{t('estimatedQuantity')}</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field"
                placeholder="e.g. 25"
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
                  {mockCentres.map(c => (
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
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-field"
                  required
                />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: '14px',
                    border: `2px solid ${
                      slot.id === '4'
                        ? (selectedSlot === slot.id ? '#DC2626' : '#EF4444')
                        : (selectedSlot === slot.id ? '#22C55E' : '#E2E8F0')
                    }`,
                    background: slot.id === '4'
                      ? (selectedSlot === slot.id ? '#FEF2F2' : '#FFFFFF')
                      : (selectedSlot === slot.id ? '#F0FDF4' : '#FFFFFF'),
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#1E293B', fontSize: '0.92rem' }}>
                      <Clock size={16} color={slot.id === '4' ? '#DC2626' : '#15803D'} /> {slot.time}
                    </div>
                    {slot.id === '4' && (
                      <div 
                        className="card-info-tooltip-container" 
                        tabIndex="0" 
                        onClick={(e) => e.stopPropagation()} 
                        style={{ color: '#DC2626', cursor: 'help', display: 'flex', alignItems: 'center' }}
                      >
                        <Info size={14} />
                        <div className="card-info-tooltip">
                          {t('lateSlotTooltip')}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.4rem' }}>
                    {slot.slots} {t('tokenSlotsLeft')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', borderRadius: '14px' }}>
            {t('confirmAndGenerateToken')} <ChevronRight size={20} />
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
