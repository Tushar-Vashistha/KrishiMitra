import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/api';
import { mockUser } from '../../data/mockData';
import { 
  Phone, Shield, ArrowLeft, Wheat, Building2, 
  Lock, Eye, EyeOff, Sparkles, RefreshCw
} from 'lucide-react';

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const { login, user, logout } = useAuth();
  const navigate = useNavigate();

  // Mode: 'otp' | 'password'
  const [loginMode, setLoginMode] = useState('otp');
  const [role, setRole] = useState('farmer');
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receivedOtp, setReceivedOtp] = useState('123456');

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Clean and sanitize 10-digit mobile number from any input
  const getCleanMobile = (num) => {
    return (num || '').toString().replace(/\D/g, '').slice(-10);
  };

  // 1-Click Quick Demo Login
  const handleQuickDemoLogin = async (demoMobile) => {
    setError('');
    setLoading(true);
    const targetRole = demoMobile === '9876543210' ? 'farmer' : 'centre';
    
    // Instant responsive login state
    const fallbackProfile = {
      mobile: demoMobile,
      name: targetRole === 'farmer' ? mockUser.farmer.name : (mockUser.centre.manager || mockUser.centre.name),
      nameHi: targetRole === 'farmer' ? mockUser.farmer.nameHi : (mockUser.centre.managerHi || mockUser.centre.nameHi),
      farmerId: demoMobile,
      centreId: mockUser.centre.id || 1,
      centreCode: mockUser.centre.centreId || 'UP-LKO-001',
      centreName: mockUser.centre.name,
      centreNameHi: mockUser.centre.nameHi,
      role: targetRole,
    };

    try {
      const res = await authService.login(demoMobile, 'password123');
      if (res && res.success && res.data) {
        login(targetRole, res.data);
      } else {
        login(targetRole, fallbackProfile);
      }
    } catch (err) {
      console.warn('Backend login fallback to local mock profile:', err);
      login(targetRole, fallbackProfile);
    } finally {
      setLoading(false);
    }
    navigate(targetRole === 'farmer' ? '/farmer/dashboard' : '/centre/dashboard', { replace: true });
  };

  // Handle Send OTP
  const handleSendOTP = async () => {
    const clean = getCleanMobile(mobile);
    if (clean.length !== 10) {
      setError(isHindi ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);
    setReceivedOtp('123456');

    try {
      const res = await authService.requestOTP(clean);
      if (res && res.otp) {
        setReceivedOtp(res.otp.toString());
      }
    } catch (err) {
      console.warn('OTP request fallback:', err);
      setReceivedOtp('123456');
    } finally {
      setLoading(false);
      setStep(2);
      setTimer(60);
    }
  };

  // Auto-fill demo OTP code in one click
  const handleAutoFillOtp = (codeToFill) => {
    const digits = (codeToFill || receivedOtp || '123456').toString().split('').slice(0, 6);
    while (digits.length < 6) digits.push('0');
    setOtp(digits);
    setError('');
    document.getElementById('otp-5')?.focus();
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

  // Handle OTP Verification and Login
  const handleVerify = async () => {
    const code = otp.join('');
    const clean = getCleanMobile(mobile);
    if (code.length !== 6) {
      setError(isHindi ? 'कृपया 6 अंकों का पूरा OTP दर्ज करें।' : 'Please enter the complete 6-digit OTP.');
      return;
    }
    setError('');
    setLoading(true);
    const targetRole = role === 'farmer' ? 'farmer' : 'centre';

    const fallbackProfile = {
      mobile: clean,
      name: role === 'farmer' ? mockUser.farmer.name : (mockUser.centre.manager || mockUser.centre.name),
      nameHi: role === 'farmer' ? mockUser.farmer.nameHi : (mockUser.centre.managerHi || mockUser.centre.nameHi),
      farmerId: clean,
      centreId: mockUser.centre.id || 1,
      centreCode: mockUser.centre.centreId || 'UP-LKO-001',
      centreName: mockUser.centre.name,
      centreNameHi: mockUser.centre.nameHi,
      role: targetRole,
    };

    try {
      // 1. Verify OTP with backend
      await authService.verifyOTP(clean, code);
      // 2. Perform authenticated login
      const res = await authService.login(clean, 'password123');
      if (res && res.success && res.data) {
        login(targetRole, res.data);
      } else {
        login(targetRole, fallbackProfile);
      }
    } catch (err) {
      console.warn('Backend login fallback on OTP verify:', err);
      login(targetRole, fallbackProfile);
    } finally {
      setLoading(false);
    }
    navigate(targetRole === 'farmer' ? '/farmer/dashboard' : '/centre/dashboard', { replace: true });
  };

  // Handle Direct Password Login
  const handlePasswordLogin = async (e) => {
    if (e) e.preventDefault();
    const clean = getCleanMobile(mobile);
    if (clean.length !== 10) {
      setError(isHindi ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError(isHindi ? 'कृपया अपना पासवर्ड दर्ज करें।' : 'Please enter your password.');
      return;
    }

    setError('');
    setLoading(true);
    const targetRole = role === 'farmer' ? 'farmer' : 'centre';

    const fallbackProfile = {
      mobile: clean,
      name: role === 'farmer' ? mockUser.farmer.name : (mockUser.centre.manager || mockUser.centre.name),
      nameHi: role === 'farmer' ? mockUser.farmer.nameHi : (mockUser.centre.managerHi || mockUser.centre.nameHi),
      farmerId: clean,
      centreId: mockUser.centre.id || 1,
      centreCode: mockUser.centre.centreId || 'UP-LKO-001',
      centreName: mockUser.centre.name,
      centreNameHi: mockUser.centre.nameHi,
      role: targetRole,
    };

    try {
      const res = await authService.login(clean, password);
      if (res && res.success && res.data) {
        login(targetRole, res.data);
      } else {
        login(targetRole, fallbackProfile);
      }
      navigate(targetRole === 'farmer' ? '/farmer/dashboard' : '/centre/dashboard', { replace: true });
    } catch (err) {
      console.warn('Password login error, using fallback if password matches default:', err);
      if (password === 'password123' || !err.status || err.status >= 500) {
        login(targetRole, fallbackProfile);
        navigate(targetRole === 'farmer' ? '/farmer/dashboard' : '/centre/dashboard', { replace: true });
      } else {
        setError(err.message || (isHindi ? 'अमान्य मोबाइल नंबर या पासवर्ड।' : 'Invalid mobile number or password.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 50%, #ECFDF5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      
      {/* Decorative Blur Orbs */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px', width: '380px', height: '380px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px', width: '380px', height: '380px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#FFFFFF',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(34, 197, 94, 0.1)',
        padding: '2.25rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Centered Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <img
            src="/logo.png"
            alt="KrishiMitra Logo"
            style={{
              width: 58,
              height: 58,
              objectFit: 'contain',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '4px',
              background: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
            }}
          />
        </div>

        {/* Title & Tagline */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0' }}>
            {isHindi ? 'कृषिमित्र में लॉगिन करें' : 'Login to KrishiMitra'}
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
            {isHindi 
              ? 'MSP स्लॉट बुकिंग व लाइव टोकन ट्रैकिंग प्लेटफॉर्म' 
              : 'MSP crop procurement slot booking & live queue platform'}
          </p>
        </div>

        {/* If already logged in, offer quick navigation or switch */}
        {user && (
          <div style={{
            backgroundColor: '#ECFDF5',
            border: '1.5px solid #86EFAC',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.82rem', color: '#065F46', fontWeight: 700 }}>
              {isHindi ? 'आप पहले से लॉगिन हैं:' : 'Currently logged in as:'} <strong>{user.name || user.mobile}</strong> ({user.role === 'farmer' ? (isHindi ? 'किसान' : 'Farmer') : (isHindi ? 'खरीद केंद्र' : 'Centre')})
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => navigate(user.role === 'farmer' ? '/farmer/dashboard' : '/centre/dashboard')}
                className="btn-primary"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '8px' }}
              >
                {t('dashboard')} →
              </button>
              <button
                type="button"
                onClick={logout}
                style={{
                  padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '8px',
                  backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', color: '#DC2626',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >
                {t('logout')}
              </button>
            </div>
          </div>
        )}

        {/* Login Method Toggle: OTP vs Password */}
        {step === 1 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '1.25rem'
          }}>
            <button
              type="button"
              onClick={() => { setLoginMode('otp'); setError(''); }}
              style={{
                padding: '0.55rem',
                borderRadius: '8px',
                border: 'none',
                background: loginMode === 'otp' ? '#FFFFFF' : 'transparent',
                color: loginMode === 'otp' ? '#0F172A' : '#64748B',
                fontWeight: loginMode === 'otp' ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: loginMode === 'otp' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              📱 {isHindi ? 'OTP से लॉगिन' : 'OTP Login'}
            </button>

            <button
              type="button"
              onClick={() => { setLoginMode('password'); setError(''); }}
              style={{
                padding: '0.55rem',
                borderRadius: '8px',
                border: 'none',
                background: loginMode === 'password' ? '#FFFFFF' : 'transparent',
                color: loginMode === 'password' ? '#0F172A' : '#64748B',
                fontWeight: loginMode === 'password' ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: loginMode === 'password' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🔑 {isHindi ? 'पासवर्ड से लॉगिन' : 'Password Login'}
            </button>
          </div>
        )}

        {step === 1 && (
          <>
            {/* Role Selector: Farmer vs Centre */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: '#334155', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                {t('selectRole')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  style={{
                    padding: '0.8rem 0.6rem',
                    background: role === 'farmer' ? '#ECFDF5' : '#F8FAFC',
                    border: `2px solid ${role === 'farmer' ? '#10B981' : '#E2E8F0'}`,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: role === 'farmer' ? '0 4px 12px rgba(16, 185, 129, 0.12)' : 'none'
                  }}
                >
                  <Wheat size={22} color={role === 'farmer' ? '#059669' : '#64748B'} style={{ marginBottom: '0.25rem' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: role === 'farmer' ? '#065F46' : '#334155' }}>
                    {t('farmer')}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('centre')}
                  style={{
                    padding: '0.8rem 0.6rem',
                    background: role === 'centre' ? '#EFF6FF' : '#F8FAFC',
                    border: `2px solid ${role === 'centre' ? '#3B82F6' : '#E2E8F0'}`,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: role === 'centre' ? '0 4px 12px rgba(59, 130, 246, 0.12)' : 'none'
                  }}
                >
                  <Building2 size={22} color={role === 'centre' ? '#1D4ED8' : '#64748B'} style={{ marginBottom: '0.25rem' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: role === 'centre' ? '#1E40AF' : '#334155' }}>
                    {t('procurementCentre')}
                  </div>
                </button>
              </div>
            </div>

            {/* Mobile Input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: '#334155', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                {t('mobileNumber')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                  fontWeight: 800, color: '#059669', fontSize: '0.95rem',
                }}>+91</span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(-10))}
                  placeholder={t('enterMobile')}
                  className="input-field"
                  style={{ paddingLeft: '3.5rem', fontWeight: 700 }}
                  maxLength={10}
                />
              </div>
            </div>

            {/* Password Input (If in Password Mode) */}
            {loginMode === 'password' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ color: '#334155', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isHindi ? 'पासवर्ड' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword('password123')}
                    style={{
                      background: 'none', border: 'none', color: '#059669',
                      fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', padding: 0
                    }}
                  >
                    ⚡ Auto-fill Demo
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                    color: '#64748B'
                  }}>
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isHindi ? 'पासवर्ड दर्ज करें (उदा. password123)' : 'Enter password (e.g. password123)'}
                    className="input-field"
                    style={{ paddingLeft: '3rem', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div style={{
                background: '#FEF2F2', color: '#DC2626',
                padding: '0.65rem 0.9rem', borderRadius: '12px',
                fontSize: '0.82rem', marginBottom: '1rem', border: '1px solid #FECACA',
                fontWeight: 700
              }}>
                {error}
              </div>
            )}

            {/* Primary Submit Button */}
            {loginMode === 'otp' ? (
              <button
                type="button"
                onClick={handleSendOTP}
                className="btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', borderRadius: '14px' }}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <RefreshCw size={18} className="animate-spin" /> {isHindi ? 'OTP भेजा जा रहा है...' : 'Sending OTP...'}
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <Phone size={18} /> {t('sendOTP')}
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePasswordLogin}
                className="btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', borderRadius: '14px' }}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <RefreshCw size={18} className="animate-spin" /> {isHindi ? 'लॉगिन हो रहा है...' : 'Logging in...'}
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <Lock size={18} /> {t('loginBtn')}
                  </span>
                )}
              </button>
            )}

            {/* Quick 1-Click Demo Accounts */}
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #F1F5F9',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} color="#059669" />
                <span>{isHindi ? '1-क्लिक त्वरित डेमो लॉगिन' : '1-Click Quick Demo Login'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* Farmer Demo */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('9876543210')}
                  disabled={loading}
                  style={{
                    background: '#F0FDF4', border: '1.5px solid #86EFAC', color: '#166534',
                    padding: '0.65rem 1rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DCFCE7'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F0FDF4'}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wheat size={16} /> 🌾 {isHindi ? 'किसान डेमो खाता' : 'Farmer Demo'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#15803D', fontWeight: 700 }}>
                    9876543210 →
                  </span>
                </button>

                {/* Centre Manager Demo */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('9876500001')}
                  disabled={loading}
                  style={{
                    background: '#EFF6FF', border: '1.5px solid #93C5FD', color: '#1E40AF',
                    padding: '0.65rem 1rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={16} /> 🏢 {isHindi ? 'केंद्र प्रबंधक डेमो' : 'Centre Manager Demo'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#1D4ED8', fontWeight: 700 }}>
                    9876500001 →
                  </span>
                </button>
              </div>
            </div>

            {/* Registration link */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#64748B' }}>
              {t('noAccount')}{' '}
              <Link to="/register" style={{ color: '#059669', fontWeight: 800, textDecoration: 'none' }}>
                {t('registerHere')}
              </Link>
            </div>
          </>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 2 && (
          <>
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(''); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                color: '#059669', fontWeight: 800, marginBottom: '1.25rem', padding: 0,
                fontSize: '0.85rem'
              }}
            >
              <ArrowLeft size={16} /> {isHindi ? 'वापस जाएं' : 'Back'}
            </button>

            {/* OTP sent banner + Clickable auto-fill demo badge */}
            <div style={{
              background: '#ECFDF5', borderRadius: '14px',
              padding: '1rem', marginBottom: '1.5rem',
              border: '1.5px solid #A7F3D0', color: '#065F46', fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                <Shield size={16} />
                <span>{t('otpSent')} <strong>+91 {mobile}</strong></span>
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#047857' }}>
                  {isHindi ? 'डेमो कोड:' : 'Demo Code:'} <strong>{receivedOtp}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => handleAutoFillOtp(receivedOtp)}
                  style={{
                    backgroundColor: '#10B981', color: '#FFFFFF',
                    border: 'none', borderRadius: '8px', padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  ⚡ Auto-fill
                </button>
              </div>
            </div>

            {/* 6-Digit OTP Inputs */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#334155', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '0.04em' }}>
                {t('enterOTP')}
              </label>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
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
                      fontSize: '1.3rem', fontWeight: 900,
                      border: `2px solid ${digit ? '#10B981' : '#CBD5E1'}`,
                      borderRadius: '12px', outline: 'none',
                      background: digit ? '#F0FDF4' : '#FFFFFF',
                      color: '#065F46', transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#FEF2F2', color: '#DC2626',
                padding: '0.65rem 0.9rem', borderRadius: '12px',
                fontSize: '0.82rem', marginBottom: '1rem', border: '1px solid #FECACA',
                fontWeight: 700, textAlign: 'center'
              }}>{error}</div>
            )}

            {/* Verify Button */}
            <button
              type="button"
              onClick={handleVerify}
              className="btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', borderRadius: '14px' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <RefreshCw size={18} className="animate-spin" /> {isHindi ? 'सत्यापित हो रहा है...' : 'Verifying...'}
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <Shield size={18} /> {t('verifyOTP')}
                </span>
              )}
            </button>

            {/* Resend Timer */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.82rem', color: '#64748B' }}>
              {timer > 0 ? (
                <span>{isHindi ? 'पुनः कोड भेजें:' : 'Resend code in'} <strong>{timer}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  style={{
                    background: 'none', border: 'none', color: '#059669',
                    fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem'
                  }}
                >
                  {t('resendOTP')}
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
