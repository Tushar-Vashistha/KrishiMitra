import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { procurementService, paymentService } from '../../services/api';
import {
  ArrowLeft, CreditCard, Upload, CheckCircle2, Clock, AlertCircle,
  FileText, Check, Search, Download, Building2, ChevronRight,
  Sparkles, ExternalLink, ShieldCheck, RefreshCw
} from 'lucide-react';

const CentrePayments = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isHindi = i18n.language === 'hi';

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'Due' | 'Processing' | 'Approved'
  const [uploadingId, setUploadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPaymentsData = async () => {
    if (!user || !user.centreId) return;
    try {
      const res = await procurementService.getCentreProcurements(user.centreId);
      if (res.success && res.data) {
        const mappedBills = res.data.map(p => {
          let statusText = 'Due';
          if (p.payment?.status === 'SUCCESS') statusText = 'Approved';
          else if (p.payment?.status === 'PENDING') statusText = 'Processing';

          return {
            id: `WS-${p.id}`,
            realProcurementId: p.id,
            paymentId: p.payment?.id,
            farmerId: `FRM-${p.booking.farmerProfileId}`,
            farmerName: p.booking.farmerProfile?.user?.name || 'Kisan',
            mobile: p.booking.farmerProfile?.user?.mobile || '—',
            crop: p.booking.crop.name,
            totalAmount: p.amount,
            paymentStatus: statusText,
            dbtTxnId: p.payment?.referenceId,
            billUploaded: !!p.weighingRecord,
            billFileName: p.weighingRecord ? `Weighment_JForm_${p.id}.pdf` : null,
          };
        });
        setBills(mappedBills);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.centreId) {
      fetchPaymentsData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Change payment status
  const updatePaymentStatus = async (paymentId, newStatus) => {
    if (!paymentId) {
      alert("No active payment record found for this transaction yet.");
      return;
    }
    const backendStatus = newStatus === 'Approved' ? 'SUCCESS' : 'PENDING';
    try {
      const res = await paymentService.updateStatus(paymentId, { status: backendStatus });
      if (res.success) {
        showToast(isHindi ? `लेनदेन की स्थिति बदलकर '${newStatus}' की गई!` : `Payment status updated to '${newStatus}'!`);
        fetchPaymentsData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update payment status');
    }
  };

  // Trigger file upload for specific bill
  const handleUploadClick = (billId) => {
    setUploadingId(billId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file && uploadingId) {
      setBills(prev => prev.map(b => {
        if (b.id === uploadingId) {
          return { ...b, billUploaded: true, billFileName: file.name };
        }
        return b;
      }));
      showToast(isHindi ? `बिल रसीद '${file.name}' सफलतापूर्वक अपलोड की गई!` : `Bill slip '${file.name}' uploaded successfully!`);
    }
    setUploadingId(null);
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.farmerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.mobile.includes(searchQuery);
    const matchesFilter = filterStatus === 'all' ? true : b.paymentStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPayable = bills.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalApproved = bills.filter(b => b.paymentStatus === 'Approved').reduce((acc, b) => acc + b.totalAmount, 0);
  const totalDue = bills.filter(b => b.paymentStatus === 'Due').reduce((acc, b) => acc + b.totalAmount, 0);
  const totalProcessing = bills.filter(b => b.paymentStatus === 'Processing').reduce((acc, b) => acc + b.totalAmount, 0);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={44} color="#059669" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 700, color: '#475569' }}>{isHindi ? 'लोड हो रहा है...' : 'Loading Payments Logs...'}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)', paddingBottom: '4rem' }}>

      {/* Hidden File Input for Bill Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
      />

      {/* Toast Notification */}
      {toastMessage && (
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
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
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
                <CreditCard size={13} color="#86EFAC" />
                {isHindi ? 'डीबीटी बिलिंग और भुगतान संवितरण' : 'DBT BILLING & PAYMENT DISBURSEMENT'}
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                {isHindi ? 'किसान बिल अपलोड और डीबीटी भुगतान' : 'Farmer Billing & DBT Payments'}
              </h1>
              <p style={{ opacity: 0.85, fontSize: '0.88rem', marginTop: '0.3rem', maxWidth: '650px' }}>
                {isHindi
                  ? 'प्रत्येक किसान के लिए तौल पर्ची/बिल अपलोड करें और डीबीटी भुगतान स्थिति (देय / प्रक्रियाधीन / स्वीकृत) प्रबंधित करें।'
                  : 'Upload weighment slips on unique farmer tokens, verify MSP amounts, and authorize direct bank transfer payments.'}
              </p>
            </div>

            {/* Total Settled Pill */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '0.75rem 1.25rem',
              backdropFilter: 'blur(10px)',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.72rem', opacity: 0.85, textTransform: 'uppercase', fontWeight: 700 }}>
                {isHindi ? 'कुल स्वीकृत डीबीटी निपटान' : 'Total Approved DBT'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#A7F3D0' }}>
                ₹{totalApproved.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1100px', marginTop: '-2rem', position: 'relative', zIndex: 10 }}>

        {/* 4 Financial Stat Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* Total Payable */}
          <div className="stat-card-modern">
            <div className="stat-icon-wrapper" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <CreditCard size={22} color="#1D4ED8" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                {isHindi ? 'कुल एमएसपी देय राशि' : 'Total Payable'}
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                ₹{totalPayable.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#1D4ED8', fontWeight: 700 }}>
                {bills.length} {isHindi ? 'लेनदेन' : 'transactions'}
              </div>
            </div>
          </div>

          {/* Approved */}
          <div className="stat-card-modern">
            <div className="stat-icon-wrapper" style={{ background: '#DCFCE7', border: '1px solid #86EFAC' }}>
              <CheckCircle2 size={22} color="#15803D" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                {isHindi ? 'स्वीकृत व भुगतान पूर्ण' : 'Approved (DBT Paid)'}
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#15803D', fontFamily: "'Outfit', sans-serif" }}>
                ₹{totalApproved.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#15803D', fontWeight: 700 }}>
                {bills.filter(b => b.paymentStatus === 'Approved').length} {isHindi ? 'किसानों को क्रेडिट' : 'farmers credited'}
              </div>
            </div>
          </div>

          {/* Processing */}
          <div className="stat-card-modern">
            <div className="stat-icon-wrapper" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <Clock size={22} color="#D97706" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                {isHindi ? 'प्रक्रियाधीन (Processing)' : 'In Processing'}
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#D97706', fontFamily: "'Outfit', sans-serif" }}>
                ₹{totalProcessing.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 700 }}>
                {isHindi ? 'बैंक सत्यापन जारी' : 'Bank clearance queue'}
              </div>
            </div>
          </div>

          {/* Due */}
          <div className="stat-card-modern">
            <div className="stat-icon-wrapper" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
              <AlertCircle size={22} color="#DC2626" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                {isHindi ? 'भुगतान देय (Due / Pending)' : 'Payment Due'}
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#DC2626', fontFamily: "'Outfit', sans-serif" }}>
                ₹{totalDue.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 700 }}>
                {isHindi ? 'बिल सत्यापन लंबित' : 'Awaiting bill upload'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Records Card */}
        <div className="card" style={{ padding: '1.75rem', borderRadius: '22px' }}>
          
          {/* Filter and Search Bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem',
            borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem'
          }}>
            {/* Status Filter Chips */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: isHindi ? 'सभी रिकॉर्ड्स' : 'All Bills' },
                { id: 'Due', label: isHindi ? 'देय' : 'Payment Due' },
                { id: 'Processing', label: isHindi ? 'प्रक्रियाधीन' : 'Processing' },
                { id: 'Approved', label: isHindi ? 'स्वीकृत' : 'Approved' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    border: '1.5px solid',
                    borderColor: filterStatus === tab.id ? '#059669' : '#E2E8F0',
                    background: filterStatus === tab.id ? '#ECFDF5' : '#FFFFFF',
                    color: filterStatus === tab.id ? '#065F46' : '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isHindi ? "किसान, खाता या बिल आईडी खोजें..." : "Search farmer, Aadhaar, bill ID..."}
                style={{
                  paddingLeft: '2.4rem', paddingRight: '0.75rem', height: '40px',
                  fontSize: '0.85rem', borderRadius: '10px', border: '1.5px solid #CBD5E1',
                  width: '100%', outline: 'none', background: '#F8FAFC'
                }}
              />
            </div>
          </div>

          {/* List of Farmer Billing Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredBills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                <AlertCircle size={36} color="#94A3B8" style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B' }}>
                  {isHindi ? 'कोई बिलिंग रिकॉर्ड नहीं मिला' : 'No billing records found'}
                </div>
              </div>
            ) : (
              filteredBills.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: '1.35rem',
                    background: '#F8FAFC',
                    borderRadius: '18px',
                    border: `1.5px solid ${b.paymentStatus === 'Approved' ? '#A7F3D0' : b.paymentStatus === 'Processing' ? '#FDE68A' : '#E2E8F0'}`,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  {/* Top Row: Farmer info & MSP Amount */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '14px',
                        background: 'linear-gradient(135deg, #ECFDF5, #A7F3D0)',
                        border: '1px solid #6EE7B7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, color: '#047857', fontSize: '1.2rem',
                        flexShrink: 0
                      }}>
                        {b.farmerName[0]}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A' }}>
                            {b.farmerName}
                          </span>
                          <span style={{
                            background: '#F1F5F9', color: '#475569', padding: '2px 8px',
                            borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, fontFamily: 'monospace'
                          }}>
                            {b.farmerId}
                          </span>
                          <span style={{
                            background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE',
                            padding: '2px 9px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800
                          }}>
                            🌾 {b.crop} • {b.verifiedWeight} Qtl @ ₹{b.mspRate}/Qtl
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.3rem' }}>
                          {isHindi ? 'बैंक खाता:' : 'Bank:'} {b.bankName} • A/C: <strong>{b.accountNo}</strong> (IFSC: {b.ifsc})
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                        {isHindi ? 'कुल निपटान राशि' : 'Total Settlement'}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#047857', fontFamily: "'Outfit', sans-serif" }}>
                        ₹{b.totalAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Bill Upload status + DBT Reference ID */}
                  <div style={{
                    marginTop: '1rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    {/* Bill file section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {b.billUploaded ? (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px',
                          padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: '#047857', fontWeight: 700
                        }}>
                          <FileText size={14} />
                          <span>{b.billFileName}</span>
                          <button
                            type="button"
                            onClick={() => alert(`Viewing attached bill: ${b.billFileName}`)}
                            style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', padding: '0 2px' }}
                            title="View Slip"
                          >
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#DC2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertCircle size={14} /> {isHindi ? 'तौल पर्ची/बिल अपलोड नहीं किया गया' : 'Weighment slip pending upload'}
                        </span>
                      )}

                      {/* Upload button */}
                      <button
                        type="button"
                        onClick={() => handleUploadClick(b.id)}
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px dashed #10B981',
                          color: '#059669',
                          borderRadius: '8px',
                          padding: '0.35rem 0.8rem',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Upload size={13} />
                        <span>{b.billUploaded ? (isHindi ? 'बिल बदलें' : 'Replace Bill') : (isHindi ? 'बिल अपलोड करें' : 'Upload Bill')}</span>
                      </button>
                    </div>

                    {/* DBT Reference if present */}
                    {b.dbtTxnId && (
                      <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                        {isHindi ? 'डीबीटी संदर्भ आईडी:' : 'DBT Ref:'} <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{b.dbtTxnId}</strong>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: 3 Distinct Interactive Action Buttons (Due, Processed, Approved) */}
                  <div style={{
                    marginTop: '0.85rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px dashed #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>
                      {isHindi ? 'भुगतान स्थिति बदलें:' : 'Set Payment Status:'}
                    </span>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* 1. Payment Due Button */}
                      <button
                        type="button"
                        onClick={() => updatePaymentStatus(b.id, 'Due')}
                        style={{
                          padding: '0.4rem 0.9rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          border: '1.5px solid',
                          borderColor: b.paymentStatus === 'Due' ? '#DC2626' : '#E2E8F0',
                          background: b.paymentStatus === 'Due' ? '#FEE2E2' : '#FFFFFF',
                          color: b.paymentStatus === 'Due' ? '#991B1B' : '#64748B',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <AlertCircle size={13} />
                        <span>{isHindi ? 'भुगतान देय' : 'Payment Due'}</span>
                      </button>

                      {/* 2. Payment Processed Button */}
                      <button
                        type="button"
                        onClick={() => updatePaymentStatus(b.id, 'Processing')}
                        style={{
                          padding: '0.4rem 0.9rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          border: '1.5px solid',
                          borderColor: b.paymentStatus === 'Processing' ? '#D97706' : '#E2E8F0',
                          background: b.paymentStatus === 'Processing' ? '#FEF3C7' : '#FFFFFF',
                          color: b.paymentStatus === 'Processing' ? '#92400E' : '#64748B',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Clock size={13} />
                        <span>{isHindi ? 'प्रक्रियाधीन' : 'Processing'}</span>
                      </button>

                      {/* 3. Approved Button */}
                      <button
                        type="button"
                        onClick={() => updatePaymentStatus(b.id, 'Approved')}
                        style={{
                          padding: '0.4rem 1.1rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          border: '1.5px solid',
                          borderColor: b.paymentStatus === 'Approved' ? '#059669' : '#10B981',
                          background: b.paymentStatus === 'Approved' ? '#059669' : 'linear-gradient(135deg, #059669, #10B981)',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>{isHindi ? 'डीबीटी स्वीकृत करें' : 'Approve Payment'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default CentrePayments;
