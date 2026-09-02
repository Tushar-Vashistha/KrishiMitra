import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { mockTatkaalList, mockCentres } from '../../data/mockData';
import {
  ArrowLeft, Zap, ShieldAlert, CheckCircle2, Clock, Plus,
  UserCheck, AlertTriangle, Search, Filter, Sparkles, ChevronRight,
  MapPin, Phone, Layers
} from 'lucide-react';

const CentreTatkaal = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isHindi = i18n.language === 'hi';

  const [tatkaalSlots, setTatkaalSlots] = useState(mockTatkaalList);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedSlotForAllocation, setSelectedSlotForAllocation] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Form state for allocating tatkaal slot
  const [allocForm, setAllocForm] = useState({
    farmerName: '',
    mobile: '',
    crop: 'Wheat',
    weight: '20',
    reasonType: 'late_arrival', // 'late_arrival' | 'blacklisted_quota' | 'emergency_risk'
    slotId: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAllocate = (slot) => {
    setSelectedSlotForAllocation(slot);
    setAllocForm(prev => ({ ...prev, slotId: slot.id }));
    setShowAllocateModal(true);
  };

  const handleAllocateSubmit = (e) => {
    e.preventDefault();
    setTatkaalSlots(prev => prev.map(s => {
      if (s.id === (selectedSlotForAllocation?.id || allocForm.slotId)) {
        return {
          ...s,
          status: 'Allocated',
          assignedTo: `${allocForm.farmerName} (${allocForm.reasonType === 'blacklisted_quota' ? 'Blacklisted Quota' : allocForm.reasonType === 'late_arrival' ? 'Late Arrival' : 'Emergency'})`,
          mobile: allocForm.mobile,
          crop: allocForm.crop,
          weight: parseInt(allocForm.weight) || 20,
          allocatedAt: 'Just Now',
          allocatedBy: user?.manager || 'Procurement Officer Anil Verma',
          isBlacklistedFarmer: allocForm.reasonType === 'blacklisted_quota'
        };
      }
      return s;
    }));

    setShowAllocateModal(false);
    showToast(isHindi ? `तत्काल टोकन #${selectedSlotForAllocation?.id || allocForm.slotId} सफलतापूर्वक आवंटित किया गया!` : `Tatkaal Token #${selectedSlotForAllocation?.id || allocForm.slotId} allocated successfully!`);
  };

  const availableSlotsCount = tatkaalSlots.filter(s => s.status === 'Available').length;
  const allocatedSlotsCount = tatkaalSlots.filter(s => s.status === 'Allocated').length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FFFBEB 0%, #F8FAFC 100%)', paddingBottom: '4rem' }}>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#78350F',
          color: '#FFFFFF',
          padding: '0.85rem 1.75rem',
          borderRadius: '14px',
          boxShadow: '0 20px 35px -10px rgba(120, 53, 15, 0.4)',
          zIndex: 9999,
          fontSize: '0.9rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          border: '1px solid #FBBF24'
        }}>
          <CheckCircle2 size={20} color="#FBBF24" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div style={{
        background: 'linear-gradient(135deg, #78350F 0%, #92400E 40%, #B45309 75%, #D97706 100%)',
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
                <Zap size={13} color="#FDE68A" />
                {isHindi ? 'आपातकालीन व रद्द स्लॉट आवंटन' : 'EMERGENCY & CANCELLED SLOT MANAGER'}
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                {isHindi ? 'तत्काल स्लॉट व लेट/ब्लैकलिस्ट प्रबंधन' : 'Tatkaal Slot & Emergency Allocation'}
              </h1>
              <p style={{ opacity: 0.85, fontSize: '0.88rem', marginTop: '0.3rem', maxWidth: '650px' }}>
                {isHindi
                  ? 'किसानों द्वारा रद्द किए गए स्लॉट स्वतः तत्काल में उपलब्ध होते हैं। अधिकारी देर से आने वाले या ब्लैकलिस्टेड किसानों को स्लॉट आवंटित कर सकते हैं।'
                  : 'When booked slots are cancelled, they unlock into the Tatkaal pool for late-coming, emergency, or restricted/blacklisted farmers.'}
              </p>
            </div>

            {/* Tatkaal Available Pill */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '16px',
              padding: '0.75rem 1.25rem',
              backdropFilter: 'blur(10px)',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.72rem', opacity: 0.85, textTransform: 'uppercase', fontWeight: 700 }}>
                {isHindi ? 'खुले तत्काल स्लॉट' : 'Open Tatkaal Slots'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#FEF3C7' }}>
                {availableSlotsCount} {isHindi ? 'स्लॉट उपलब्ध' : 'Available'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1100px', marginTop: '-2rem', position: 'relative', zIndex: 10 }}>

        {/* Policy Highlight Banner */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          border: '1.5px solid #FCD34D',
          marginBottom: '1.5rem',
          padding: '1.25rem 1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: '#D97706', color: 'white', borderRadius: '12px', padding: '0.5rem', display: 'flex' }}>
              <Zap size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#78350F', fontFamily: "'Outfit', sans-serif" }}>
                {isHindi ? 'तत्काल स्लॉट आवंटन नीति और नियम' : 'Tatkaal Slot Conversion & Allocation Rules'}
              </h4>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: '#92400E', lineHeight: 1.5 }}>
                {isHindi
                  ? '1. यदि कोई किसान समय पर नहीं पहुंचता या बुकिंग रद्द करता है, तो वह स्लॉट तुरंत तत्काल बन जाता है। 2. ब्लैकलिस्टेड (स्कोर ≤25) किसानों को केवल दिन के अंतिम स्लॉट में से अधिकतम 2 तत्काल स्लॉट मिल सकते हैं। 3. केंद्र अधिकारी तत्काल बुकिंग का मैन्युअल आवंटन कर सकते हैं।'
                  : '1. Slot cancellations immediately release into the Tatkaal inventory. 2. Blacklisted farmers (Trust score ≤25) are limited to 2 emergency end-of-day slots per centre. 3. Procurement officers have override authority to assign urgent clearance tokens.'}
              </p>
            </div>
          </div>
        </div>

        {/* Tatkaal Inventory & Active Allocations */}
        <div className="card" style={{ padding: '1.75rem', borderRadius: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#78350F', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                {isHindi ? 'उपलब्ध व आवंटित तत्काल स्लॉट सूची' : 'Tatkaal Slot Inventory & Allocation Log'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {isHindi ? `${availableSlotsCount} स्लॉट खुले हैं • ${allocatedSlotsCount} टोकन आवंटित` : `${availableSlotsCount} slots open for allocation • ${allocatedSlotsCount} tokens assigned`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tatkaalSlots.map((slot) => (
              <div
                key={slot.id}
                style={{
                  padding: '1.25rem',
                  background: slot.status === 'Available' ? '#FFFBEB' : '#F8FAFC',
                  borderRadius: '16px',
                  border: `1.5px solid ${slot.status === 'Available' ? '#FDE68A' : '#E2E8F0'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '14px',
                    background: slot.status === 'Available' ? '#FEF3C7' : '#F1F5F9',
                    border: `1px solid ${slot.status === 'Available' ? '#FCD34D' : '#CBD5E1'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, color: slot.status === 'Available' ? '#D97706' : '#64748B',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}>
                    <Zap size={22} color={slot.status === 'Available' ? '#D97706' : '#64748B'} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                        #{slot.id}
                      </span>
                      <span style={{
                        background: slot.status === 'Available' ? '#DCFCE7' : '#EFF6FF',
                        color: slot.status === 'Available' ? '#15803D' : '#1D4ED8',
                        border: `1px solid ${slot.status === 'Available' ? '#86EFAC' : '#BFDBFE'}`,
                        padding: '2px 9px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800
                      }}>
                        ● {slot.status === 'Available' ? (isHindi ? 'उपलब्ध' : 'Open for Allocation') : (isHindi ? 'आवंटित' : 'Allocated')}
                      </span>

                      {slot.isBlacklistedFarmer && (
                        <span style={{
                          background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5',
                          padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800
                        }}>
                          ⚠️ {isHindi ? 'ब्लैकलिस्टेड कोटा' : 'Blacklist Quota Limit'}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 700, marginTop: '0.3rem' }}>
                      <Clock size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {slot.timeSlot} • <span style={{ color: '#64748B', fontWeight: 500 }}>{isHindi ? 'स्रोत:' : 'Origin:'} {slot.originCancelledSlot}</span>
                    </div>

                    {slot.assignedTo && (
                      <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.25rem', fontWeight: 600 }}>
                        👨‍🌾 {isHindi ? 'आवंटित:' : 'Assigned to:'} <strong>{slot.assignedTo}</strong> (📞 {slot.mobile}) • {slot.crop} ({slot.weight} Qtl)
                      </div>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div>
                  {slot.status === 'Available' ? (
                    <button
                      type="button"
                      onClick={() => handleOpenAllocate(slot)}
                      style={{
                        background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.55rem 1.2rem',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                      }}
                    >
                      <UserCheck size={15} />
                      <span>{isHindi ? 'किसान को आवंटित करें' : 'Assign to Farmer'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenAllocate(slot)}
                      style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '0.45rem 0.9rem',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {isHindi ? 'आवंटन संशोधित करें' : 'Update Assignment'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Allocation Modal */}
      {showAllocateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#78350F', fontFamily: "'Outfit', sans-serif" }}>
                  {isHindi ? 'तत्काल स्लॉट आवंटन' : 'Allocate Tatkaal Emergency Slot'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  {selectedSlotForAllocation ? `Token #${selectedSlotForAllocation.id} (${selectedSlotForAllocation.timeSlot})` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllocateModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 900, color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label className="input-label">{isHindi ? 'किसान का नाम' : 'Farmer Name'}</label>
                <input
                  type="text"
                  value={allocForm.farmerName}
                  onChange={e => setAllocForm({ ...allocForm, farmerName: e.target.value })}
                  placeholder={isHindi ? "उदा. रमेश कुमार / कृपाराम" : "e.g., Ramesh Kumar"}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="input-label">{isHindi ? 'मोबाइल नंबर' : 'Mobile Number'}</label>
                <input
                  type="tel"
                  value={allocForm.mobile}
                  onChange={e => setAllocForm({ ...allocForm, mobile: e.target.value })}
                  placeholder="9876543210"
                  className="input-field"
                  pattern="[0-9]{10}"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="input-label">{isHindi ? 'फसल' : 'Crop'}</label>
                  <select
                    value={allocForm.crop}
                    onChange={e => setAllocForm({ ...allocForm, crop: e.target.value })}
                    className="input-field"
                  >
                    <option value="Wheat">Wheat (गेहूं)</option>
                    <option value="Paddy">Paddy (धान)</option>
                    <option value="Mustard">Mustard (सरसों)</option>
                    <option value="Maize">Maize (मक्का)</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">{isHindi ? 'वजन (क्विंटल)' : 'Weight (Qtl)'}</label>
                  <input
                    type="number"
                    value={allocForm.weight}
                    onChange={e => setAllocForm({ ...allocForm, weight: e.target.value })}
                    className="input-field"
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">{isHindi ? 'तत्काल आवंटन का कारण' : 'Allocation Category & Reason'}</label>
                <select
                  value={allocForm.reasonType}
                  onChange={e => setAllocForm({ ...allocForm, reasonType: e.target.value })}
                  className="input-field"
                >
                  <option value="late_arrival">Late Arrival / Missed Original Slot (देरी से आगमन)</option>
                  <option value="emergency_risk">Emergency Harvest / Weather Risk (आपातकालीन मौसम जोखिम)</option>
                  <option value="blacklisted_quota">Blacklisted Farmer Restricted Slot (ब्लैकलिस्टेड कोटा स्लॉट)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '12px',
                    border: '1.5px solid #CBD5E1', background: '#FFFFFF',
                    fontWeight: 700, cursor: 'pointer', color: '#475569'
                  }}
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  style={{
                    flex: 2, padding: '0.75rem', borderRadius: '12px',
                    border: 'none', background: 'linear-gradient(135deg, #D97706, #F59E0B)',
                    fontWeight: 800, cursor: 'pointer', color: '#FFFFFF',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
                  }}
                >
                  {isHindi ? 'तत्काल टोकन जारी करें' : 'Confirm Tatkaal Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CentreTatkaal;
