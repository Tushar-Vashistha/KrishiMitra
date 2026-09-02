import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { centreService } from '../../services/api';
import { MapPin, Phone, Clock, Navigation, ArrowRight, Building, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const NearestCentres = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [centres, setCentres] = useState([]);

  useEffect(() => {
    const fetchCentres = async () => {
      try {
        const res = await centreService.getAll();
        if (res && res.success && Array.isArray(res.data)) {
          setCentres(res.data);
        }
      } catch (err) {
        console.error('Failed to load centres:', err);
      }
    };
    fetchCentres();
  }, []);

  const typeColor = {
    'Government': { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
    'Cooperative': { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
    'Authorized Private': { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  };

  const filteredCentres = centres.filter(c => {
    const typeStr = c.type || 'Government';
    const nameStr = c.name || '';
    const addressStr = c.address || '';
    const matchesFilter = filter === 'All' || typeStr.toLowerCase().includes(filter.toLowerCase());
    const matchesSearch = nameStr.toLowerCase().includes(search.toLowerCase()) || addressStr.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)', paddingBottom: '3rem' }}>

      {/* Header Banner */}
      <div style={{
        position: 'relative',
        backgroundImage: 'url("/location-banner.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '3rem 1.5rem',
        color: 'white',
        overflow: 'hidden'
      }}>
        {/* Semi-transparent dark green overlay to maintain text legibility */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.9) 0%, rgba(21, 128, 61, 0.9) 100%)',
          zIndex: 1
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Logo icon */}
          <div style={{ flexShrink: 0 }}>
            <img
              src="/location-icon.png"
              alt="Location Icon"
              style={{
                width: 64,
                height: 64,
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                objectFit: 'cover'
              }}
            />
          </div>
          <div>
            <span className="hero-badge" style={{ background: 'rgba(255,255,255,0.2)', marginBottom: '0.5rem' }}>
              📍 GOVERNMENT PROCUREMENT NETWORK
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
              {t('nearestCentres')}
            </h1>
            <p style={{ opacity: 0.9, fontSize: '0.95rem', marginTop: '0.3rem', fontWeight: 500 }}>
              Locate authorized grain purchase centres, check slot availability & get directions
            </p>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '1.5rem' }}>

        {/* Embedded Map Section */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: '280px', marginBottom: '1.5rem', position: 'relative' }}>
          <iframe
            title="Nearest Procurement Centres Map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=80.70%2C26.70%2C81.10%2C27.00&layer=mapnik&marker=26.8467%2C80.9462"
            style={{ width: '100%', height: '100%', border: 'none' }}
            loading="lazy"
          />
          <div style={{
            position: 'absolute', bottom: '1rem', left: '1rem',
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
            padding: '0.5rem 0.9rem', borderRadius: '10px', fontSize: '0.78rem',
            fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            📍 1,200+ Verified Centres Active Across 18 States
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} color="#15803D" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by centre name or location..."
              className="input-field"
              style={{ paddingLeft: '3rem', borderRadius: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['All', 'Government', 'Cooperative', 'Private'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? '#15803D' : '#FFFFFF',
                  color: filter === f ? '#FFFFFF' : '#334155',
                  border: `1.5px solid ${filter === f ? '#15803D' : '#CBD5E1'}`,
                  borderRadius: '30px', padding: '0.45rem 1.1rem',
                  fontSize: '0.85rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {isHindi ? (
                  f === 'All' ? 'सभी' :
                  f === 'Government' ? t('government') :
                  f === 'Cooperative' ? t('cooperative') :
                  f === 'Private' ? 'निजी' : f
                ) : f}
              </button>
            ))}
          </div>
        </div>

        {/* Centre Cards List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredCentres.length > 0 ? (
            filteredCentres.map((centre) => {
              const tc = typeColor[centre.type] || typeColor['Government'];
              const isOpen = centre.status === 'ACTIVE' || centre.open !== false;
              const openTime = centre.openTime || centre.openingTime || '08:00 AM';
              const closeTime = centre.closeTime || centre.closingTime || '06:00 PM';
              const cropsList = Array.isArray(centre.crops) ? centre.crops : [];
              return (
                <div key={centre.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{
                          width: 44, height: 44, background: tc.bg, borderRadius: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${tc.border}`, fontSize: '1.2rem'
                        }}>
                          🏢
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1E293B', lineHeight: 1.2 }}>
                            {isHindi ? (centre.nameHi || centre.name) : centre.name}
                          </div>
                          <span style={{ fontSize: '0.72rem', background: tc.bg, color: tc.color, fontWeight: 700, padding: '2px 8px', borderRadius: '4px', marginTop: '0.2rem', display: 'inline-block' }}>
                            {isHindi ? (
                              centre.type === 'Government' ? t('government') :
                              centre.type === 'Cooperative' ? t('cooperative') :
                              centre.type === 'Authorized Private' ? t('authorizedPrivate') :
                              centre.type
                            ) : centre.type}
                          </span>
                        </div>
                      </div>

                      <span className={isOpen ? 'badge-green' : 'badge-red'}>
                        {isOpen ? '● Open' : '● Closed'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: '1rem 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={14} color="#15803D" /> {centre.address} {centre.distance ? `(${centre.distance})` : ''}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} color="#D97706" /> {openTime} – {closeTime}
                      </div>
                      {centre.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Phone size={14} color="#1D4ED8" /> {centre.phone}
                        </div>
                      )}
                    </div>

                    {cropsList.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        {cropsList.map(c => (
                          <span key={typeof c === 'string' ? c : c.name} style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {typeof c === 'string' ? c : c.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {centre.lat && centre.lng ? (
                      <a
                        href={`https://maps.google.com/?q=${centre.lat},${centre.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline"
                        style={{ flex: 1, padding: '0.55rem', fontSize: '0.85rem' }}
                      >
                        <Navigation size={14} /> Map
                      </a>
                    ) : null}

                    <Link to="/farmer/book-slot" className="btn-primary" style={{ flex: 1, padding: '0.55rem', fontSize: '0.85rem' }}>
                      Book Slot <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', gridColumn: '1 / -1', background: '#F8FAFC', border: '1.5px dashed #CBD5E1' }}>
              <Building size={48} color="#94A3B8" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                {isHindi ? 'कोई खरीद केंद्र नहीं मिला' : 'No Procurement Centres Found'}
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.92rem' }}>
                {isHindi ? 'वर्तमान में कोई खरीद केंद्र उपलब्ध नहीं है।' : 'There are currently no procurement centres available.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NearestCentres;
