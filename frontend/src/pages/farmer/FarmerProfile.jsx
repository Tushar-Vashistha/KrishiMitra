import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { farmerService } from '../../services/api';
import { mockUser } from '../../data/mockData';
import {
  User, Phone, ShieldCheck, Copy, Check,
  Edit3, ArrowLeft, CheckCircle2, QrCode
} from 'lucide-react';

const FarmerProfile = () => {
  const { i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const isHindi = i18n.language === 'hi';

  const farmerData = {
    ...mockUser.farmer,
    ...(user || {}),
  };

  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await farmerService.getProfile();
        if (res.success && res.data) {
          const profile = res.data;
          updateUser({
            name: profile.name,
            village: profile.village,
            tehsil: profile.tehsil,
            district: profile.district,
            state: profile.state,
            pincode: profile.pincode,
            khasraNumber: profile.khasraNumber,
            landOwnerName: profile.landOwnerName,
            bankName: profile.bankName,
            accountNumber: profile.accountNumberMasked,
            ifscCode: profile.ifscCode,
            status: profile.status,
            trustScore: profile.trustScore,
            farmerId: profile.aadhaarMasked
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    loadProfile();
  }, []);

  // Edit form state with strictly Name, Mobile, Farmer ID
  const [formData, setFormData] = useState({
    name: farmerData.name || 'Ramesh Kumar',
    mobile: farmerData.mobile || '9876543210',
    farmerId: farmerData.farmerId || 'UP-FARM-9021',
  });

  const handleCopyFarmerId = () => {
    navigator.clipboard.writeText(farmerData.farmerId || 'UP-FARM-9021');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await farmerService.updateProfile({ name: formData.name });
      if (updateUser) {
        updateUser(formData);
      }
      setShowEditModal(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)',
      padding: '2rem 1rem 5rem 1rem'
    }}>
      <div className="container" style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Back Link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate('/farmer/dashboard')}
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
            onClick={() => {
              setFormData({
                name: farmerData.name || 'Ramesh Kumar',
                mobile: farmerData.mobile || '9876543210',
                farmerId: farmerData.farmerId || 'UP-FARM-9021',
              });
              setShowEditModal(true);
            }}
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
            {isHindi ? 'संपादित करें' : 'Edit Details'}
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
            {isHindi ? 'विवरण सफलतापूर्वक अपडेट हो गया!' : 'Profile details updated successfully!'}
          </div>
        )}

        {/* Main Farmer Profile Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          boxShadow: '0 15px 35px -10px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(16, 185, 129, 0.12)',
          border: '1px solid #E2E8F0',
        }}>
          
          {/* Header & Avatar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #F1F5F9'
          }}>
            <div style={{
              width: 88,
              height: 88,
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
              border: '3px solid #10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              marginBottom: '1rem',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)'
            }}>
              👨‍🌾
            </div>

            <span style={{
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#166534',
              padding: '3px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem'
            }}>
              🌾 {isHindi ? 'किसान प्रोफ़ाइल विवरण' : 'FARMER PROFILE DETAILS'}
            </span>

            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#064E3B',
              margin: '0',
              lineHeight: 1.2
            }}>
              {isHindi ? (farmerData.nameHi || (farmerData.name === 'Ramesh Kumar' || !farmerData.name ? 'रमेश कुमार' : farmerData.name)) : (farmerData.name || 'Ramesh Kumar')}
            </h1>
          </div>

          {/* Strictly 3 Details: Name, Mobile, Farmer ID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* 1. Name */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '16px',
              padding: '1.2rem 1.4rem',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  flexShrink: 0
                }}>
                  <User size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isHindi ? 'किसान का नाम' : 'Farmer Name'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                    {isHindi ? (farmerData.nameHi || (farmerData.name === 'Ramesh Kumar' || !farmerData.name ? 'रमेश कुमार' : farmerData.name)) : (farmerData.name || 'Ramesh Kumar')}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Mobile Number */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '16px',
              padding: '1.2rem 1.4rem',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  flexShrink: 0
                }}>
                  <Phone size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isHindi ? 'मोबाइल नंबर' : 'Mobile Number'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                    +91 {farmerData.mobile || '9876543210'}
                  </div>
                </div>
              </div>
              <span style={{
                background: '#DCFCE7',
                color: '#15803D',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: '1px solid #86EFAC'
              }}>
                {isHindi ? 'सत्यापित' : 'Verified'}
              </span>
            </div>

            {/* 3. Farmer ID */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '16px',
              padding: '1.2rem 1.4rem',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isHindi ? 'किसान आईडी' : 'Farmer ID'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#064E3B', marginTop: '2px', letterSpacing: '0.02em' }}>
                    {farmerData.farmerId || 'UP-FARM-9021'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopyFarmerId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: copied ? '#DCFCE7' : '#FFFFFF',
                  color: copied ? '#15803D' : '#334155',
                  border: `1.5px solid ${copied ? '#86EFAC' : '#CBD5E1'}`,
                  padding: '0.45rem 0.9rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {copied ? <Check size={14} color="#15803D" /> : <Copy size={14} />}
                {copied ? (isHindi ? 'कॉपी हो गया' : 'Copied!') : (isHindi ? 'आईडी कॉपी करें' : 'Copy ID')}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Edit Profile Modal (Strictly Name, Mobile, Farmer ID) */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.25rem',
          backdropFilter: 'blur(6px)'
        }}
        onClick={() => setShowEditModal(false)}
        >
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}
          onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#064E3B', margin: 0 }}>
                {isHindi ? 'विवरण संपादित करें' : 'Edit Profile Details'}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
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
                  color: '#64748B',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* 1. Name */}
              <div>
                <label className="input-label" style={{ fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                  {isHindi ? 'किसान का नाम' : 'Farmer Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder={isHindi ? "उदा. रमेश कुमार" : "e.g. Ramesh Kumar"}
                />
              </div>

              {/* 2. Mobile Number */}
              <div>
                <label className="input-label" style={{ fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                  {isHindi ? 'मोबाइल नंबर' : 'Mobile Number'} *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="input-field"
                  placeholder="10-digit mobile"
                />
              </div>

              {/* 3. Farmer ID */}
              <div>
                <label className="input-label" style={{ fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                  {isHindi ? 'किसान आईडी' : 'Farmer ID'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.farmerId}
                  onChange={e => setFormData({ ...formData, farmerId: e.target.value })}
                  className="input-field"
                  placeholder="UP-FARM-9021"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-outline"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <CheckCircle2 size={16} /> {isHindi ? 'सहेजें' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FarmerProfile;
