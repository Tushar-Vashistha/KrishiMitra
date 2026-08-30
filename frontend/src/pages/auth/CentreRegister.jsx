import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { mockUser } from '../../data/mockData';
import { Building2, ChevronRight, ChevronLeft, CheckCircle, Upload, X } from 'lucide-react';

const STATES = ["Uttar Pradesh","Madhya Pradesh","Punjab","Haryana","Bihar","Rajasthan","Maharashtra","Gujarat","Andhra Pradesh","Karnataka","Tamil Nadu","West Bengal","Odisha","Chhattisgarh","Jharkhand","Uttarakhand","Himachal Pradesh","Telangana"];
const CROP_LIST = ['Wheat','Paddy','Maize','Mustard','Soybean','Gram (Chana)','Bajra','Jowar'];

const generateCentreId = () => {
  const state = 'UP';
  const dist = 'LKO';
  const num = Math.floor(Math.random() * 900) + 100;
  return `${state}-${dist}-${num}`;
};

const CentreRegister = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [step, setStep] = useState(1);
  const [centreId] = useState(generateCentreId());
  const [form, setForm] = useState({
    centreName: '', centreType: 'Government',
    state: '', district: '', blockTehsil: '', villageTown: '', fullAddress: '', pincode: '',
    managerName: '', designation: '', mobile: '',
    storageCapacity: '', loadingBays: '', counters: '', operators: '',
    crops: ['Wheat', 'Paddy'],
    procurementType: 'MSP Procurement',
    openingTime: '08:00', closingTime: '18:00',
    authRegNo: '', issuingAuthority: '', validFrom: '', validUntil: '',
    uploadedDocs: [],
    agreeTerms: false,
    otp: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const toggleCrop = (crop) => {
    setForm(f => ({
      ...f,
      crops: f.crops.includes(crop)
        ? f.crops.filter(c => c !== crop)
        : [...f.crops, crop],
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setForm(f => ({
      ...f,
      uploadedDocs: [...f.uploadedDocs, ...files.map(fi => fi.name)],
    }));
  };

  const steps = [
    { label: 'Centre Details' },
    { label: 'Manager & Infrastructure' },
    { label: 'Authorization & Docs' },
    { label: 'OTP Verify' },
  ];

  const validate = () => {
    const errs = {};
    if (step === 1) {
      if (!form.centreName) errs.centreName = 'Centre name is required';
      if (!form.state) errs.state = 'State is required';
      if (!form.district) errs.district = 'District is required';
      if (!form.fullAddress) errs.fullAddress = 'Address is required';
      if (!form.pincode || form.pincode.length !== 6) errs.pincode = 'Enter valid 6-digit PIN';
    }
    if (step === 2) {
      if (!form.managerName) errs.managerName = 'Manager name is required';
      if (!form.designation) errs.designation = 'Designation is required';
      if (!form.mobile || form.mobile.length !== 10) errs.mobile = 'Enter valid mobile';
    }
    if (step === 3) {
      if (!form.authRegNo) errs.authRegNo = 'Auth number is required';
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStep(s => s + 1);
  };

  const handleSubmit = () => {
    login('centre', { ...mockUser.centre, name: form.managerName, mobile: form.mobile });
    setSubmitted(true);
    setTimeout(() => navigate('/centre/dashboard'), 2000);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <CheckCircle size={64} color="#2E7D32" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: '#2E7D32', fontWeight: 800 }}>Centre Registered Successfully! 🎉</h2>
          <p style={{ color: '#6B7280' }}>Centre ID: <strong>{centreId}</strong></p>
          <p style={{ color: '#6B7280' }}>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const field = (label, key, type = 'text', placeholder = '', extras = {}) => (
    <div style={{ marginBottom: '0.9rem' }}>
      <label className="input-label">{label} <span style={{ color: '#D32F2F' }}>*</span></label>
      <input type={type} value={form[key]} onChange={e => update(key, e.target.value)}
        placeholder={placeholder} className="input-field" {...extras} />
      {errors[key] && <div style={{ color: '#D32F2F', fontSize: '0.78rem', marginTop: '0.2rem' }}>{errors[key]}</div>}
    </div>
  );

  const sel = (label, key, opts, required = true) => (
    <div style={{ marginBottom: '0.9rem' }}>
      <label className="input-label">{label}{required && <span style={{ color: '#D32F2F' }}>*</span>}</label>
      <select value={form[key]} onChange={e => update(key, e.target.value)} className="input-field" style={{ cursor: 'pointer' }}>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {errors[key] && <div style={{ color: '#D32F2F', fontSize: '0.78rem', marginTop: '0.2rem' }}>{errors[key]}</div>}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F5F0, #E3F2FD)',
      padding: '2rem 1rem',
    }}>
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1565C0, #1976D2)',
          borderRadius: '16px 16px 0 0',
          padding: '1.5rem',
          textAlign: 'center',
          color: 'white',
        }}>
          <Building2 size={32} color="#F9A825" style={{ marginBottom: '0.5rem' }} />
          <h1 style={{ fontWeight: 800, fontSize: '1.3rem', margin: 0 }}>{t('centreRegistration')}</h1>
          <p style={{ opacity: 0.8, fontSize: '0.82rem', marginTop: '0.3rem' }}>
            Centre ID: <strong>{centreId}</strong> (Auto-generated)
          </p>
        </div>

        {/* Step indicator */}
        <div style={{
          background: 'white', padding: '0.85rem 1.5rem',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        }}>
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: i + 1 <= step ? '#1565C0' : '#E5E7EB',
                color: i + 1 <= step ? 'white' : '#9E9E9E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.8rem',
              }}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i + 1 < step ? '#1565C0' : '#E5E7EB', maxWidth: '50px' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0 0 16px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontWeight: 700, color: '#1565C0', marginBottom: '1.25rem', fontSize: '1rem' }}>
            Step {step}: {steps[step - 1].label}
          </h3>

          {/* ── Step 1: Centre Details ── */}
          {step === 1 && (
            <>
              {field(t('centreName'), 'centreName', 'text', 'e.g. Bhagwanpur Govt. Centre')}

              <div style={{ marginBottom: '0.9rem' }}>
                <label className="input-label">{t('centreType')} <span style={{ color: '#D32F2F' }}>*</span></label>
                {['Government', 'Cooperative', 'Authorized Private Centre'].map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', cursor: 'pointer', minHeight: 'unset', fontSize: '0.9rem' }}>
                    <input type="radio" name="centreType" value={type}
                      checked={form.centreType === type}
                      onChange={() => update('centreType', type)}
                      style={{ width: 16, height: 16, minHeight: 'unset', accentColor: '#1565C0' }} />
                    {type === 'Government' ? t('government') :
                     type === 'Cooperative' ? t('cooperative') :
                     type === 'Authorized Private Centre' ? t('authorizedPrivate') :
                     type}
                  </label>
                ))}
              </div>

              {sel(t('state'), 'state', ['— Select State —', ...STATES])}
              {field(t('district'), 'district', 'text', 'e.g. Lucknow')}
              {field(t('blockTehsil'), 'blockTehsil', 'text', 'e.g. Malihabad')}
              {field(t('villageTown'), 'villageTown', 'text', 'e.g. Bhagwanpur')}

              <div style={{ marginBottom: '0.9rem' }}>
                <label className="input-label">{t('fullAddress')} <span style={{ color: '#D32F2F' }}>*</span></label>
                <textarea
                  value={form.fullAddress}
                  onChange={e => update('fullAddress', e.target.value)}
                  placeholder="Full postal address of the centre"
                  className="input-field"
                  rows={3}
                  style={{ resize: 'vertical', minHeight: '72px' }}
                />
                {errors.fullAddress && <div style={{ color: '#D32F2F', fontSize: '0.78rem', marginTop: '0.2rem' }}>{errors.fullAddress}</div>}
              </div>

              {field(t('pincode'), 'pincode', 'text', '6-digit PIN', { maxLength: 6 })}
            </>
          )}

          {/* ── Step 2: Manager & Infrastructure ── */}
          {step === 2 && (
            <>
              <div style={{ fontWeight: 600, color: '#555', marginBottom: '0.75rem', fontSize: '0.9rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.4rem' }}>
                👤 {t('managerDetails')}
              </div>
              {field(t('managerName'), 'managerName', 'text', 'Full name of centre manager')}
              {field(t('designation'), 'designation', 'text', 'e.g. Centre Manager')}
              {field(t('mobile'), 'mobile', 'tel', '10-digit mobile', { maxLength: 10 })}

              <div style={{ fontWeight: 600, color: '#555', margin: '1rem 0 0.75rem', fontSize: '0.9rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.4rem' }}>
                🏗️ {t('infrastructure')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  [t('storageCapacity'), 'storageCapacity', 'e.g. 500'],
                  [t('loadingBays'), 'loadingBays', 'e.g. 4'],
                  [t('counters'), 'counters', 'e.g. 6'],
                  [t('operators'), 'operators', 'e.g. 12'],
                ].map(([label, key, ph]) => (
                  <div key={key} style={{ marginBottom: '0.9rem' }}>
                    <label className="input-label" style={{ fontSize: '0.82rem' }}>{label}</label>
                    <input type="number" value={form[key]} onChange={e => update(key, e.target.value)}
                      placeholder={ph} className="input-field" min="0" />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '0.9rem' }}>
                <label className="input-label">{t('supportedCrops')}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                  {CROP_LIST.map(crop => (
                    <label key={crop} style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      background: form.crops.includes(crop) ? '#E3F2FD' : '#F9F9F9',
                      border: `1.5px solid ${form.crops.includes(crop) ? '#1565C0' : '#E5E7EB'}`,
                      borderRadius: '8px', padding: '0.35rem 0.7rem',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                      minHeight: 'unset', transition: 'all 0.15s',
                    }}>
                      <input type="checkbox" checked={form.crops.includes(crop)}
                        onChange={() => toggleCrop(crop)}
                        style={{ width: 14, height: 14, minHeight: 'unset', accentColor: '#1565C0' }} />
                      {crop}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '0.9rem' }}>
                <label className="input-label">{t('procurementType')}</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
                  {['MSP Procurement', 'Other'].map(pt => (
                    <label key={pt} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', minHeight: 'unset' }}>
                      <input type="radio" name="procType" value={pt}
                        checked={form.procurementType === pt}
                        onChange={() => update('procurementType', pt)}
                        style={{ width: 16, height: 16, minHeight: 'unset', accentColor: '#1565C0' }} />
                      {pt}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="input-label">{t('openingTime')}</label>
                  <input type="time" value={form.openingTime} onChange={e => update('openingTime', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="input-label">{t('closingTime')}</label>
                  <input type="time" value={form.closingTime} onChange={e => update('closingTime', e.target.value)} className="input-field" />
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: Authorization & Docs ── */}
          {step === 3 && (
            <>
              <div style={{
                background: '#FFF9C4', borderRadius: '8px', padding: '0.75rem 1rem',
                marginBottom: '1rem', fontSize: '0.82rem', color: '#795548',
              }}>
                ⚠️ These details are for SIH demo purposes. In production, documents will be verified by the ministry.
              </div>

              <div style={{ fontWeight: 600, color: '#555', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                📋 {t('authorization')}
              </div>

              {field(t('authRegNo'), 'authRegNo', 'text', 'e.g. APMC-UP-2024-001')}
              {field(t('issuingAuthority'), 'issuingAuthority', 'text', 'e.g. UP State Govt.')}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div>
                  <label className="input-label">{t('validFrom')}</label>
                  <input type="date" value={form.validFrom} onChange={e => update('validFrom', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="input-label">{t('validUntil')}</label>
                  <input type="date" value={form.validUntil} onChange={e => update('validUntil', e.target.value)} className="input-field" />
                </div>
              </div>

              <div style={{ fontWeight: 600, color: '#555', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                📁 {t('documentUpload')}
              </div>

              <div style={{
                border: '2px dashed #1565C0', borderRadius: '10px', padding: '1.5rem',
                textAlign: 'center', background: '#F0F4FF', cursor: 'pointer', marginBottom: '0.9rem',
              }} onClick={() => fileRef.current?.click()}>
                <Upload size={32} color="#1565C0" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 600, color: '#1565C0', fontSize: '0.9rem' }}>
                  Click to upload documents
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.2rem' }}>
                  Centre Authorization, Agency Approval, Other docs (PDF, JPG, PNG)
                </div>
                <input
                  ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload} style={{ display: 'none' }}
                />
              </div>

              {form.uploadedDocs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.9rem' }}>
                  {form.uploadedDocs.map((doc, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#E3F2FD', borderRadius: '8px', padding: '0.5rem 0.75rem',
                      fontSize: '0.85rem',
                    }}>
                      <span>📄 {doc}</span>
                      <button onClick={() => setForm(f => ({ ...f, uploadedDocs: f.uploadedDocs.filter((_, j) => j !== i) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D32F2F' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#555', minHeight: 'unset' }}>
                <input type="checkbox" checked={form.agreeTerms} onChange={e => update('agreeTerms', e.target.checked)}
                  style={{ width: 16, height: 16, minHeight: 'unset', marginTop: 2, flexShrink: 0, accentColor: '#1565C0' }} />
                I certify that all information provided is accurate and I agree to the KrishiMitra Terms & Conditions.
              </label>
            </>
          )}

          {/* ── Step 4: OTP ── */}
          {step === 4 && (
            <>
              <div style={{ background: '#E3F2FD', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                <p style={{ color: '#1565C0', fontWeight: 500, fontSize: '0.9rem' }}>
                  OTP sent to <strong>+91 {form.mobile}</strong>
                </p>
                <p style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                  Demo OTP: <strong>123456</strong>
                </p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="input-label">Enter 6-digit OTP</label>
                <input type="tel" value={form.otp} onChange={e => update('otp', e.target.value.slice(0, 6))}
                  placeholder="123456" className="input-field"
                  style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 700 }} maxLength={6} />
              </div>
            </>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
            {step < 4 ? (
              <button onClick={handleNext} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#1565C0' }}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#1565C0' }}>
                <CheckCircle size={16} /> Register Centre
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#6B7280' }}>
            {t('alreadyAccount')}{' '}
            <Link to="/login" style={{ color: '#1565C0', fontWeight: 600, textDecoration: 'none' }}>{t('loginHere')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CentreRegister;
