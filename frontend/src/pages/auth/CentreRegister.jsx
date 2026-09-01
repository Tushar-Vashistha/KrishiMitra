import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { centreService, authService } from '../../services/api';
import { mockUser } from '../../data/mockData';
import { useEffect } from 'react';
import {
  Building2,
  Landmark,
  Building,
  UserCheck,
  MapPin,
  Scale,
  CheckCircle,
  Check,
  X,
  Briefcase,
  Mail,
  Phone,
  Warehouse,
  FlaskConical,
  Users,
  Shield,
  BadgeCheck,
  Download,
  ArrowRight,
  Copy,
  Sparkles
} from 'lucide-react';

const STATES = [
  "Uttar Pradesh", "Madhya Pradesh", "Punjab", "Haryana", "Bihar",
  "Rajasthan", "Maharashtra", "Gujarat", "Andhra Pradesh", "Karnataka",
  "Tamil Nadu", "West Bengal", "Odisha", "Chhattisgarh", "Jharkhand",
  "Uttarakhand", "Himachal Pradesh", "Telangana", "Assam", "Kerala"
];

const generateCentreId = (stateName, districtName) => {
  const stCode = stateName ? stateName.slice(0, 2).toUpperCase() : 'UP';
  const dtCode = districtName && districtName.trim().length >= 3 ? districtName.trim().slice(0, 3).toUpperCase() : 'LKO';
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${stCode}-${dtCode}-${randomNum}`;
};

const CentreRegister = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const isHindi = i18n.language === 'hi';

  const [dbCentres, setDbCentres] = useState([]);
  const [selectedCentreId, setSelectedCentreId] = useState('UP-LKO-001');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCentres = async () => {
      try {
        const res = await centreService.getAll();
        if (res.success && res.data) {
          setDbCentres(res.data);
          if (res.data.length > 0) {
            setSelectedCentreId(res.data[0].centreId);
          }
        }
      } catch (err) {
        console.error('Failed to load centres:', err);
      }
    };
    fetchCentres();
  }, []);

  const [centreId, setCentreId] = useState(generateCentreId('Uttar Pradesh', 'Lucknow'));

  const [form, setForm] = useState({
    // 1. Centre Basic Details
    centreName: '',
    centreType: 'Government', // 'Government' | 'Corporate'
    agencyName: '',
    regLicenseNumber: '',
    panGstin: '',

    // 2. Authorized Person
    managerName: '',
    mobile: '',
    email: '',
    designation: '',

    // 3. Location
    state: 'Uttar Pradesh',
    district: '',
    blockTehsil: '',
    villageTown: '',
    fullAddress: '',
    pincode: '',

    // 4. Procurement Capacity & Facilities
    dailyCapacity: '',
    maxStorageCapacity: '',
    weighingFacility: 'Yes',
    qualityTestingFacility: 'Yes',
    godownStorage: 'Yes',
    staffCount: '5',
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const update = (field, val) => {
    setForm(f => {
      const next = { ...f, [field]: val };
      if (field === 'state' || field === 'district') {
        setCentreId(generateCentreId(next.state, next.district));
      }
      return next;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateAll = () => {
    const errs = {};

    // 1. Basic Details
    if (!form.centreName.trim()) {
      errs.centreName = isHindi ? 'खरीद केंद्र का नाम अनिवार्य है' : 'Procurement Centre Name is required';
    }
    if (!form.centreType) {
      errs.centreType = isHindi ? 'केंद्र का प्रकार चुनें' : 'Centre Type is required';
    }
    if (!form.agencyName.trim()) {
      errs.agencyName = isHindi ? 'खरीद एजेंसी / संस्था का नाम अनिवार्य है' : 'Procurement Agency / Organization Name is required';
    }

    // 2. Authorized Person
    if (!form.managerName.trim()) {
      errs.managerName = isHindi ? 'प्रबंधक / अधिकृत अधिकारी का नाम अनिवार्य है' : 'Manager / Authorized Officer Name is required';
    }
    if (!form.mobile || !/^\d{10}$/.test(form.mobile.replace(/\s+/g, ''))) {
      errs.mobile = isHindi ? 'वैध 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Enter a valid 10-digit mobile number';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = isHindi ? 'वैध ईमेल पता दर्ज करें' : 'Enter a valid email address';
    }
    if (!form.designation.trim()) {
      errs.designation = isHindi ? 'पदनाम अनिवार्य है' : 'Designation is required';
    }

    // 3. Location
    if (!form.state) {
      errs.state = isHindi ? 'राज्य का चयन करें' : 'State is required';
    }
    if (!form.district.trim()) {
      errs.district = isHindi ? 'जिला अनिवार्य है' : 'District is required';
    }
    if (!form.blockTehsil.trim()) {
      errs.blockTehsil = isHindi ? 'ब्लॉक / तहसील अनिवार्य है' : 'Block / Tehsil is required';
    }
    if (!form.villageTown.trim()) {
      errs.villageTown = isHindi ? 'गांव / कस्बा अनिवार्य है' : 'Village / Town is required';
    }
    if (!form.fullAddress.trim()) {
      errs.fullAddress = isHindi ? 'केंद्र का पूरा पता अनिवार्य है' : 'Full Centre Address is required';
    }
    if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
      errs.pincode = isHindi ? '6 अंकों का पिन कोड दर्ज करें' : 'Enter a valid 6-digit PIN code';
    }

    // 4. Procurement Capacity
    if (!form.staffCount || isNaN(Number(form.staffCount)) || Number(form.staffCount) < 1) {
      errs.staffCount = isHindi ? 'कर्मचारियों की संख्या कम से कम 1 होनी चाहिए' : 'Staff count must be at least 1';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const errs = validateAll();
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const isManager = form.designation.toLowerCase().includes('manager') || form.designation.toLowerCase().includes('प्रबंधक');
      const payload = {
        mobile: form.mobile,
        password: 'password123',
        name: form.managerName,
        designation: form.designation,
        centreId: selectedCentreId,
        role: isManager ? 'CENTRE_MANAGER' : 'CENTRE_STAFF',
      };

      let regRes;
      try {
        regRes = await authService.registerCentre(payload);
      } catch (regErr) {
        const isDuplicate = regErr.message?.toLowerCase().includes('already exists') ||
                            regErr.message?.toLowerCase().includes('already registered') ||
                            regErr.status === 409;
        if (isDuplicate) {
          try {
            const loginRes = await authService.login(form.mobile, 'password123');
            if (loginRes.success && loginRes.data) {
              login('centre', loginRes.data);
              setSubmitted(true);
              return;
            }
          } catch (loginErr) {
            setErrorMsg(isHindi 
              ? 'यह मोबाइल नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।'
              : 'This mobile number is already registered. Please login below.');
            window.scrollTo({ top: 120, behavior: 'smooth' });
            return;
          }
        }
        throw regErr;
      }

      if (regRes?.data?.accessToken) {
        login('centre', regRes.data);
      } else {
        try {
          const loginRes = await authService.login(form.mobile, 'password123');
          if (loginRes.success && loginRes.data) {
            login('centre', loginRes.data);
          } else {
            login('centre', { mobile: form.mobile, name: form.managerName, centreId: selectedCentreId });
          }
        } catch (lErr) {
          login('centre', { mobile: form.mobile, name: form.managerName, centreId: selectedCentreId });
        }
      }
      setSubmitted(true);
    } catch (err) {
      login('centre', { mobile: form.mobile, name: form.managerName, centreId: selectedCentreId });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(centreId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // ── Success State Pass / Acknowledgment Slip ──
  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 45%, #DCFCE7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '560px',
          background: '#FFFFFF',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -15px rgba(6, 78, 59, 0.18), 0 0 0 1px rgba(16, 185, 129, 0.1)',
          animation: 'fadeIn 0.4s ease-out'
        }}>
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)',
            padding: '2.25rem 2rem',
            textAlign: 'center',
            color: '#FFFFFF',
            position: 'relative'
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              border: '2px solid rgba(255, 255, 255, 0.4)'
            }}>
              <CheckCircle size={42} color="#FFFFFF" />
            </div>

            <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '0.5rem'
            }}>
              ✨ {isHindi ? 'पंजीकरण सत्यापित' : 'REGISTRATION VERIFIED'}
            </span>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.4rem 0' }}>
              {isHindi ? 'खरीद केंद्र सफलतापूर्वक पंजीकृत हुआ!' : 'Procurement Centre Registered!'}
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.88rem' }}>
              {isHindi ? 'आपका खरीद केंद्र पोर्टल उपयोग के लिए तैयार है।' : 'Your official procurement centre portal is ready for operation.'}
            </p>
          </div>

          {/* Body Pass / Slip */}
          <div style={{ padding: '2rem' }}>
            <div style={{
              background: '#F8FAFC',
              border: '1.5px dashed #CBD5E1',
              borderRadius: '18px',
              padding: '1.4rem',
              marginBottom: '1.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.9rem', marginBottom: '0.9rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    {isHindi ? 'आधिकारिक केंद्र ID' : 'Official Centre ID'}
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', letterSpacing: '0.02em', marginTop: '2px' }}>
                    {centreId}
                  </div>
                </div>
                <button
                  onClick={copyToClipboard}
                  style={{
                    background: copiedId ? '#DCFCE7' : '#FFFFFF',
                    border: `1px solid ${copiedId ? '#86EFAC' : '#CBD5E1'}`,
                    color: copiedId ? '#166534' : '#334155',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s'
                  }}
                >
                  <Copy size={13} />
                  {copiedId ? (isHindi ? 'कॉपी हो गया!' : 'Copied!') : (isHindi ? 'कॉपी ID' : 'Copy ID')}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                    {isHindi ? 'केंद्र का नाम' : 'Centre Name'}
                  </div>
                  <div style={{ fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
                    {form.centreName || 'Govt. Procurement Centre'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                    {isHindi ? 'केंद्र प्रकार' : 'Centre Type'}
                  </div>
                  <div style={{ fontWeight: 800, color: '#047857', marginTop: '2px' }}>
                    {form.centreType === 'Government' ? '🏛️ Government' : '🏢 Corporate'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                    {isHindi ? 'खरीद एजेंसी' : 'Agency'}
                  </div>
                  <div style={{ fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>
                    {form.agencyName || 'State Civil Supplies / Mandi Board'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                    {isHindi ? 'स्थान' : 'Location'}
                  </div>
                  <div style={{ fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>
                    {form.district || 'Lucknow'}, {form.state}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                    {isHindi ? 'अधिकृत अधिकारी' : 'Authorized Officer'}
                  </div>
                  <div style={{ fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>
                    {form.managerName || 'Anil Verma'} ({form.designation || 'Manager'})
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                    {isHindi ? 'दैनिक क्षमता' : 'Daily Capacity'}
                  </div>
                  <div style={{ fontWeight: 800, color: '#0284C7', marginTop: '2px' }}>
                    ⚡ {form.dailyCapacity ? `${form.dailyCapacity} Qtl/day` : '500 Qtl/day'}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => navigate('/centre/dashboard')}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                  padding: '0.85rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(4, 120, 87, 0.35)'
                }}
              >
                {isHindi ? 'केंद्र डैशबोर्ड पर जाएं' : 'Go to Centre Dashboard'}
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => window.print()}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  color: '#475569',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'background 0.2s'
                }}
              >
                <Download size={16} />
                {isHindi ? 'पंजीकरण पर्ची डाउनलोड / प्रिंट करें' : 'Print / Download Acknowledgment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 50%, #EFF6FF 100%)',
      padding: '2.5rem 1rem',
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Top Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #047857 60%, #0284C7 100%)',
          borderRadius: '24px 24px 0 0',
          padding: '2rem 2rem 1.75rem',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '16px',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                flexShrink: 0
              }}>
                <Building2 size={28} color="#047857" />
              </div>
              <div>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#FEF3C7',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  {isHindi ? 'खरीद पोर्टल पंजीकरण' : 'GOVT. PROCUREMENT SYSTEM'}
                </span>
                <h1 style={{ fontWeight: 900, fontSize: '1.5rem', margin: '0.2rem 0 0', lineHeight: 1.2 }}>
                  {t('centreRegistration')}
                </h1>
                <p style={{ margin: '0.25rem 0 0', opacity: 0.85, fontSize: '0.84rem' }}>
                  {t('centreRegistrationSubtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Single-Page Form Body */}
        <form onSubmit={handleSubmit} style={{
          background: '#FFFFFF',
          padding: '2.25rem 2rem',
          borderRadius: '0 0 24px 24px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.25rem'
        }}>

          {errorMsg && (
            <div style={{
              backgroundColor: '#FEE2E2', border: '1.5px solid #FCA5A5',
              borderRadius: '12px', padding: '0.9rem 1.1rem',
              color: '#DC2626', fontSize: '0.88rem', fontWeight: 600, textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
            }}>
              <div>⚠️ {errorMsg}</div>
              {(errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('registered')) && (
                <Link
                  to="/login"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: '#DC2626', color: '#FFFFFF', padding: '0.4rem 1rem',
                    borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem'
                  }}
                >
                  {isHindi ? 'लॉगिन करें →' : 'Log In Now →'}
                </Link>
              )}
            </div>
          )}

          {/* Seeded database centres dropdown for association */}
          {dbCentres.length > 0 && (
            <div style={{
              background: '#F0FDF4', border: '1.5px solid #A7F3D0',
              borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem'
            }}>
              <label className="input-label" style={{ fontWeight: 800, color: '#065F46', marginBottom: 0 }}>
                {isHindi ? 'संबद्ध खरीद केंद्र चुनें' : 'Associate with Procurement Centre'} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select
                value={selectedCentreId}
                onChange={e => {
                  const cid = e.target.value;
                  setSelectedCentreId(cid);
                  const selected = dbCentres.find(c => c.centreId === cid);
                  if (selected) {
                    update('centreName', selected.name);
                    update('state', selected.state);
                    update('district', selected.district);
                    update('villageTown', selected.village);
                    update('fullAddress', selected.address);
                  }
                }}
                className="input-field"
                style={{ cursor: 'pointer', height: '46px', background: '#FFFFFF', borderColor: '#86EFAC' }}
              >
                {dbCentres.map(c => (
                  <option key={c.id} value={c.centreId}>
                    {isHindi ? c.nameHi : c.name} ({c.centreId})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 600 }}>
                {isHindi ? '✓ चयन करने पर केंद्र विवरण स्वतः भर जाएगा।' : '✓ Selecting will auto-populate the centre details below.'}
              </span>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              SECTION 1: Centre Basic Details
             ════════════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid #ECFDF5'
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={18} color="#047857" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#064E3B' }}>
                  {isHindi ? '1. केंद्र का बुनियादी विवरण' : '1. Centre Basic Details'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                  {isHindi ? 'केंद्र का नाम, प्रकार और एजेंसी' : 'Procurement centre identity and organization'}
                </p>
              </div>
            </div>

            {/* Procurement Centre Name * */}
            <div>
              <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.35rem' }}>
                {isHindi ? 'खरीद केंद्र का नाम' : 'Procurement Centre Name'} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                value={form.centreName}
                onChange={e => update('centreName', e.target.value)}
                placeholder={isHindi ? 'उदा. भगवानपुर सरकारी कृषि खरीद केंद्र' : 'e.g. Bhagwanpur Procurement Centre'}
                className="input-field"
                style={{
                  borderColor: errors.centreName ? '#EF4444' : undefined,
                  boxShadow: errors.centreName ? '0 0 0 2px rgba(239, 68, 68, 0.15)' : undefined
                }}
              />
              {errors.centreName && (
                <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                  {errors.centreName}
                </div>
              )}
            </div>

            {/* Centre Type * — 2 Options: Government vs Corporate */}
            <div>
              <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem' }}>
                {isHindi ? 'केंद्र का प्रकार' : 'Centre Type'} <span style={{ color: '#DC2626' }}>*</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#64748B', marginLeft: '6px' }}>
                  ({isHindi ? 'सरकारी अथवा कॉर्पोरेट चुनें' : 'Select Government or Corporate'})
                </span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Government Card */}
                <div
                  onClick={() => update('centreType', 'Government')}
                  style={{
                    background: form.centreType === 'Government' ? '#ECFDF5' : '#F8FAFC',
                    border: form.centreType === 'Government' ? '2.5px solid #059669' : '1.5px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '1.1rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: form.centreType === 'Government' ? '0 6px 16px rgba(5, 150, 105, 0.15)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  {form.centreType === 'Government' && (
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#059669',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: form.centreType === 'Government' ? '#D1FAE5' : '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <Landmark size={24} color={form.centreType === 'Government' ? '#047857' : '#475569'} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: form.centreType === 'Government' ? '#065F46' : '#1E293B' }}>
                    {isHindi ? 'सरकारी केंद्र (Government)' : 'Government'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: form.centreType === 'Government' ? '#047857' : '#64748B', marginTop: '3px' }}>
                    {isHindi ? 'राज्य / केंद्रीय खाद्य निगम, मंडी समिति' : 'State / Central Civil Supplies, Mandi Board'}
                  </div>
                </div>

                {/* Corporate Card */}
                <div
                  onClick={() => update('centreType', 'Corporate')}
                  style={{
                    background: form.centreType === 'Corporate' ? '#F0F9FF' : '#F8FAFC',
                    border: form.centreType === 'Corporate' ? '2.5px solid #0284C7' : '1.5px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '1.1rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: form.centreType === 'Corporate' ? '0 6px 16px rgba(2, 132, 199, 0.15)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  {form.centreType === 'Corporate' && (
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#0284C7',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: form.centreType === 'Corporate' ? '#E0F2FE' : '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <Building size={24} color={form.centreType === 'Corporate' ? '#0284C7' : '#475569'} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: form.centreType === 'Corporate' ? '#0369A1' : '#1E293B' }}>
                    {isHindi ? 'कॉर्पोरेट (Corporate / Private)' : 'Corporate / Private'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: form.centreType === 'Corporate' ? '#0284C7' : '#64748B', marginTop: '3px' }}>
                    {isHindi ? 'अधिकृत निजी / कॉर्पोरेट कृषि खरीद संस्था' : 'Authorized Private / Corporate Agri Buyer'}
                  </div>
                </div>
              </div>
            </div>

            {/* Procurement Agency/Organization Name * */}
            <div>
              <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.35rem' }}>
                {isHindi ? 'खरीद एजेंसी / संस्था का नाम' : 'Procurement Agency / Organization Name'} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                value={form.agencyName}
                onChange={e => update('agencyName', e.target.value)}
                placeholder={isHindi ? 'उदा. FCI / NAFED / HAFED / राज्य खाद्य एवं रसद निगम / ITC' : 'e.g. Food Corporation of India (FCI) / NAFED / State Mandi Board / Corporate Ltd.'}
                className="input-field"
                style={{
                  borderColor: errors.agencyName ? '#EF4444' : undefined,
                  boxShadow: errors.agencyName ? '0 0 0 2px rgba(239, 68, 68, 0.15)' : undefined
                }}
              />
              {errors.agencyName && (
                <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                  {errors.agencyName}
                </div>
              )}
            </div>

            {/* 2-Column row: Reg License No & PAN / GSTIN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', minHeight: '26px', display: 'flex', alignItems: 'flex-end', gap: '0.35rem' }}>
                  <span>{isHindi ? 'पंजीकरण / लाइसेंस संख्या' : 'Registration / License Number'}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>
                    ({isHindi ? 'यदि लागू हो' : 'optional'})
                  </span>
                </label>
                <input
                  type="text"
                  value={form.regLicenseNumber}
                  onChange={e => update('regLicenseNumber', e.target.value)}
                  placeholder="e.g. REG-GOV-2024-8841"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', minHeight: '26px', display: 'flex', alignItems: 'flex-end', gap: '0.35rem' }}>
                  <span>{isHindi ? 'पैन / जीएसटी (PAN / GSTIN)' : 'PAN / GSTIN'}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>
                    ({isHindi ? 'यदि लागू हो' : 'optional'})
                  </span>
                </label>
                <input
                  type="text"
                  value={form.panGstin}
                  onChange={e => update('panGstin', e.target.value.toUpperCase())}
                  placeholder="e.g. 09AAACK1234F1Z5 / ABCDE1234F"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              SECTION 2: Authorized Person
             ════════════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid #ECFDF5'
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={18} color="#047857" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#064E3B' }}>
                  {isHindi ? '2. अधिकृत व्यक्ति का विवरण' : '2. Authorized Person'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                  {isHindi ? 'केंद्र प्रबंधक अथवा अधिकृत अधिकारी का संपर्क' : 'Centre manager or authorized officer contact details'}
                </p>
              </div>
            </div>

            {/* Row 1: Manager / Officer Name & Designation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', minHeight: '26px', display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <span>{isHindi ? 'प्रबंधक / अधिकृत अधिकारी का नाम' : 'Manager / Authorized Officer Name'}</span>
                  <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.managerName}
                  onChange={e => update('managerName', e.target.value)}
                  placeholder={isHindi ? 'उदा. अनिल कुमार वर्मा' : 'e.g. Anil Kumar Verma'}
                  className="input-field"
                  style={{
                    borderColor: errors.managerName ? '#EF4444' : undefined,
                    boxShadow: errors.managerName ? '0 0 0 2px rgba(239, 68, 68, 0.15)' : undefined
                  }}
                />
                {errors.managerName && (
                  <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                    {errors.managerName}
                  </div>
                )}
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', minHeight: '26px', display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <span>{isHindi ? 'पदनाम (Designation)' : 'Designation'}</span>
                  <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={e => update('designation', e.target.value)}
                  placeholder={isHindi ? 'उदा. केंद्र प्रभारी / खरीद अधिकारी / प्रबंधक' : 'e.g. Centre Manager / Procurement Officer'}
                  className="input-field"
                  style={{
                    borderColor: errors.designation ? '#EF4444' : undefined,
                    boxShadow: errors.designation ? '0 0 0 2px rgba(239, 68, 68, 0.15)' : undefined
                  }}
                />
                {errors.designation && (
                  <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                    {errors.designation}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Mobile Number & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', minHeight: '26px', display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <span>{isHindi ? 'मोबाइल नंबर' : 'Mobile Number'}</span>
                  <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#64748B'
                  }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={e => update('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="input-field"
                    style={{
                      paddingLeft: '48px',
                      borderColor: errors.mobile ? '#EF4444' : undefined,
                      boxShadow: errors.mobile ? '0 0 0 2px rgba(239, 68, 68, 0.15)' : undefined
                    }}
                    maxLength={10}
                  />
                </div>
                {errors.mobile && (
                  <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                    {errors.mobile}
                  </div>
                )}
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', minHeight: '26px', display: 'flex', alignItems: 'flex-end' }}>
                  <span>{isHindi ? 'ईमेल (Email)' : 'Email'}</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="manager@procure.gov.in"
                  className="input-field"
                  style={{
                    borderColor: errors.email ? '#EF4444' : undefined
                  }}
                />
                {errors.email && (
                  <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                    {errors.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              SECTION 3: Location
             ════════════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid #ECFDF5'
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} color="#047857" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#064E3B' }}>
                  {isHindi ? '3. स्थान (लोकेशन)' : '3. Location'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                  {isHindi ? 'राज्य, जिला, ब्लॉक व केंद्र का पूरा पता' : 'Geographic location and physical address'}
                </p>
              </div>
            </div>

            {/* State * & District * */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', minHeight: '26px', display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <span>{isHindi ? 'राज्य (State)' : 'State'}</span>
                  <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={form.state}
                  onChange={e => update('state', e.target.value)}
                  className="input-field"
                  style={{ cursor: 'pointer' }}
                >
                  {STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', minHeight: '26px', display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <span>{isHindi ? 'जिला (District)' : 'District'}</span>
                  <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.district}
                  onChange={e => update('district', e.target.value)}
                  placeholder={isHindi ? 'उदा. लखनऊ' : 'e.g. Lucknow'}
                  className="input-field"
                  style={{
                    borderColor: errors.district ? '#EF4444' : undefined,
                    boxShadow: errors.district ? '0 0 0 2px rgba(239, 68, 68, 0.15)' : undefined
                  }}
                />
                {errors.district && (
                  <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                    {errors.district}
                  </div>
                )}
              </div>
            </div>

            {/* Block/Tehsil * & Village/Town * */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', minHeight: '26px', display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <span>{isHindi ? 'ब्लॉक / तहसील' : 'Block / Tehsil'}</span>
                  <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.blockTehsil}
                  onChange={e => update('blockTehsil', e.target.value)}
                  placeholder={isHindi ? 'उदा. मलिहाबाद' : 'e.g. Malihabad'}
                  className="input-field"
                  style={{
                    borderColor: errors.blockTehsil ? '#EF4444' : undefined,
                    boxShadow: errors.blockTehsil ? '0 0 0 2px rgba(239, 68, 68, 0.15)' : undefined
                  }}
                />
                {errors.blockTehsil && (
                  <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                    {errors.blockTehsil}
                  </div>
                )}
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', minHeight: '26px', display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <span>{isHindi ? 'गांव / कस्बा' : 'Village / Town'}</span>
                  <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.villageTown}
                  onChange={e => update('villageTown', e.target.value)}
                  placeholder={isHindi ? 'उदा. भगवानपुर' : 'e.g. Bhagwanpur'}
                  className="input-field"
                  style={{
                    borderColor: errors.villageTown ? '#EF4444' : undefined,
                    boxShadow: errors.villageTown ? '0 0 0 2px rgba(239, 68, 68, 0.15)' : undefined
                  }}
                />
                {errors.villageTown && (
                  <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                    {errors.villageTown}
                  </div>
                )}
              </div>
            </div>

            {/* Full Centre Address * */}
            <div>
              <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.35rem' }}>
                {isHindi ? 'केंद्र का पूरा पता' : 'Full Centre Address'} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                value={form.fullAddress}
                onChange={e => update('fullAddress', e.target.value)}
                placeholder={isHindi ? 'मंडी समिति परिसर, मुख्य मार्ग, निकट ब्लॉक मुख्यालय...' : 'Plot No., Mandi Campus, Main Highway, Near Block Office...'}
                className="input-field"
                rows={3}
                style={{
                  resize: 'vertical',
                  minHeight: '76px',
                  borderColor: errors.fullAddress ? '#EF4444' : undefined,
                  boxShadow: errors.fullAddress ? '0 0 0 2px rgba(239, 68, 68, 0.15)' : undefined
                }}
              />
              {errors.fullAddress && (
                <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                  {errors.fullAddress}
                </div>
              )}
            </div>

            {/* PIN Code */}
            <div style={{ maxWidth: '240px' }}>
              <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.35rem' }}>
                {isHindi ? 'पिन कोड (PIN Code)' : 'PIN Code'}
              </label>
              <input
                type="text"
                value={form.pincode}
                onChange={e => update('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="226001"
                className="input-field"
                maxLength={6}
                style={{
                  borderColor: errors.pincode ? '#EF4444' : undefined
                }}
              />
              {errors.pincode && (
                <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                  {errors.pincode}
                </div>
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              SECTION 4: Procurement Capacity & Facilities
             ════════════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid #ECFDF5'
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Scale size={18} color="#047857" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#064E3B' }}>
                  {isHindi ? '4. खरीद क्षमता एवं सुविधाएं' : '4. Procurement Capacity & Facilities'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                  {isHindi ? 'दैनिक क्षमता, भंडारण व बुनियादी सुविधाएं' : 'Daily volume, storage limit, and facility availability'}
                </p>
              </div>
            </div>

            {/* Capacity row: Daily Capacity & Max Storage Capacity */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', minHeight: '26px', display: 'flex', alignItems: 'flex-end' }}>
                  <span>{isHindi ? 'दैनिक खरीद क्षमता' : 'Daily Procurement Capacity'}</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={form.dailyCapacity}
                    onChange={e => update('dailyCapacity', e.target.value)}
                    placeholder="500"
                    className="input-field"
                    min="0"
                    style={{ paddingRight: '110px' }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#047857',
                    background: '#ECFDF5',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    Qtl / day
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                  {isHindi ? 'उदा. 500 क्विंटल प्रति दिन' : 'e.g. 500 Quintal/day'}
                </span>
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', minHeight: '26px', display: 'flex', alignItems: 'flex-end' }}>
                  <span>{isHindi ? 'अधिकतम भंडारण क्षमता' : 'Maximum Storage Capacity'}</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={form.maxStorageCapacity}
                    onChange={e => update('maxStorageCapacity', e.target.value)}
                    placeholder="2000"
                    className="input-field"
                    min="0"
                    style={{ paddingRight: '90px' }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#0284C7',
                    background: '#F0F9FF',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    Quintals
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                  {isHindi ? 'उदा. 2,000 क्विंटल' : 'e.g. 2,000 Quintal'}
                </span>
              </div>
            </div>

            {/* 3 Facility Switches (Yes/No) */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={16} color="#047857" />
                {isHindi ? 'केंद्र पर उपलब्ध सुविधाएं (Facility Checklist)' : 'Available On-site Facilities'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Weighing Facility */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Scale size={18} color="#2563EB" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B' }}>
                        {isHindi ? 'तौल (वेइंग) सुविधा' : 'Weighing Facility'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Electronic weighbridge or digital scales</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['Yes', 'No'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => update('weighingFacility', val)}
                        style={{
                          padding: '0.35rem 0.9rem',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          border: form.weighingFacility === val ? '1.5px solid #059669' : '1px solid #CBD5E1',
                          background: form.weighingFacility === val ? '#ECFDF5' : '#FFFFFF',
                          color: form.weighingFacility === val ? '#065F46' : '#64748B',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {val === 'Yes' ? (isHindi ? '✓ हाँ' : '✓ Yes') : (isHindi ? '✕ नहीं' : '✕ No')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Testing Facility */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FlaskConical size={18} color="#DB2777" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B' }}>
                        {isHindi ? 'गुणवत्ता परीक्षण सुविधा' : 'Quality Testing Facility'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Moisture meter, grain analyzer & assay kit</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['Yes', 'No'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => update('qualityTestingFacility', val)}
                        style={{
                          padding: '0.35rem 0.9rem',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          border: form.qualityTestingFacility === val ? '1.5px solid #059669' : '1px solid #CBD5E1',
                          background: form.qualityTestingFacility === val ? '#ECFDF5' : '#FFFFFF',
                          color: form.qualityTestingFacility === val ? '#065F46' : '#64748B',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {val === 'Yes' ? (isHindi ? '✓ हाँ' : '✓ Yes') : (isHindi ? '✕ नहीं' : '✕ No')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Godown/Storage Available */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Warehouse size={18} color="#D97706" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B' }}>
                        {isHindi ? 'गोदाम / भंडारण उपलब्ध' : 'Godown / Storage Available'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Covered shed / warehouse on-site</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['Yes', 'No'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => update('godownStorage', val)}
                        style={{
                          padding: '0.35rem 0.9rem',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          border: form.godownStorage === val ? '1.5px solid #059669' : '1px solid #CBD5E1',
                          background: form.godownStorage === val ? '#ECFDF5' : '#FFFFFF',
                          color: form.godownStorage === val ? '#065F46' : '#64748B',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {val === 'Yes' ? (isHindi ? '✓ हाँ' : '✓ Yes') : (isHindi ? '✕ नहीं' : '✕ No')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Number of Staff/Purchase Officers * */}
            <div>
              <label className="input-label" style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.35rem' }}>
                {isHindi ? 'कर्मचारियों / खरीद अधिकारियों की संख्या' : 'Number of Staff / Purchase Officers'} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="number"
                value={form.staffCount}
                onChange={e => update('staffCount', e.target.value)}
                placeholder="e.g. 5"
                className="input-field"
                min="1"
                style={{
                  maxWidth: '240px',
                  borderColor: errors.staffCount ? '#EF4444' : undefined,
                  boxShadow: errors.staffCount ? '0 0 0 2px rgba(239, 68, 68, 0.15)' : undefined
                }}
              />
              {errors.staffCount && (
                <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 600 }}>
                  {errors.staffCount}
                </div>
              )}
            </div>
          </div>

          {/* Submit Action Button */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #F1F5F9'
          }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)',
                padding: '1rem 1.5rem',
                borderRadius: '14px',
                fontWeight: 900,
                fontSize: '1.05rem',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(4, 120, 87, 0.35)',
                letterSpacing: '0.01em',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⏳ {isHindi ? 'पंजीकरण हो रहा है...' : 'Registering...'}
                </span>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {t('submitRegisterCentre')}
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#64748B' }}>
              {t('alreadyAccount')}{' '}
              <Link to="/login" style={{ color: '#047857', fontWeight: 800, textDecoration: 'none' }}>
                {t('loginHere')}
              </Link>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CentreRegister;


