import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/api';
import { mockUser } from '../../data/mockData';
import { Phone, Shield, ArrowLeft, Wheat, Building2, ChevronRight, CheckCircle2, Lock } from 'lucide-react';

const LOGIN_HERO = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80&auto=format&fit=crop';

const LoginPage = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('farmer');
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receivedOtp, setReceivedOtp] = useState('');

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSendOTP = async () => {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authService.requestOTP(cleanMobile);
      if (res.success) {
        setStep(2);
        setTimer(60);
        setReceivedOtp(res.otp || '123456');
      } else {
        setError(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val;
    setOtp(newOtp);
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const handleQuickDemoLogin = async (demoMobile) => {
    setError('');
    setLoading(true);
    try {
      const loginRes = await authService.login(demoMobile, 'password123');
      if (loginRes.success && loginRes.data) {
        const mappedRole = loginRes.data.user.role === 'FARMER' ? 'farmer' : 'centre';
        login(mappedRole, loginRes.data);
        navigate(loginRes.data.user.role === 'FARMER' ? '/farmer/dashboard' : '/centre/dashboard');
      } else {
        setError('Quick demo login failed.');
      }
    } catch (err) {
      setError(err.message || 'Quick demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // 1. Attempt Backend OTP verification
      try {
        await authService.verifyOTP(cleanMobile, code);
      } catch (otpErr) {
        // Reject invalid non-demo OTPs
        if (code !== '123456' && code !== receivedOtp) {
          throw otpErr;
        }
      }

      // 2. Perform Backend Login
      try {
        const loginRes = await authService.login(cleanMobile, 'password123');
        if (loginRes.success && loginRes.data) {
          const mappedRole = loginRes.data.user.role === 'FARMER' ? 'farmer' : (role === 'centre' ? 'centre' : 'farmer');
          login(mappedRole, loginRes.data);
          navigate(mappedRole === 'farmer' ? '/farmer/dashboard' : '/centre/dashboard');
          return;
        }
      } catch (loginErr) {
        console.warn('Backend login fallback warning:', loginErr);
      }

      // 3. Fallback direct login for seamless demo access on deployed site
      const targetRole = role === 'farmer' ? 'farmer' : 'centre';
      login(targetRole, {
        mobile: cleanMobile,
        name: role === 'farmer' ? mockUser.farmer.name : mockUser.centre.managerName,
        farmerId: cleanMobile,
        role: targetRole,
      });
      navigate(targetRole === 'farmer' ? '/farmer/dashboard' : '/centre/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please enter demo OTP 123456.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0FDF4 0%, #E2E8F0 50%, #ECFDF5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Decorative Circles */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px', width: '450px', height: '450px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-100px', width: '450px', height: '450px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#FFFFFF',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(34, 197, 94, 0.1)',
        padding: '2.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}>
        {/* Centered Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <img
            src="/logo.png"
            alt="KrishiMitra Logo"
            style={{
              width: 64,
              height: 64,
              objectFit: 'contain',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              padding: '4px',
              background: '#FFFFFF',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
            }}
          />
        </div>

        {/* Centered Header */}
        <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14532D', margin: '0 0 0.35rem 0' }}>
            Login to KrishiMitra
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
            Enter mobile number to receive secure OTP
          </p>
        </div>

        {step === 1 && (
          <>
            {/* Role Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="input-label" style={{ color: '#334155', fontSize: '0.9rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                I am a...
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  style={{
                    padding: '0.85rem 0.6rem',
                    background: role === 'farmer' ? 'linear-gradient(135deg, #ECFDF5 0%, #DCFCE7 100%)' : '#F8FAFC',
                    border: `2px solid ${role === 'farmer' ? '#22C55E' : '#E2E8F0'}`,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Wheat size={22} color={role === 'farmer' ? '#15803D' : '#64748B'} style={{ marginBottom: '0.3rem' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: role === 'farmer' ? '#14532D' : '#334155' }}>
                    {t('farmer')}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('centre')}
                  style={{
                    padding: '0.85rem 0.6rem',
                    background: role === 'centre' ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' : '#F8FAFC',
                    border: `2px solid ${role === 'centre' ? '#3B82F6' : '#E2E8F0'}`,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={22} color={role === 'centre' ? '#1D4ED8' : '#64748B'} style={{ marginBottom: '0.3rem' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: role === 'centre' ? '#1E3A8A' : '#334155' }}>
                    {t('procurementCentre')}
                  </div>
                </button>
              </div>
            </div>

            {/* Mobile Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="input-label" style={{ color: '#334155', fontSize: '0.9rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                  fontWeight: 700, color: '#15803D', fontSize: '0.95rem',
                }}>+91</span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/, '').slice(0, 10))}
                  placeholder={t('enterMobile')}
                  className="input-field"
                  style={{ paddingLeft: '3.5rem' }}
                  maxLength={10}
                />
              </div>
            </div>

            {error && (
              <div style={{
                background: '#FEE2E2', color: '#DC2626',
                padding: '0.65rem 0.9rem', borderRadius: '10px',
                fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid #FCA5A5'
              }}>{error}</div>
            )}

            <button
              onClick={handleSendOTP}
              className="btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : <><Phone size={18} /> {t('sendOTP')}</>}
            </button>

            {/* Quick 1-Click Demo Accounts */}
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #E2E8F0',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚡ 1-Click Quick Demo Login
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('9876543210')}
                  disabled={loading}
                  style={{
                    background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534',
                    padding: '0.6rem 0.85rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Wheat size={16} /> 🌾 Farmer Demo
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>9876543210 →</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('9876500001')}
                  disabled={loading}
                  style={{
                    background: '#EFF6FF', border: '1px solid #93C5FD', color: '#1E40AF',
                    padding: '0.6rem 0.85rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={16} /> 🏢 Centre Manager Demo
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>9876500001 →</span>
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.88rem', color: '#64748B' }}>
              {t('noAccount')}{' '}
              <Link to="/register" style={{ color: '#15803D', fontWeight: 700, textDecoration: 'none' }}>
                {t('registerHere')}
              </Link>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <button
              onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(''); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                color: '#15803D', fontWeight: 700, marginBottom: '1rem', padding: 0
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>

            <div style={{
              background: '#ECFDF5', borderRadius: '12px',
              padding: '0.85rem 1rem', marginBottom: '1.5rem',
              border: '1px solid #A7F3D0', color: '#065F46', fontSize: '0.88rem'
            }}>
              <Shield size={16} style={{ display: 'inline', marginRight: '0.4rem' }} />
              OTP sent to <strong>+91 {mobile}</strong><br />
              Demo Verification Code: <strong style={{ color: '#15803D' }}>{receivedOtp}</strong>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">{t('enterOTP')}</label>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="tel"
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    maxLength={1}
                    style={{
                      width: 44, height: 50, textAlign: 'center',
                      fontSize: '1.25rem', fontWeight: 800,
                      border: `2px solid ${digit ? '#22C55E' : '#CBD5E1'}`,
                      borderRadius: '12px', outline: 'none',
                      background: digit ? '#F0FDF4' : 'white',
                      color: '#15803D', transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                background: '#FEE2E2', color: '#DC2626',
                padding: '0.65rem 0.9rem', borderRadius: '10px',
                fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid #FCA5A5'
              }}>{error}</div>
            )}

            <button
              onClick={handleVerify}
              className="btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : <><Shield size={18} /> {t('verifyOTP')}</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
