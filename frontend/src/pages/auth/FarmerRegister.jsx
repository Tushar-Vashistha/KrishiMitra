import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/api';
import {
  CheckCircle, Shield, ArrowLeft, RefreshCw,
  Sparkles, Check, AlertCircle, FileText
} from 'lucide-react';

const FarmerRegister = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const { login } = useAuth();
  const navigate = useNavigate();

  const [farmerId, setFarmerId] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Enter ID & Mobile, 2 = Enter OTP
  const [timer, setTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receivedOtp, setReceivedOtp] = useState('123456');
  const [submitted, setSubmitted] = useState(false);
  const [farmerPreview, setFarmerPreview] = useState(null);

  // Demo suggestions for easy testing / SIH evaluator presentation
  const demoFarmerPills = [
    { id: 'FRM123456', name: 'Ramesh Kumar', location: 'Lucknow, UP' },
    { id: 'FRM789012', name: 'Suresh Patel', location: 'Varanasi, UP' },
    { id: 'FRM345678', name: 'Kamla Bai', location: 'Indore, MP' },
  ];

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const cleanMobile = (val) => (val || '').toString().replace(/\D/g, '').slice(-10);
  const cleanFarmerId = (val) => (val || '').toString().trim().toUpperCase();

  // Validate format and send OTP
  const handleSendOTP = async () => {
    setErrorMsg('');
    const id = cleanFarmerId(farmerId);
    const mob = cleanMobile(mobile);

    // 1. Farmer ID validation
    if (!id) {
      setErrorMsg(isHindi ? 'कृपया किसान आईडी (Farmer ID) दर्ज करें।' : 'Please enter your Farmer ID.');
      return;
    }
    if (id.length < 4 || !/^[A-Z0-9-]+$/.test(id)) {
      setErrorMsg(isHindi ? 'किसान आईडी नहीं मिली। कृपया एक वैध किसान आईडी दर्ज करें।' : 'Farmer ID not found. Please enter a valid Farmer ID.');
      return;
    }

    // 2. Mobile validation
    if (!mob || mob.length !== 10) {
      setErrorMsg(isHindi ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setSendingOtp(true);

    try {
      // First, validate Farmer ID against backend registry
      try {
        const valRes = await authService.validateFarmerId(id);
        if (valRes && valRes.data) {
          setFarmerPreview(valRes.data);
        }
      } catch (valErr) {
        // If Farmer ID not found or invalid format
        const msg = valErr?.message || '';
        if (msg.includes('not found') || valErr?.status === 404) {
          setErrorMsg(isHindi ? 'किसान आईडी नहीं मिली। कृपया एक वैध किसान आईडी दर्ज करें।' : 'Farmer ID not found. Please enter a valid Farmer ID.');
        } else {
          setErrorMsg(msg || (isHindi ? 'किसान आईडी सत्यापन विफल हुआ।' : 'Farmer ID verification failed.'));
        }
        setSendingOtp(false);
        return;
      }

      // Request OTP from backend with mobile and farmerId
      const otpRes = await authService.requestOTP(mob, id);
      if (otpRes && otpRes.success) {
        setReceivedOtp(otpRes.otp ? otpRes.otp.toString() : '123456');
        setStep(2);
        setTimer(60);
      } else {
        setErrorMsg(otpRes?.message || (isHindi ? 'OTP भेजने में विफल।' : 'Failed to send OTP.'));
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('not found') || err?.status === 404) {
        setErrorMsg(isHindi ? 'किसान आईडी नहीं मिली। कृपया एक वैध किसान आईडी दर्ज करें।' : 'Farmer ID not found. Please enter a valid Farmer ID.');
      } else if (err?.status === 409 || msg.includes('already registered')) {
        setErrorMsg(msg);
      } else {
        setErrorMsg(msg || (isHindi ? 'सर्वर से कनेक्ट करने में त्रुटि।' : 'Failed to send OTP. Please check details.'));
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP and complete registration
  const handleVerifyAndRegister = async () => {
    setErrorMsg('');
    const id = cleanFarmerId(farmerId);
    const mob = cleanMobile(mobile);
    const enteredOtp = (otp || '').trim();

    if (!enteredOtp || enteredOtp.length !== 6) {
      setErrorMsg(isHindi ? 'कृपया 6 अंकों का पूरा OTP दर्ज करें।' : 'Please enter the complete 6-digit OTP.');
      return;
    }

    setVerifying(true);

    try {
      // Register farmer with ONLY Farmer ID + Mobile + OTP
      const res = await authService.registerFarmer({
        farmerId: id,
        mobile: mob,
        otp: enteredOtp,
      });

      if (res && res.success && res.data) {
        login('farmer', res.data);
        setSubmitted(true);
        setTimeout(() => {
          navigate('/farmer/dashboard', { replace: true });
        }, 1200);
      } else {
        throw new Error(res?.message || 'Registration failed');
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('not found') || err?.status === 404) {
        setErrorMsg(isHindi ? 'किसान आईडी नहीं मिली। कृपया एक वैध किसान आईडी दर्ज करें।' : 'Farmer ID not found. Please enter a valid Farmer ID.');
      } else if (msg.toLowerCase().includes('otp') || err?.status === 400) {
        setErrorMsg(msg || (isHindi ? 'अमान्य अथवा समाप्त OTP। कृपया पुनः प्रयास करें।' : 'Invalid or expired OTP. Please try again.'));
      } else {
        setErrorMsg(msg || (isHindi ? 'पंजीकरण प्रक्रिया में त्रुटि हुई।' : 'Registration failed. Please check details.'));
      }
    } finally {
      setVerifying(false);
    }
  };

  // Success Screen
  if (submitted) {
    return (
      <div style={{
        minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1rem', background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)'
      }}>
        <div style={{
          textAlign: 'center', padding: '2.5rem 2rem', background: '#FFFFFF',
          borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          maxWidth: '440px', width: '100%', border: '1.5px solid #86EFAC'
        }}>
          <div style={{
            width: 76, height: 76, background: '#DCFCE7', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', border: '2px solid #22C55E'
          }}>
            <CheckCircle size={44} color="#16A34A" />
          </div>
          <h2 style={{ color: '#15803D', fontWeight: 800, fontSize: '1.4rem', margin: '0 0 0.5rem' }}>
            {isHindi ? 'पंजीकरण सफल! 🎉' : 'Registration Successful! 🎉'}
          </h2>
          <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
            {isHindi
              ? 'किसान आईडी से पूर्ण विवरण प्राप्त कर डेटाबेस में सुरक्षित सहेज लिया गया है। डैशबोर्ड पर ले जाया जा रहा है...'
              : 'Complete farmer details retrieved using Farmer ID and securely saved in database. Redirecting to your dashboard...'}
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 1rem', background: '#F1F5F9', borderRadius: '999px',
            fontSize: '0.8rem', color: '#64748B', fontWeight: 700
          }}>
            <RefreshCw size={14} className="animate-spin" />
            <span>{isHindi ? 'डैशबोर्ड लोड हो रहा है...' : 'Loading Dashboard...'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 50%, #ECFDF5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative',
    }}>
      {/* Background soft blur accents */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px', width: '340px', height: '340px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px', width: '340px', height: '340px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#FFFFFF',
        borderRadius: '24px',
        boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(34, 197, 94, 0.1)',
        padding: '2.25rem 2rem',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <img
            src="/logo.png"
            alt="KrishiMitra Logo"
            style={{
              width: 56,
              height: 56,
              objectFit: 'contain',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '4px',
              background: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
            }}
          />
        </div>

        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: '1.5rem', fontWeight: 800, color: '#0F172A',
            margin: '0 0 0.35rem', letterSpacing: '-0.02em'
          }}>
            {isHindi ? 'किसान पंजीकरण' : 'Farmer Registration'}
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
            {isHindi
              ? 'किसान आईडी दर्ज करें, विवरण स्वतः प्राप्त होगा'
              : 'Enter your Farmer ID to automatically fetch verified records'}
          </p>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            color: '#DC2626',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Farmer ID & Mobile Number */}
        {step === 1 && (
          <div>
            {/* Field 1: Farmer ID */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                color: '#334155', fontSize: '0.82rem', fontWeight: 800,
                textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem',
                letterSpacing: '0.04em'
              }}>
                {t('farmerId') || 'Farmer ID'} <span style={{ color: '#DC2626' }}>*</span>
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={farmerId}
                  onChange={e => {
                    setFarmerId(e.target.value.toUpperCase());
                    setErrorMsg('');
                  }}
                  placeholder={isHindi ? 'उदा. FRM123456' : 'e.g. FRM123456'}
                  className="input-field"
                  style={{
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                  maxLength={20}
                  disabled={sendingOtp}
                />
              </div>

              {/* Demo Helper Pills for instant testing in SIH presentation */}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{
                  fontSize: '0.72rem', color: '#64748B', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem'
                }}>
                  <Sparkles size={12} color="#059669" />
                  <span>{isHindi ? 'त्वरित डेमो आईडी चुनें:' : 'Quick Demo IDs (Click to fill):'}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {demoFarmerPills.map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => {
                        setFarmerId(pill.id);
                        setErrorMsg('');
                      }}
                      style={{
                        padding: '0.25rem 0.55rem',
                        borderRadius: '8px',
                        background: farmerId === pill.id ? '#DCFCE7' : '#F1F5F9',
                        border: `1px solid ${farmerId === pill.id ? '#22C55E' : '#CBD5E1'}`,
                        color: farmerId === pill.id ? '#15803D' : '#334155',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{pill.id}</span>
                      <span style={{ opacity: 0.65, fontSize: '0.68rem' }}>({pill.name})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Field 2: Mobile Number */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                color: '#334155', fontSize: '0.82rem', fontWeight: 800,
                textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem',
                letterSpacing: '0.04em'
              }}>
                {t('mobileNumber') || 'Mobile Number'} <span style={{ color: '#DC2626' }}>*</span>
              </label>

              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                  fontWeight: 800, color: '#059669', fontSize: '0.95rem',
                }}>+91</span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => {
                    setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setErrorMsg('');
                  }}
                  placeholder={t('enterMobile') || 'Enter 10-digit mobile number'}
                  className="input-field"
                  style={{ paddingLeft: '3.5rem', fontWeight: 700 }}
                  maxLength={10}
                  disabled={sendingOtp}
                />
              </div>
            </div>

            {/* Action 1: Send OTP */}
            <button
              type="button"
              onClick={handleSendOTP}
              className="btn-primary"
              style={{
                width: '100%', padding: '0.85rem', fontSize: '0.95rem',
                borderRadius: '14px', cursor: sendingOtp ? 'not-allowed' : 'pointer',
              }}
              disabled={sendingOtp}
            >
              {sendingOtp ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <RefreshCw size={18} className="animate-spin" />
                  {isHindi ? 'सत्यापित व OTP भेजा जा रहा है...' : 'Validating ID & Sending OTP...'}
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <Shield size={18} />
                  {t('sendOTP') || 'Send OTP'}
                </span>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: OTP Verification & Auto-registration */}
        {step === 2 && (
          <div>
            {/* Back button to edit Farmer ID or Mobile */}
            <button
              type="button"
              onClick={() => { setStep(1); setErrorMsg(''); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                color: '#059669', fontWeight: 800, marginBottom: '1.25rem',
                padding: 0, fontSize: '0.85rem'
              }}
            >
              <ArrowLeft size={16} /> {isHindi ? 'आईडी / मोबाइल बदलें' : 'Edit ID / Mobile'}
            </button>

            {/* OTP notification banner + Verified Farmer badge */}
            <div style={{
              background: '#ECFDF5', borderRadius: '14px',
              padding: '1rem', marginBottom: '1.5rem',
              border: '1.5px solid #A7F3D0', color: '#065F46', fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                <Shield size={16} color="#059669" />
                <span>
                  {isHindi ? 'OTP भेजा गया:' : 'OTP sent to'} <strong>+91 {mobile}</strong>
                </span>
              </div>

              {farmerPreview && (
                <div style={{
                  marginTop: '0.4rem', fontSize: '0.8rem', color: '#047857',
                  borderTop: '1px solid #D1FAE5', paddingTop: '0.4rem'
                }}>
                  👤 {isHindi ? 'किसान:' : 'Farmer:'} <strong>{farmerPreview.name}</strong> ({farmerPreview.district}, {farmerPreview.state})
                </div>
              )}

              {/* Demo Code Auto-fill shortcut */}
              <div style={{
                marginTop: '0.6rem', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem'
              }}>
                <span style={{ fontSize: '0.8rem', color: '#047857' }}>
                  {isHindi ? 'डेमो सत्यापन कोड:' : 'Demo Code:'} <strong>{receivedOtp}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setOtp(receivedOtp || '123456');
                    setErrorMsg('');
                  }}
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

            {/* Field 3: OTP */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                color: '#334155', fontSize: '0.82rem', fontWeight: 800,
                textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem',
                textAlign: 'center', letterSpacing: '0.04em'
              }}>
                {t('enterOTP') || 'Enter 6-digit OTP'} <span style={{ color: '#DC2626' }}>*</span>
              </label>

              <input
                type="tel"
                value={otp}
                onChange={e => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setErrorMsg('');
                }}
                placeholder="123456"
                className="input-field"
                style={{
                  textAlign: 'center',
                  letterSpacing: '0.4em',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#065F46',
                }}
                maxLength={6}
                disabled={verifying}
                autoFocus
              />
            </div>

            {/* Action 2: Verify OTP & Register */}
            <button
              type="button"
              onClick={handleVerifyAndRegister}
              className="btn-primary"
              style={{
                width: '100%', padding: '0.85rem', fontSize: '0.95rem',
                borderRadius: '14px', cursor: verifying ? 'not-allowed' : 'pointer'
              }}
              disabled={verifying}
            >
              {verifying ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <RefreshCw size={18} className="animate-spin" />
                  {isHindi ? 'सत्यापित व सहेजा जा रहा है...' : 'Verifying & Saving to Database...'}
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <Check size={18} />
                  {isHindi ? 'OTP सत्यापित करें व पंजीकरण पूरा करें' : 'Verify OTP & Register'}
                </span>
              )}
            </button>

            {/* Resend Timer */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.82rem', color: '#64748B' }}>
              {timer > 0 ? (
                <span>
                  {isHindi ? 'पुनः कोड भेजें:' : 'Resend code in'} <strong>{timer}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={sendingOtp}
                  style={{
                    background: 'none', border: 'none', color: '#059669',
                    fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem'
                  }}
                >
                  {t('resendOTP') || 'Resend OTP'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Existing account link */}
        <div style={{
          textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem',
          borderTop: '1px solid #F1F5F9', fontSize: '0.85rem', color: '#64748B'
        }}>
          {t('alreadyAccount') || 'Already have an account?'}{' '}
          <Link to="/login" style={{ color: '#059669', fontWeight: 800, textDecoration: 'none' }}>
            {t('loginHere') || 'Login here'}
          </Link>
        </div>

      </div>
    </div>
  );
};

export default FarmerRegister;
