import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck, TrendingUp, Bot, MapPin, ChevronDown, ChevronUp,
  Phone, Mail, Wheat, Clock, ArrowRight, CheckCircle,
  Navigation, Sparkles, Award
} from 'lucide-react';
import { mockCentres } from '../../data/mockData';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80&auto=format&fit=crop';

const LandingPage = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const [openFaq, setOpenFaq] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);

  const faqs = [
    { q: t('faq1Q'), a: t('faq1A') },
    { q: t('faq2Q'), a: t('faq2A') },
    { q: t('faq3Q'), a: t('faq3A') },
    { q: t('faq4Q'), a: t('faq4A') },
    { q: t('faq5Q'), a: t('faq5A') },
    { q: t('faq6Q'), a: t('faq6A') },
  ];

  const stats = [
    { value: '2.4L+', label: isHindi ? 'किसान पंजीकृत' : 'Farmers Registered', icon: '👨‍🌾' },
    { value: '1,200+', label: isHindi ? 'खरीद केंद्र' : 'Procurement Centres', icon: '🏢' },
    { value: '₹450Cr+', label: isHindi ? 'भुगतान किया गया' : 'Payments Processed', icon: '💰' },
    { value: '18', label: isHindi ? 'राज्य' : 'States Covered', icon: '🗺️' },
  ];

  return (
    <div style={{ background: '#FFFFFF' }}>

      {/* ── Hero Section (Light, Bright & Fresh) ── */}
      <section style={{
        position: 'relative',
        minHeight: '560px',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #ECFDF5 40%, #FEF3C7 100%)',
        overflow: 'hidden',
        borderBottom: '1px solid #ECFDF5',
      }}>
        {/* Soft Background Unsplash Image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("${HERO_IMAGE}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.12,
          mixBlendMode: 'multiply',
          pointerEvents: 'none'
        }} />

        {/* Decorative Glow Circles */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '450px', height: '450px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Content */}
        <div className="container" style={{
          position: 'relative', zIndex: 1,
          textAlign: 'center',
          padding: '4.5rem 1.5rem',
          maxWidth: '880px',
          margin: '0 auto',
        }}>
          {/* Sunny Yellow Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.2rem' }}>
            <span className="hero-badge-light">
              ✨ {isHindi ? 'भारत सरकार की अधिकृत पहल' : 'Government of India Authorized Initiative'}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5.5vw, 3.5rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: '1.2rem',
            color: '#0F172A',
            letterSpacing: '-0.03em',
          }}>
            {isHindi ? (
              <>
                अपनी फसल <span style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #D97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>पूर्ण विश्वास के साथ बेचें</span>
              </>
            ) : (
              <>
                Sell Your Crops with <span style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #D97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Complete Confidence</span>
              </>
            )}
          </h1>

          <p style={{
            fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)',
            color: '#475569',
            maxWidth: '650px',
            margin: '0 auto 2.2rem',
            lineHeight: 1.7,
            fontWeight: 500,
          }}>
            {t('heroSubtitle')}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn-yellow" style={{
              padding: '0.9rem 2.2rem', fontSize: '1.08rem',
              borderRadius: '14px', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            }}>
              {t('loginBtn')} <ArrowRight size={20} />
            </Link>
            <Link to="/register" className="btn-outline-green" style={{
              padding: '0.9rem 2.2rem', fontSize: '1.08rem',
              borderRadius: '14px', textDecoration: 'none'
            }}>
              {t('registerBtn')}
            </Link>
          </div>

          {/* Trust Badges */}
          <div style={{
            display: 'flex', gap: '0.85rem', justifyContent: 'center',
            marginTop: '2.5rem', flexWrap: 'wrap',
          }}>
            {[
              isHindi ? '🏛️ भारत सरकार द्वारा सत्यापित' : '🏛️ Govt. of India Verified',
              isHindi ? '🔒 सीधा डीबीटी बैंक भुगतान' : '🔒 Direct DBT Bank Settlement',
              isHindi ? '📱 सभी मोबाइल फोन पर काम करता है' : '📱 Works on All Mobile Phones',
            ].map((b, i) => (
              <span key={i} className="trust-badge-light">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar (Sunny Light Yellow & Mint) ── */}
      <section style={{
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #ECFDF5 100%)',
        padding: '2.2rem 1.5rem',
        borderBottom: '1px solid #FEF3C7',
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1.5rem',
          textAlign: 'center',
        }}>
          {stats.map((s, i) => (
            <div key={i} className="card" style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.2rem 0.75rem',
              border: '1.5px solid #FDE68A',
              boxShadow: '0 4px 15px rgba(245,158,11,0.08)',
              transition: 'all 0.3s ease',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services Section ── */}
      <section className="section" style={{ background: '#FFFFFF' }}>
        <div className="container">
          <h2 className="section-title">{t('ourServices')}</h2>
          <p className="section-subtitle">{t('servicesSubtitle')}</p>
          <div className="section-accent" />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '1.75rem',
          }}>
            {/* Trust Score */}
            <div className="card" style={{ textAlign: 'center', padding: '2.2rem 1.75rem' }}>
              <div className="icon-wrap-green">
                <ShieldCheck size={34} color="#059669" />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.6rem', color: '#047857' }}>
                {t('trustScore')}
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {t('trustScoreDesc')}
              </p>
              <div style={{ marginTop: '1.2rem' }}>
                <span className="badge-green">● Verified Farmers</span>
              </div>
            </div>

            {/* Daily Prices */}
            <div className="card" style={{ textAlign: 'center', padding: '2.2rem 1.75rem' }}>
              <div className="icon-wrap-gold">
                <TrendingUp size={34} color="#D97706" />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.6rem', color: '#047857' }}>
                {t('dailyPrices')}
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {t('dailyPricesDesc')}
              </p>
              <div style={{ marginTop: '1.2rem' }}>
                <span className="badge-yellow">● Live MSP Rates</span>
              </div>
            </div>

            {/* KrishiMitra AI */}
            <div className="card" style={{ textAlign: 'center', padding: '2.2rem 1.75rem' }}>
              <div className="icon-wrap-blue">
                <Bot size={34} color="#1D4ED8" />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.6rem', color: '#047857' }}>
                {t('krishiMitraAI')}
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {t('krishiMitraAIDesc')}
              </p>
              <div style={{ marginTop: '1.2rem' }}>
                <span className="badge-blue">● 24×7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works (Clean White Background with Yellow Badges) ── */}
      <section className="section" style={{
        background: 'linear-gradient(180deg, #F4FBF7 0%, #FFFFFF 100%)',
        borderTop: '1px solid #ECFDF5',
        borderBottom: '1px solid #ECFDF5',
      }}>
        <div className="container">
          <h2 className="section-title">
            {isHindi ? 'यह कैसे काम करता है?' : 'How It Works'}
          </h2>
          <p className="section-subtitle">
            {isHindi ? 'चार आसान चरणों में अपनी फसल बेचें' : 'Sell your crop in 4 easy steps'}
          </p>
          <div className="section-accent" />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
          }}>
            {[
              { step: '1', icon: '📱', title: isHindi ? 'रजिस्टर करें' : 'Register & Login', desc: isHindi ? 'OTP से सत्यापित करके पंजीकरण करें' : 'Register with mobile OTP verification' },
              { step: '2', icon: '📅', title: isHindi ? 'स्लॉट बुक करें' : 'Book a Slot', desc: isHindi ? 'निकटतम केंद्र पर अपना समय चुनें' : 'Choose your time at the nearest centre' },
              { step: '3', icon: '🌾', title: isHindi ? 'फसल लाएं' : 'Bring Your Crop', desc: isHindi ? 'टोकन नंबर से प्रवेश करें' : 'Enter with your token number' },
              { step: '4', icon: '💰', title: isHindi ? 'भुगतान पाएं' : 'Get Paid', desc: isHindi ? 'सीधे बैंक में MSP भुगतान' : 'MSP payment directly to your bank' },
            ].map((item, i) => (
              <div
                key={i}
                className="card"
                style={{
                  textAlign: 'center',
                  padding: '2.2rem 1.25rem',
                  border: hoveredStep === i ? '2px solid #10B981' : '1.5px solid #E2E8F0',
                  transform: hoveredStep === i ? 'translateY(-6px)' : 'translateY(0)',
                  transition: 'all 0.3s ease',
                  background: '#FFFFFF',
                }}
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ECFDF5, #A7F3D0)',
                  border: '2px solid #6EE7B7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem', fontSize: '2rem',
                  position: 'relative',
                  boxShadow: '0 6px 16px rgba(16,185,129,0.18)',
                }}>
                  {item.icon}
                  <span style={{
                    position: 'absolute', top: -8, right: -8,
                    width: 28, height: 28,
                    background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                    borderRadius: '50%', color: '#0F172A',
                    fontSize: '0.82rem', fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 3px 10px rgba(245,158,11,0.4)',
                  }}>{item.step}</span>
                </div>
                <h4 style={{ fontWeight: 800, marginBottom: '0.5rem', color: '#0F172A', fontSize: '1.05rem' }}>{item.title}</h4>
                <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nearest Centres Section ── */}
      <section className="section" style={{ background: '#FFFFFF' }}>
        <div className="container">
          <h2 className="section-title">{t('nearestCentres')}</h2>
          <p className="section-subtitle">{t('nearestCentresSubtitle')}</p>
          <div className="section-accent" />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}>
            {mockCentres.map(centre => (
              <div key={centre.id} className="card" style={{ position: 'relative', padding: '1.5rem' }}>
                <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem' }}>
                  <span className={centre.open ? 'badge-green' : 'badge-red'}>
                    {centre.open ? `● ${t('open')}` : `● ${t('closed')}`}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.9rem', paddingRight: '3rem' }}>
                  <div style={{
                    width: 46, height: 46,
                    background: 'linear-gradient(135deg, #ECFDF5, #A7F3D0)',
                    borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(16,185,129,0.15)',
                  }}>
                    <MapPin size={22} color="#059669" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A', lineHeight: 1.3 }}>
                      {isHindi ? centre.nameHi : centre.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginTop: '0.1rem' }}>
                      {isHindi ? (
                        centre.type === 'Government' ? t('government') :
                        centre.type === 'Cooperative' ? t('cooperative') :
                        centre.type === 'Authorized Private' ? t('authorizedPrivate') :
                        centre.type
                      ) : centre.type}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.9rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', gap: '0.4rem' }}>
                    <Navigation size={14} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{centre.distance} away • {centre.address}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', gap: '0.4rem' }}>
                    <Clock size={14} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{centre.openTime} – {centre.closeTime}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {centre.crops.map(c => (
                    <span key={c} style={{
                      background: '#ECFDF5', color: '#047857',
                      border: '1px solid #A7F3D0',
                      borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700,
                    }}>{c}</span>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: centre.slotsAvailable > 0 ? '#047857' : '#DC2626' }}>
                    {centre.slotsAvailable > 0
                      ? `✅ ${centre.slotsAvailable} ${t('slotsAvailable')}`
                      : `❌ No slots available`}
                  </div>
                  <Link to="/login" className="btn-primary" style={{
                    fontSize: '0.82rem', padding: '6px 16px', borderRadius: '20px', textDecoration: 'none'
                  }}>
                    Book <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="section" style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <div className="container" style={{ maxWidth: '780px' }}>
          <h2 className="section-title">{t('faqTitle')}</h2>
          <p className="section-subtitle">{t('faqSubtitle')}</p>
          <div className="section-accent" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  border: `1.5px solid ${openFaq === i ? '#10B981' : '#E2E8F0'}`,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  transition: 'all 0.25s ease',
                  background: openFaq === i ? '#FFFFFF' : '#FFFFFF',
                  boxShadow: openFaq === i ? '0 8px 25px rgba(16,185,129,0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.1rem 1.3rem',
                    background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    fontWeight: 800, fontSize: '0.98rem', color: '#0F172A',
                    fontFamily: 'inherit', gap: '0.5rem',
                    minHeight: '56px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{
                      width: 28, height: 28,
                      background: openFaq === i ? '#10B981' : '#ECFDF5',
                      borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900,
                      color: openFaq === i ? 'white' : '#047857', flexShrink: 0,
                    }}>{i + 1}</span>
                    {faq.q}
                  </span>
                  {openFaq === i ? <ChevronUp size={20} color="#059669" /> : <ChevronDown size={20} color="#94A3B8" />}
                </button>
                {openFaq === i && (
                  <div style={{
                    padding: '0 1.3rem 1.25rem 3.5rem',
                    color: '#475569', fontSize: '0.92rem', lineHeight: 1.75,
                    borderTop: '1px solid #F1F5F9', paddingTop: '0.9rem',
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer Section (Fresh Light Slate & Mint) ── */}
      <footer style={{
        background: 'linear-gradient(180deg, #F8FAFC 0%, #ECFDF5 100%)',
        color: '#0F172A',
        padding: '3.5rem 1.5rem 1.75rem',
        borderTop: '1px solid #E2E8F0',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #F59E0B, #FBBF24, #10B981, #059669)',
        }} />

        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem',
          }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.9rem' }}>
                <img src="/logo.png" alt="KrishiMitra Logo" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: '10px', boxShadow: '0 4px 12px rgba(16,185,129,0.15)' }} />
                <img src="/brand-name-transparent.png" alt="KrishiMitra" style={{ height: '36px', objectFit: 'contain' }} />
              </div>
              <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.7, fontWeight: 500 }}>
                {t('footerTagline')}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <span className="badge-green">Govt. Verified</span>
                <span className="badge-yellow">MSP Portal</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ fontWeight: 800, marginBottom: '1rem', color: '#B45309', fontSize: '0.95rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {t('quickLinks')}
              </h4>
              {[
                ['/login', t('loginBtn')],
                ['/register/farmer', isHindi ? 'किसान पंजीकरण' : 'Farmer Registration'],
                ['/register/centre', isHindi ? 'केंद्र पंजीकरण' : 'Centre Registration'],
                ['/nearest-centres', isHindi ? 'निकटतम केंद्र' : 'Nearest Centres'],
              ].map(([to, label]) => (
                <Link key={to} to={to} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  color: '#475569', textDecoration: 'none', fontSize: '0.9rem',
                  marginBottom: '0.6rem', fontWeight: 600, transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#059669'; e.currentTarget.style.paddingLeft = '4px'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.paddingLeft = '0'; }}
                >
                  <ArrowRight size={14} color="#059669" /> {label}
                </Link>
              ))}
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontWeight: 800, marginBottom: '1rem', color: '#B45309', fontSize: '0.95rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {t('contact')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.88rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <Mail size={16} color="#059669" /> {t('email')}
                </span>
                <div style={{
                  marginTop: '0.75rem',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.6, fontWeight: 600 }}>
                    🏛️ Ministry of Agriculture &amp; Farmers Welfare<br />
                    Government of India
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #E2E8F0',
            paddingTop: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '0.5rem',
          }}>
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>{t('madeWith')}</span>
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>© 2024 KrishiMitra. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
