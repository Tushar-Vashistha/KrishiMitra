import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wheat, Building2, ArrowRight, ArrowLeft } from 'lucide-react';

const RegisterSelection = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F5F0 0%, #E8F5E9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}>
        {/* Top bar */}
        <div style={{
          background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
        }}>
          <img
            src="/logo.png"
            alt="KrishiMitra Logo"
            style={{
              width: 52, height: 52, objectFit: 'contain',
              borderRadius: '12px', background: '#FFFFFF', padding: '3px',
              margin: '0 auto 0.75rem', display: 'block',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: '1.4rem', margin: 0 }}>
            {isHindi ? 'पंजीकरण करें' : 'Create Account'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            {isHindi ? 'आप किस रूप में पंजीकरण करना चाहते हैं?' : 'Who are you registering as?'}
          </p>
        </div>

        <div style={{ padding: '2rem 1.5rem' }}>
          <p style={{
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            marginTop: 0,
          }}>
            {isHindi
              ? 'अपना प्रकार चुनें और आगे बढ़ें'
              : 'Select your account type to continue'}
          </p>

          {/* Option cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Farmer */}
            <Link
              to="/register/farmer"
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.25rem 1.25rem',
                background: '#F9FFF9',
                border: '2px solid #E8F5E9',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#E8F5E9';
                  e.currentTarget.style.borderColor = '#2E7D32';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(46,125,50,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#F9FFF9';
                  e.currentTarget.style.borderColor = '#E8F5E9';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 56, height: 56, flexShrink: 0,
                  background: '#E8F5E9',
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #A5D6A7',
                }}>
                  <Wheat size={28} color="#2E7D32" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1C1C1C' }}>
                    {isHindi ? '🌾 किसान' : '🌾 Farmer'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>
                    {isHindi
                      ? 'स्लॉट बुक करें, फसल ट्रैक करें, भुगतान पाएं'
                      : 'Book slots, track crops, get paid instantly'}
                  </div>
                </div>
                <ArrowRight size={20} color="#2E7D32" />
              </div>
            </Link>

            {/* Procurement Centre */}
            <Link
              to="/register/centre"
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.25rem 1.25rem',
                background: '#F0F7FF',
                border: '2px solid #E3F2FD',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#E3F2FD';
                  e.currentTarget.style.borderColor = '#1565C0';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(21,101,192,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#F0F7FF';
                  e.currentTarget.style.borderColor = '#E3F2FD';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 56, height: 56, flexShrink: 0,
                  background: '#E3F2FD',
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #90CAF9',
                }}>
                  <Building2 size={28} color="#1565C0" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1C1C1C' }}>
                    {isHindi ? '🏢 खरीद केंद्र' : '🏢 Procurement Centre'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>
                    {isHindi
                      ? 'बुकिंग, काउंटर और भुगतान प्रबंधित करें'
                      : 'Manage bookings, counters & payments'}
                  </div>
                </div>
                <ArrowRight size={20} color="#1565C0" />
              </div>
            </Link>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            margin: '1.75rem 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
            <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
              {isHindi ? 'पहले से खाता है?' : 'Already have an account?'}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
          </div>

          <Link
            to="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #2E7D32',
              borderRadius: '10px',
              color: '#2E7D32',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              background: 'transparent',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E8F5E9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowLeft size={16} />
            {isHindi ? 'लॉगिन करें' : 'Login Instead'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterSelection;
