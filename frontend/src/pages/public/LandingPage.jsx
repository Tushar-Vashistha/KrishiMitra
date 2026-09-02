import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck, TrendingUp, Bot, MapPin, ChevronDown, ChevronUp,
  Phone, Mail, Wheat, Clock, ArrowRight, CheckCircle,
  Navigation, Sparkles, Award, User, UserPlus, Smartphone
} from 'lucide-react';
import { mockCentres } from '../../data/mockData';
import heroTractorImg from '../../assets/hero_tractor_field.jpg';

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

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: <ShieldCheck size={28} color="#15803D" strokeWidth={2.2} />,
      title: isHindi ? 'सरकारी मान्यता प्राप्त' : 'Government Certified',
      sub: isHindi ? 'विश्वसनीय और सुरक्षित' : 'Trusted & Secure',
    },
    {
      icon: (
        <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803D', lineHeight: 1 }}>
          ₹
        </span>
      ),
      title: isHindi ? 'सीधा भुगतान' : 'Direct Payment',
      sub: isHindi ? 'सीधे आपके बैंक खाते में' : 'Direct to your bank account',
    },
    {
      icon: <Clock size={28} color="#15803D" strokeWidth={2.2} />,
      title: isHindi ? 'लाइव कतार ट्रैकिंग' : 'Live Queue Tracking',
      sub: isHindi ? 'समय बचाएं, आसानी पाएं' : 'Save time, stay stress-free',
    },
    {
      icon: <Smartphone size={28} color="#15803D" strokeWidth={2.2} />,
      title: isHindi ? 'मोबाइल से आसान' : 'Easy on Mobile',
      sub: isHindi ? 'कहीं से भी, कभी भी' : 'Anywhere, anytime',
    },
  ];

  return (
    <div style={{ background: '#FFFFFF' }}>

      {/* ── Hero Section (Scenic Farm Landscape) ── */}
      <section style={{
        position: 'relative',
        minHeight: '620px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: '#0F172A',
      }}>
        {/* Full-color Crisp Background Image */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${heroTractorImg}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          opacity: 1,
        }} />

        {/* Soft, Natural Directional Light Overlay (Preserves Rich Sky & Fields) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.52) 36%, rgba(255, 255, 255, 0.15) 58%, rgba(255, 255, 255, 0) 80%)',
          pointerEvents: 'none',
        }} />

        {/* Content Container */}
        <div className="container" style={{
          position: 'relative',
          zIndex: 2,
          padding: '4.5rem 1.5rem 5.5rem',
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'flex-start',
        }}>
          {/* Left Hero Card Block */}
          <div style={{
            maxWidth: '620px',
            textAlign: 'left',
          }}>
            {/* Sunny Yellow Initiative Badge */}
            <div style={{ display: 'inline-flex', marginBottom: '1.25rem' }}>
              <span style={{
                background: 'rgba(254, 243, 199, 0.92)',
                backdropFilter: 'blur(10px)',
                border: '1.5px solid #FDE68A',
                color: '#B45309',
                padding: '0.45rem 1.25rem',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.02em',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.18)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}>
                ✨ {isHindi ? 'भारत सरकार की अधिकृत पहल' : 'Government of India Authorized Initiative'}
              </span>
            </div>

            {/* Hero Punchline */}
            <h1 style={{
              fontSize: 'clamp(2.5rem, 5.8vw, 3.85rem)',
              fontWeight: 900,
              lineHeight: 1.12,
              marginBottom: '1.1rem',
              color: '#0F172A',
              letterSpacing: '-0.03em',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
                {isHindi ? 'आपकी फसल,' : 'Your Crops,'}
                {/* 3 Green Leaves Sprout Icon */}
                <svg width="42" height="42" viewBox="0 0 48 48" fill="none" style={{ marginLeft: '10px', display: 'inline-block', filter: 'drop-shadow(0 2px 5px rgba(22,163,74,0.35))' }}>
                  <path d="M14 36C14 36 15 22 28 16C28 16 33 29 19 36C16 37 14 36 14 36Z" fill="#16A34A" />
                  <path d="M22 28C22 28 32 20 42 22C42 22 40 33 29 32C25 31 22 28 22 28Z" fill="#22C55E" />
                  <path d="M25 18C25 18 35 9 43 11C43 11 41 21 31 21C27 21 25 18 25 18Z" fill="#4ADE80" />
                  <path d="M12 40C18 34 27 24 35 17" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
              <span style={{
                color: '#15803D',
                fontWeight: 900,
                marginTop: '0.15rem',
                textShadow: '0 2px 10px rgba(21, 128, 61, 0.15)',
              }}>
                {isHindi ? 'हमारी ज़िम्मेदारी।' : 'Our Responsibility.'}
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 'clamp(1.05rem, 2.2vw, 1.2rem)',
              color: '#1E293B',
              maxWidth: '540px',
              margin: '0 0 2.2rem',
              lineHeight: 1.65,
              fontWeight: 600,
            }}>
              {isHindi ? (
                <>
                  सरकारी प्रमाणित केंद्रों से जुड़ें, और पाएं उचित मूल्य,<br />
                  पारदर्शी प्रक्रिया और समय पर भुगतान।
                </>
              ) : (
                <>
                  Connect with government certified centres, get fair MSP prices,<br />
                  transparent process, and timely payments.
                </>
              )}
            </p>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1.1rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              {/* Green Login Button */}
              <Link to="/login" style={{
                background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)',
                color: '#FFFFFF',
                padding: '0.9rem 2.4rem',
                borderRadius: '9999px',
                fontSize: '1.08rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                boxShadow: '0 6px 20px rgba(21, 128, 61, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(21, 128, 61, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(21, 128, 61, 0.4)';
              }}
              >
                <User size={20} color="#FFFFFF" strokeWidth={2.4} />
                <span>{isHindi ? 'लॉगिन करें' : 'Login'}</span>
                <ArrowRight size={19} color="#FFFFFF" strokeWidth={2.4} />
              </Link>

              {/* White Register Button */}
              <Link to="/register" style={{
                background: '#FFFFFF',
                color: '#1E293B',
                border: '1.5px solid #CBD5E1',
                padding: '0.85rem 2.3rem',
                borderRadius: '9999px',
                fontSize: '1.08rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.color = '#15803D';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.color = '#1E293B';
              }}
              >
                <UserPlus size={20} color="currentColor" strokeWidth={2.4} />
                <span>{isHindi ? 'रजिस्टर करें' : 'Register'}</span>
                <ArrowRight size={19} color="currentColor" strokeWidth={2.4} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Seamless Floating Feature Highlights Bar ── */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        marginTop: '-48px',
        padding: '0 1.5rem 3.5rem',
        background: 'linear-gradient(180deg, transparent 0%, #F8FAFC 48px, #F8FAFC 100%)',
      }}>
        <div className="container" style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {/* Glassmorphic Feature Highlights Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '1.4rem 1.8rem',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.09), 0 4px 16px -2px rgba(16, 185, 129, 0.05)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))',
            gap: '1.25rem',
            alignItems: 'center',
          }}>
            {features.map((f, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.15rem',
                padding: '0.4rem 0.6rem',
                borderRight: idx !== features.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                  border: '1px solid #A7F3D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)',
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: '#0F172A',
                    lineHeight: 1.25,
                  }}>
                    {f.title}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#64748B',
                    fontWeight: 600,
                    marginTop: '0.2rem',
                  }}>
                    {f.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll to Next Section Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '2rem',
          }}>
            <button
              onClick={scrollToServices}
              aria-label="Scroll to services"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '9999px',
                padding: '0.65rem 1.6rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#047857',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(3px)';
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.05)';
              }}
            >
              <span>{isHindi ? 'हमारी सेवाएं देखें' : 'Explore Our Services'}</span>
              <ChevronDown size={18} color="#059669" style={{ animation: 'bounce 1.5s infinite' }} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Services Section ── */}
      <section id="services" className="section" style={{ background: '#FFFFFF' }}>
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

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: 0 }}>
                  {centre.crops.map(c => (
                    <span key={c} style={{
                      background: '#ECFDF5', color: '#047857',
                      border: '1px solid #A7F3D0',
                      borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700,
                    }}>{c}</span>
                  ))}
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
                <a
                  href="tel:18001234567"
                  style={{
                    fontSize: '0.88rem',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#059669'}
                  onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                >
                  <Phone size={16} color="#059669" /> {t('tollFree')}
                </a>
                <a
                  href="mailto:support@krishimitra.in"
                  style={{
                    fontSize: '0.88rem',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#059669'}
                  onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                >
                  <Mail size={16} color="#059669" /> {t('email')}
                </a>
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
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>© 2026 KrishiMitra. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
