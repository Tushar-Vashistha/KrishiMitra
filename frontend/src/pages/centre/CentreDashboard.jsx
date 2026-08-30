import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { mockBookings, mockCounters, mockSlots } from '../../data/mockData';
import { Upload, CheckCircle, Clock, Users, BarChart3, Building, ShieldCheck } from 'lucide-react';

const COUNTER_STATUS = {
  Processing: { color: '#15803D', bg: '#DCFCE7', dot: '🟢', label: 'Processing' },
  Verification: { color: '#D97706', bg: '#FEF3C7', dot: '🟡', label: 'Verification' },
  Available: { color: '#64748B', bg: '#F1F5F9', dot: '⚪', label: 'Available' },
};

const CentreDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isHindi = i18n.language === 'hi';

  const [bookings, setBookings] = useState(mockBookings.centre);
  const [activeTab, setActiveTab] = useState('bookings');

  const markDone = (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, payment: 'Done' } : b));
  };

  const statsCards = [
    { label: 'Today\'s Bookings', value: bookings.length, icon: '📋', color: '#15803D' },
    { label: 'Processing', value: bookings.filter(b => b.status === 'Processing').length, icon: '⚙️', color: '#1D4ED8' },
    { label: 'Payments Done', value: bookings.filter(b => b.payment === 'Done').length, icon: '✅', color: '#047857' },
    { label: 'Available Slots', value: mockSlots.filter(s => s.available).length, icon: '📅', color: '#D97706' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)', paddingBottom: '3rem' }}>

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #064E3B 0%, #15803D 50%, #047857 100%)', padding: '2.5rem 1.5rem', color: 'white' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 56, height: 56, background: 'rgba(255,255,255,0.2)',
              borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.4)', fontSize: '1.8rem'
            }}>🏢</div>
            <div>
              <span className="hero-badge" style={{ background: 'rgba(255,255,255,0.2)', marginBottom: '0.2rem' }}>
                PROCUREMENT OFFICER DASHBOARD
              </span>
              <h1 style={{ fontWeight: 800, fontSize: '1.4rem', margin: 0 }}>
                {user?.name || 'Shri Ram Govt. Procurement Centre'}
              </h1>
              <div style={{ opacity: 0.85, fontSize: '0.82rem', marginTop: '0.2rem' }}>
                Centre ID: {user?.centreId || 'UP-LKO-001'} • Lucknow District, UP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container" style={{ marginTop: '-1.5rem', position: 'relative', zIndex: 10 }}>
        <div className="card" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem',
          padding: '1.25rem 1rem', textAlign: 'center', background: '#FFFFFF'
        }}>
          {statsCards.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: s.color, lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Counters */}
      <div className="container" style={{ marginTop: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#14532D', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🔴 Live Operational Counters
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {mockCounters.map((counter) => {
            const st = COUNTER_STATUS[counter.status];
            return (
              <div key={counter.id} className="card" style={{ padding: '1.1rem', border: `2px solid ${st.color}30` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#334155' }}>Counter #{counter.id}</span>
                  <span style={{ background: st.bg, color: st.color, padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800 }}>
                    {st.dot} {st.label}
                  </span>
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.75rem', color: '#1E293B' }}>
                  {counter.token ? `#${counter.token}` : '—'}
                </div>
                {counter.farmer && (
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem', fontWeight: 600 }}>
                    👨‍🌾 {counter.farmer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tab View */}
        <div className="card">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
            <button
              onClick={() => setActiveTab('bookings')}
              style={{
                background: activeTab === 'bookings' ? '#15803D' : '#F1F5F9',
                color: activeTab === 'bookings' ? 'white' : '#64748B',
                border: 'none', borderRadius: '10px', padding: '0.55rem 1.2rem',
                fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer'
              }}
            >
              Farmer Queue Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              style={{
                background: activeTab === 'slots' ? '#15803D' : '#F1F5F9',
                color: activeTab === 'slots' ? 'white' : '#64748B',
                border: 'none', borderRadius: '10px', padding: '0.55rem 1.2rem',
                fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer'
              }}
            >
              Slot Overview
            </button>
          </div>

          {activeTab === 'bookings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {bookings.map((b) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#1E293B' }}>👨‍🌾 {b.farmer}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                      Token {b.id} • {b.crop} ({b.weight} Qtl) • 📞 {b.mobile}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {b.payment === 'Done' ? (
                      <span className="badge-green">✓ DBT Paid</span>
                    ) : (
                      <button
                        onClick={() => markDone(b.id)}
                        className="btn-primary"
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '8px' }}
                      >
                        <CheckCircle size={14} /> Approve Payment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'slots' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              {mockSlots.map(s => (
                <div key={s.id} style={{ padding: '0.85rem', background: s.available ? '#DCFCE7' : '#FEE2E2', borderRadius: '12px', border: `1px solid ${s.available ? '#86EFAC' : '#FCA5A5'}` }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E293B' }}>{s.time}</div>
                  <div style={{ fontSize: '0.78rem', color: s.available ? '#15803D' : '#DC2626', fontWeight: 700, marginTop: '0.2rem' }}>
                    {s.available ? 'Available' : 'Booked'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CentreDashboard;
