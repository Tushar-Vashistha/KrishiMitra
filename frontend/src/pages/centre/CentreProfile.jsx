import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { mockUser, mockCentres } from '../../data/mockData';
import {
  Building2, Phone, MapPin, ShieldCheck, Layers,
  CreditCard, Edit3, ArrowLeft, Users, CalendarCheck2,
  Clock, CheckCircle2, QrCode, Sparkles
} from 'lucide-react';

const CentreProfile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const isHindi = i18n.language === 'hi';

  const centreData = {
    ...mockUser.centre,
    ...(user || {}),
    storageCapacity: "12,000 MT",
    loadingBays: 4,
    activeCounters: 4,
    openingTime: "08:00 AM",
    closingTime: "06:00 PM",
    authorizationNo: "UP-GOV-AGRI-2024-884",
    authorizedCrops: "Wheat, Paddy, Mustard, Maize, Soybean"
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: centreData.name || '',
    centreId: centreData.centreId || 'UP-LKO-001',
    manager: centreData.manager || 'Anil Verma',
    designation: centreData.designation || 'Centre Manager',
    mobile: centreData.mobile || '9876500001',
    district: centreData.district || 'Lucknow',
    state: centreData.state || 'Uttar Pradesh',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (user?.centreId) {
        await centreService.update(user.centreId, {
          name: formData.name,
          managerName: formData.manager,
          designation: formData.designation,
          mobile: formData.mobile,
          district: formData.district,
          state: formData.state,
        });
      }
    } catch (err) {
      console.warn('Backend centre update warning:', err);
    }
    if (updateUser) {
      updateUser(formData);
    }
    setShowEditModal(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)', paddingBottom: '5rem' }}>
      <div className="container" style={{ marginTop: '1.5rem', maxWidth: '1100px' }}>

        {/* Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate('/centre/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#059669',
              fontWeight: 700,
              fontSize: '0.9rem',
              padding: '0.4rem 0.6rem',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ECFDF5'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <ArrowLeft size={18} />
            {isHindi ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard'}
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 1.1rem',
              fontSize: '0.85rem',
              borderRadius: '10px',
              fontWeight: 700
            }}
          >
            <Edit3 size={16} />
            {isHindi ? 'विवरण संपादित करें' : 'Edit Centre Info'}
          </button>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div style={{
            background: '#DCFCE7',
            border: '1px solid #86EFAC',
            color: '#14532D',
            padding: '0.85rem 1.25rem',
            borderRadius: '14px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 700
          }}>
            <CheckCircle2 size={20} color="#16A34A" />
            {isHindi ? 'खरीद केंद्र का विवरण सफलतापूर्वक अपडेट हुआ!' : 'Procurement Centre details updated successfully!'}
          </div>
        )}

        {/* Centre Hero Header */}
        <div style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #059669 100%)',
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -15px rgba(6, 78, 59, 0.35)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{
                width: 90,
                height: 90,
                borderRadius: '22px',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
                flexShrink: 0
              }}>
                <Building2 size={46} color="#059669" />
              </div>

              <div>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  color: '#FEF3C7',
                  padding: '3px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '0.35rem'
                }}>
                  🏢 {isHindi ? 'अधिकृत सरकारी खरीद केंद्र' : 'AUTHORIZED GOVT. PROCUREMENT CENTRE'}
                </span>

                <h1 style={{
                  fontSize: '1.9rem',
                  fontWeight: 900,
                  margin: '0 0 0.35rem 0',
                  lineHeight: 1.2
                }}>
                  {centreData.name}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                  <span style={{ background: 'rgba(0,0,0,0.25)', padding: '3px 10px', borderRadius: '8px', fontWeight: 800 }}>
                    ID: {centreData.centreId}
                  </span>
                  <span style={{ color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={15} color="#A7F3D0" />
                    {centreData.district}, {centreData.state}
                  </span>
                  <span style={{ color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Phone size={15} color="#A7F3D0" />
                    +91 {centreData.mobile}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              minWidth: '200px'
            }}>
              <div style={{ fontSize: '0.72rem', color: '#A7F3D0', fontWeight: 700, textTransform: 'uppercase' }}>
                Centre Manager
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '2px' }}>
                {centreData.manager}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#E2E8F0' }}>
                {centreData.designation}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          <div className="card" style={{ background: '#FFFFFF', borderRadius: '20px', padding: '1.6rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#064E3B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#059669" />
              {isHindi ? 'बुनियादी ढांचा और क्षमता' : 'Infrastructure & Capacity'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontSize: '0.88rem' }}>Storage Capacity</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{centreData.storageCapacity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontSize: '0.88rem' }}>Loading Bays</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{centreData.loadingBays} Active Bays</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontSize: '0.88rem' }}>Live Counters</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>4 Verification Desks</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontSize: '0.88rem' }}>Operating Hours</span>
                <span style={{ fontWeight: 700, color: '#1E293B' }}>{centreData.openingTime} - {centreData.closingTime}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ background: '#FFFFFF', borderRadius: '20px', padding: '1.6rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#064E3B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#059669" />
              {isHindi ? 'प्राधिकरण एवं समर्थित फसलें' : 'Authorization & Crops'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontSize: '0.88rem' }}>Authorization No.</span>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.85rem' }}>{centreData.authorizationNo}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>Supported Procurement Crops:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {['Wheat', 'Paddy', 'Mustard', 'Maize', 'Soybean'].map((crop, i) => (
                    <span key={i} style={{ background: '#ECFDF5', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, border: '1px solid #A7F3D0' }}>
                      🌾 {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.25rem'
        }}
        onClick={() => setShowEditModal(false)}
        >
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '2rem', maxWidth: '480px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#064E3B', margin: '0 0 1.25rem 0' }}>
              Edit Centre Details
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Centre Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Manager Name</label>
                <input type="text" value={formData.manager} onChange={e => setFormData({ ...formData, manager: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Mobile Number</label>
                <input type="tel" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="input-field" maxLength={10} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CentreProfile;
