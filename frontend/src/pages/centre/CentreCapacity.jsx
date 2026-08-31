import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { mockCentreCapacityData } from '../../data/mockData';
import {
  ArrowLeft, Building2, Clock, Calendar, ShieldCheck, CheckCircle2,
  AlertTriangle, Power, Plus, Trash2, Save, Sparkles, Layers,
  ChevronRight, ToggleLeft, ToggleRight, Info
} from 'lucide-react';

const CentreCapacity = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isHindi = i18n.language === 'hi';

  const [isOpenToday, setIsOpenToday] = useState(mockCentreCapacityData.isOpenToday);
  const [closeReason, setCloseReason] = useState(mockCentreCapacityData.closeReason || '');
  const [dailyCapacityQtl, setDailyCapacityQtl] = useState(mockCentreCapacityData.totalDailyCapacityQtl);
  const [maxVehiclesPerHour, setMaxVehiclesPerHour] = useState(mockCentreCapacityData.maxVehiclesPerHour);
  const [activeBays, setActiveBays] = useState(mockCentreCapacityData.activeLoadingBays);
  const [activeWeighbridges, setActiveWeighbridges] = useState(mockCentreCapacityData.activeWeighbridges);
  const [startTime, setStartTime] = useState(mockCentreCapacityData.operatingHours.start);
  const [endTime, setEndTime] = useState(mockCentreCapacityData.operatingHours.end);
  const [slots, setSlots] = useState(mockCentreCapacityData.slotTimings);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Toggle slot enabled state
  const toggleSlot = (id) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  // Update capacity for a slot
  const updateSlotCapacity = (id, newCap) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, maxCapacity: parseInt(newCap) || 0, available: Math.max(0, (parseInt(newCap) || 0) - s.booked) } : s));
  };

  // Add new slot
  const handleAddSlot = () => {
    const newId = `SL-${slots.length + 1}`;
    const newSlot = {
      id: newId,
      time: "06:00 PM - 08:00 PM",
      maxCapacity: 6,
      booked: 0,
      available: 6,
      enabled: true
    };
    setSlots([...slots, newSlot]);
  };

  // Save changes handler
  const handleSave = (e) => {
    e.preventDefault();
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  const totalConfiguredCapacity = slots.filter(s => s.enabled).reduce((acc, s) => acc + s.maxCapacity, 0);
  const totalAvailableTokens = slots.filter(s => s.enabled).reduce((acc, s) => acc + s.available, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)', paddingBottom: '4rem' }}>

      {/* Floating Save Toast */}
      {showSavedToast && (
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
          <span>{isHindi ? 'केंद्र क्षमता और समय सफलतापूर्वक सहेजा गया!' : 'Centre Capacity & Timings Updated Successfully!'}</span>
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
                <Layers size={13} color="#86EFAC" />
                {isHindi ? 'स्लॉट और क्षमता प्रबंधन' : 'SLOT CAPACITY & TIMING MANAGER'}
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                {isHindi ? 'खरीद केंद्र क्षमता और स्लॉट समय' : 'Centre Capacity & Slot Timings'}
              </h1>
              <p style={{ opacity: 0.85, fontSize: '0.88rem', marginTop: '0.3rem', maxWidth: '650px' }}>
                {isHindi
                  ? 'दैनिक स्लॉट उपलब्धता, परिचालन समय और केंद्र की खुली/बंद स्थिति को नियंत्रित करें।'
                  : 'Manage daily vehicle intake capacity, configure hourly slot availability, and set centre operating status.'}
              </p>
            </div>

            {/* Current Open/Closed Pill */}
            <div style={{
              background: isOpenToday ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
              border: `1.5px solid ${isOpenToday ? '#34D399' : '#F87171'}`,
              borderRadius: '16px',
              padding: '0.75rem 1.25rem',
              backdropFilter: 'blur(10px)',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.72rem', opacity: 0.85, textTransform: 'uppercase', fontWeight: 700 }}>
                {isHindi ? 'वर्तमान परिचालन स्थिति' : 'Operational Status'}
              </div>
              <div style={{
                fontSize: '1.15rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif",
                color: isOpenToday ? '#A7F3D0' : '#FECACA', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end'
              }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: isOpenToday ? '#34D399' : '#EF4444' }} />
                {isOpenToday ? (isHindi ? 'खुला (सक्रिय)' : 'OPEN TODAY') : (isHindi ? 'आज बंद है' : 'CLOSED TODAY')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1100px', marginTop: '-2rem', position: 'relative', zIndex: 10 }}>
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.5rem' }}>

          {/* 1. Centre Operational Status Switch Card */}
          <div className="card" style={{
            background: '#FFFFFF',
            border: isOpenToday ? '1.5px solid #A7F3D0' : '1.5px solid #FECACA',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Power size={20} color={isOpenToday ? '#059669' : '#DC2626'} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                    {isHindi ? 'केंद्र संचालन स्थिति (खुला / बंद)' : 'Centre Operational Status (Open / Closed Today)'}
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.3rem 0 0' }}>
                  {isHindi
                    ? 'यदि अवकाश, भारी वर्षा या रखरखाव है, तो केंद्र को बंद के रूप में चिह्नित करें ताकि किसान आज स्लॉट बुक न कर सकें।'
                    : 'Toggle off if the centre is closed due to rain, maintenance, or gazetted holiday. Farmers will be notified immediately.'}
                </p>
              </div>

              {/* Big Interactive Toggle Button */}
              <button
                type="button"
                onClick={() => setIsOpenToday(!isOpenToday)}
                style={{
                  background: isOpenToday ? '#DCFCE7' : '#FEE2E2',
                  border: `2px solid ${isOpenToday ? '#16A34A' : '#DC2626'}`,
                  color: isOpenToday ? '#15803D' : '#991B1B',
                  borderRadius: '14px',
                  padding: '0.65rem 1.4rem',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                }}
              >
                {isOpenToday ? (
                  <>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16A34A' }} />
                    {isHindi ? 'खुला है (Open)' : 'Centre is OPEN'}
                  </>
                ) : (
                  <>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#DC2626' }} />
                    {isHindi ? 'आज बंद है (Closed)' : 'Centre is CLOSED'}
                  </>
                )}
              </button>
            </div>

            {/* If closed, show reason prompt */}
            {!isOpenToday && (
              <div style={{ marginTop: '1.25rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '1rem' }}>
                <label className="input-label" style={{ color: '#991B1B' }}>
                  {isHindi ? 'बंद होने का कारण (किसानों को प्रदर्शित किया जाएगा)' : 'Reason for Closure (Displayed to Farmers)'}
                </label>
                <input
                  type="text"
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder={isHindi ? "उदा. भारी बारिश के कारण आज खरीद स्थगित है..." : "e.g., Closed due to heavy unseasonal rains / Holiday..."}
                  className="input-field"
                  style={{ borderColor: '#FCA5A5', background: '#FFFFFF', marginTop: '0.35rem' }}
                  required={!isOpenToday}
                />
              </div>
            )}
          </div>

          {/* 2. Global Capacity & Hardware Parameters */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#064E3B', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>
              <Layers size={18} color="#059669" />
              {isHindi ? 'दैनिक क्षमता व वजन कांटा विन्यास' : 'Daily Intake Capacity & Infrastructure Limits'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="input-label">
                  {isHindi ? 'दैनिक अधिकतम क्षमता (क्विंटल)' : 'Daily Max Capacity (Quintals)'}
                </label>
                <input
                  type="number"
                  value={dailyCapacityQtl}
                  onChange={(e) => setDailyCapacityQtl(e.target.value)}
                  className="input-field"
                  min="100"
                  max="10000"
                  step="50"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
                  {isHindi ? 'कुल गोदाम भंडारण क्षमता का हिस्सा' : 'Total warehouse intake limit'}
                </span>
              </div>

              <div>
                <label className="input-label">
                  {isHindi ? 'अधिकतम वाहन प्रति घंटा' : 'Max Vehicles Per Hour'}
                </label>
                <input
                  type="number"
                  value={maxVehiclesPerHour}
                  onChange={(e) => setMaxVehiclesPerHour(e.target.value)}
                  className="input-field"
                  min="1"
                  max="30"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
                  {isHindi ? 'कतार प्रबंधन व जाम रोकने हेतु' : 'To prevent road congestion'}
                </span>
              </div>

              <div>
                <label className="input-label">
                  {isHindi ? 'सक्रिय वजन कांटा (Weighbridges)' : 'Active Weighbridges'}
                </label>
                <input
                  type="number"
                  value={activeWeighbridges}
                  onChange={(e) => setActiveWeighbridges(e.target.value)}
                  className="input-field"
                  min="1"
                  max="10"
                  required
                />
              </div>

              <div>
                <label className="input-label">
                  {isHindi ? 'सक्रिय अनलोडिंग बे (Loading Bays)' : 'Active Loading Bays'}
                </label>
                <input
                  type="number"
                  value={activeBays}
                  onChange={(e) => setActiveBays(e.target.value)}
                  className="input-field"
                  min="1"
                  max="10"
                  required
                />
              </div>
            </div>

            {/* Operating Hours Split */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="input-label">
                  {isHindi ? 'केंद्र खुलने का समय' : 'Centre Opening Time'}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="input-label">
                  {isHindi ? 'केंद्र बंद होने का समय' : 'Centre Closing Time'}
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. Hourly Slot Distribution & Token Availability */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#064E3B', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>
                  <Clock size={18} color="#059669" />
                  {isHindi ? 'प्रति घंटा स्लॉट और टोकन उपलब्धता' : 'Hourly Slot Capacity & Availability'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                  {isHindi
                    ? `कुल विन्यासित स्लॉट क्षमता: ${totalConfiguredCapacity} वाहन (${totalAvailableTokens} स्लॉट शेष)`
                    : `Total configured capacity: ${totalConfiguredCapacity} tokens (${totalAvailableTokens} slots available now)`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSlot}
                style={{
                  background: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  color: '#059669',
                  borderRadius: '10px',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Plus size={15} /> {isHindi ? 'नया स्लॉट जोड़ें' : 'Add Custom Slot'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {slots.map((slot, index) => (
                <div
                  key={slot.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderRadius: '16px',
                    background: slot.enabled ? '#F8FAFC' : '#F1F5F9',
                    border: `1.5px solid ${slot.enabled ? '#E2E8F0' : '#CBD5E1'}`,
                    opacity: slot.enabled ? 1 : 0.65,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: slot.enabled ? '#ECFDF5' : '#E2E8F0',
                      color: slot.enabled ? '#047857' : '#64748B',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.85rem', flexShrink: 0
                    }}>
                      {index + 1}
                    </span>

                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#1E293B', fontFamily: "'Outfit', sans-serif" }}>
                        {slot.time}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                        {isHindi
                          ? `बुक किए गए: ${slot.booked} • उपलब्ध: ${slot.available}`
                          : `Booked: ${slot.booked} • Available: ${slot.available}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    {/* Max capacity input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
                        {isHindi ? 'टोकन क्षमता:' : 'Token Cap:'}
                      </span>
                      <input
                        type="number"
                        value={slot.maxCapacity}
                        onChange={(e) => updateSlotCapacity(slot.id, e.target.value)}
                        disabled={!slot.enabled}
                        min={slot.booked}
                        max="20"
                        style={{
                          width: '65px',
                          padding: '0.35rem 0.5rem',
                          borderRadius: '8px',
                          border: '1.5px solid #CBD5E1',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          textAlign: 'center',
                          background: '#FFFFFF'
                        }}
                      />
                    </div>

                    {/* Enable / Disable Button */}
                    <button
                      type="button"
                      onClick={() => toggleSlot(slot.id)}
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        border: '1px solid',
                        borderColor: slot.enabled ? '#86EFAC' : '#CBD5E1',
                        background: slot.enabled ? '#DCFCE7' : '#E2E8F0',
                        color: slot.enabled ? '#15803D' : '#64748B',
                        cursor: 'pointer'
                      }}
                    >
                      {slot.enabled ? (isHindi ? 'सक्रिय' : 'Active') : (isHindi ? 'अक्षम' : 'Disabled')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit / Save Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/centre/dashboard')}
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                borderRadius: '12px',
                padding: '0.8rem 1.6rem',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </button>

            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '0.85rem 2rem',
                borderRadius: '12px',
                fontSize: '1rem',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Save size={18} />
              <span>{isHindi ? 'परिवर्तन सहेजें और लागू करें' : 'Save & Publish Capacity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CentreCapacity;
