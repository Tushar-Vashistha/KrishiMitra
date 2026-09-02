import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { marketService } from '../../services/api';
import { mockMandiRates } from '../../data/mockData';
import { TrendingUp, TrendingDown, RefreshCw, Wheat, Search } from 'lucide-react';

import riceCrop from '../../assets/rice_crop.jpg';
import wheatCrop from '../../assets/wheat_crop.jpg';
import mustardCrop from '../../assets/mustard_crop.jpg';
import cornCrop from '../../assets/corn_crop.jpg';

const CROP_IMAGES = {
  'Rice': riceCrop,
  'Wheat': wheatCrop,
  'Mustard': mustardCrop,
  'Sugarcane': '/sugarcane_crop.jpg',
  'Onion': '/onion_crop.png',
  'Tomato': '/tomato_crop.jpg',
  'Maize': cornCrop,
  'Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80&auto=format&fit=crop',
  'Soybean': '/soybean_crop.jpg',
  'Groundnut': '/groundnut_crop.jpg',
  'Chana': '/chana_crop.jpg',
  'Paddy': riceCrop,
};

const MandiRates = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const now = new Date().toLocaleString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit' });
  const [query, setQuery] = useState('');
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await marketService.getRates();
        if (res.success && res.data) {
          setRates(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch market rates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const filteredRates = rates.filter(r =>
    (r.crop || '').toLowerCase().includes(query.toLowerCase()) || (r.cropHi || '').includes(query)
  );

  const renderTrendBadge = (rate) => {
    let changeVal = rate.change;
    let trendVal = rate.trend;

    let parsedNum = NaN;
    if (typeof changeVal === 'string') {
      parsedNum = parseFloat(changeVal.replace('+', ''));
    } else if (typeof changeVal === 'number') {
      parsedNum = changeVal;
    }

    if (isNaN(parsedNum) || parsedNum === 0 || changeVal === '+0' || changeVal === '0') {
      if (rate.market && rate.msp && rate.market !== rate.msp) {
        parsedNum = rate.market - rate.msp;
        changeVal = parsedNum > 0 ? `+${parsedNum}` : `${parsedNum}`;
        trendVal = parsedNum > 0 ? 'up' : parsedNum < 0 ? 'down' : 'stable';
      }
    }

    const isUp = trendVal === 'up' || parsedNum > 0;
    const isDown = trendVal === 'down' || parsedNum < 0;

    const displayStr = typeof changeVal === 'string'
      ? changeVal
      : (parsedNum > 0 ? `+${parsedNum}` : `${parsedNum}`);

    const badgeClass = isUp ? 'badge-green' : isDown ? 'badge-red' : 'badge-gray';

    return (
      <span className={badgeClass}>
        {isDown ? <TrendingDown size={14} /> : <TrendingUp size={14} />} {displayStr}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={44} color="#059669" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 700, color: '#475569' }}>{isHindi ? 'लोड हो रहा है...' : 'Loading Mandi Rates...'}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)', paddingBottom: '3rem' }}>

      <div className="container" style={{ marginTop: '2rem', maxWidth: '1100px' }}>

        {/* Modern Header Title */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ 
              background: 'rgba(34, 197, 94, 0.12)', 
              color: '#166534', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '0.5rem'
            }}>
              {isHindi ? '📊 लाइव मंडी और एमएसपी दरें' : '📊 LIVE MANDI & MSP RATES'}
            </span>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 900, 
              color: '#064E3B',
              margin: '0',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '-0.03em',
              lineHeight: 1.15
            }}>
              {t('mandiRatesTitle')}
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginTop: '0.5rem', marginBlockEnd: 0, lineHeight: 1.45 }}>
              {t('mandiRatesSubtitle')}
            </p>
          </div>
          <div style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
            padding: '0.6rem 1.2rem', 
            borderRadius: '14px', 
            fontSize: '0.85rem', 
            fontWeight: 600,
            color: '#475569',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            <RefreshCw size={14} color="#15803D" /> {isHindi ? `अपडेट किया गया: आज, ${now}` : `Updated: Today, ${now}`}
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search size={18} color="#15803D" style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isHindi ? "फसल का नाम खोजें (जैसे: गेहूं, धान, सरसों)..." : "Search crop by name (e.g. Wheat, धान, Mustard)..."}
            className="input-field"
            style={{ paddingLeft: '3.2rem', borderRadius: '14px', height: '50px' }}
          />
        </div>

        {/* Grid Cards of Commodities */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {filteredRates.map((rate) => {
            const img = CROP_IMAGES[rate.crop] || CROP_IMAGES['Wheat'];
            return (
              <div key={rate.id} className="card img-card" style={{ padding: 0 }}>
                <div style={{ height: '140px', position: 'relative', overflow: 'hidden' }}>
                  <img src={img} alt={rate.crop} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, transparent 40%, rgba(15,23,42,0.85) 100%)'
                  }} />
                  <div style={{ position: 'absolute', bottom: '0.8rem', left: '1rem', color: 'white' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{isHindi ? rate.cropHi : rate.crop}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>{isHindi ? '₹/क्विंटल' : rate.unit}</div>
                  </div>
                  <div style={{ position: 'absolute', top: '0.8rem', right: '0.8rem' }}>
                    {renderTrendBadge(rate)}
                  </div>
                </div>

                <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: '#F0FDF4', padding: '0.8rem', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700 }}>{t('govtMspCard')}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#15803D', marginTop: '0.1rem' }}>
                      ₹{rate.msp.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>{t('marketRateCard')}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1E293B', marginTop: '0.1rem' }}>
                      ₹{rate.market.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MandiRates;
