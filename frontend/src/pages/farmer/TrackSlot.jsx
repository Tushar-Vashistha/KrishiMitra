import React from 'react';
import { Navigation, Clock, MapPin, CheckCircle2, ShieldCheck, QrCode, Phone } from 'lucide-react';
import { mockCentres } from '../../data/mockData';

const TrackSlot = () => {
  const activeCentre = mockCentres[0];

  const steps = [
    { title: 'Token Issued', desc: 'Token #42 assigned for Wheat (25 Qtl)', done: true, time: '08:30 AM' },
    { title: 'Gate Entrance', desc: 'Present QR Code at Bhagwanpur Entry Gate', done: true, time: '10:05 AM' },
    { title: 'Quality Inspection', desc: 'Moisture & Grain Quality Testing at Counter #2', done: false, active: true, time: 'In Progress' },
    { title: 'Weighbridge & Unloading', desc: 'Electronic Net Weight Verification', done: false, time: 'Pending' },
    { title: 'Direct Bank Settlement', desc: 'MSP Funds credited to SBI Account (A/C **4829)', done: false, time: 'Pending' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)', paddingBottom: '4rem' }}>

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #064E3B 0%, #0284C7 100%)', padding: '2rem 1.5rem', color: 'white' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="hero-badge" style={{ background: 'rgba(255,255,255,0.2)', marginBottom: '0.5rem' }}>
              ⚡ LIVE SLOT TRACKING
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
              Token #42 — Bhagwanpur Centre
            </h1>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '0.8rem 1.4rem', backdropFilter: 'blur(8px)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Estimated Turn</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>10:15 AM</div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }} className="track-grid">

        {/* Live Timeline */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#14532D', marginBottom: '1.25rem' }}>
            📍 Procurement Progress Status
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: step.done ? '#15803D' : step.active ? '#F59E0B' : '#E2E8F0',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, flexShrink: 0, boxShadow: step.done ? '0 4px 12px rgba(21,128,61,0.3)' : 'none'
                }}>
                  {step.done ? <CheckCircle2 size={20} /> : i + 1}
                </div>
                <div style={{ flex: 1, background: step.active ? '#FEF3C7' : '#F8FAFC', borderRadius: '14px', padding: '0.85rem 1.1rem', border: `1px solid ${step.active ? '#FDE68A' : '#E2E8F0'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: step.active ? '#D97706' : '#1E293B' }}>
                      {step.title}
                    </div>
                    <span className={step.done ? 'badge-green' : step.active ? 'badge-yellow' : 'badge-gray'}>
                      {step.time}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.2rem' }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code Pass & Centre Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* QR Code Card */}
          <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #FFFFFF 0%, #ECFDF5 100%)', border: '1px solid #A7F3D0' }}>
            <span className="badge-green" style={{ marginBottom: '0.8rem' }}>Entry Gate Pass</span>
            <div style={{
              width: 140, height: 140, margin: '0.5rem auto 1rem',
              background: '#FFFFFF', padding: '10px', borderRadius: '16px',
              border: '2px solid #22C55E', boxShadow: '0 8px 20px rgba(34,197,94,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <QrCode size={110} color="#14532D" />
            </div>
            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#14532D' }}>Token #42</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>Show QR code at main gate barrier</div>
          </div>

          {/* Centre Contacts */}
          <div className="card">
            <h4 style={{ fontWeight: 800, color: '#14532D', marginBottom: '0.75rem' }}>🏢 Procurement Centre</h4>
            <div style={{ fontSize: '0.88rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontWeight: 700 }}>{activeCentre.name}</div>
              <div style={{ color: '#64748B', fontSize: '0.82rem' }}>{activeCentre.address}</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803D', fontWeight: 700 }}>
                <Phone size={14} /> Helpline: {activeCentre.phone}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .track-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default TrackSlot;
