import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import {
  Menu, X, LayoutDashboard, User, Settings, LogOut,
  Globe, Building2
} from 'lucide-react';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isHindi = i18n.language === 'hi';

  const toggleLanguage = () => {
    i18n.changeLanguage(isHindi ? 'en' : 'hi');
  };

  const dashboardPath = user?.role === 'farmer'
    ? '/farmer/dashboard'
    : user?.role === 'centre'
    ? '/centre/dashboard'
    : '/';

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header style={{
      background: '#FFFFFF',
      boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(16, 185, 129, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 999,
      borderBottom: '1px solid #ECFDF5',
    }}>
      {/* Top Sunny Yellow Accent Bar */}
      <div style={{
        height: '4px',
        background: 'linear-gradient(90deg, #F59E0B, #FBBF24, #10B981, #059669)',
      }} />

      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        gap: '1rem',
      }}>
        {/* Logo + Name */}
        <a href="/" style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          textDecoration: 'none', color: '#0F172A', flexShrink: 0,
          transition: 'transform 0.2s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img
            src="/logo.png"
            alt="KrishiMitra Logo"
            style={{
              width: 46,
              height: 46,
              objectFit: 'contain',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
            }}
          />
          <div>
            <img
              src="/brand-name-transparent.png"
              alt="KrishiMitra"
              style={{ height: '34px', objectFit: 'contain', display: 'block' }}
            />
            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
              {t('appTagline')}
            </div>
          </div>
        </a>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>

          {/* Dashboard button */}
          {user && (
            <Link to={dashboardPath} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: '#ECFDF5', color: '#047857',
              border: '1.5px solid #A7F3D0', borderRadius: '10px',
              padding: '0.45rem 1rem', fontWeight: 800, fontSize: '0.88rem',
              textDecoration: 'none', transition: 'all 0.2s'
            }}>
              <LayoutDashboard size={16} />
              <span className="hide-mobile">{t('dashboard')}</span>
            </Link>
          )}

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: '#FEF3C7', color: '#B45309',
              border: '1.5px solid #FDE68A', borderRadius: '10px',
              padding: '0.45rem 0.85rem', fontWeight: 800, fontSize: '0.88rem',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
            }}
            title="Switch Language"
          >
            <Globe size={16} />
            <span>{isHindi ? 'EN' : 'हिं'}</span>
          </button>

          {/* Hamburger Menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: '#F8FAFC', color: '#334155',
              border: '1.5px solid #E2E8F0', borderRadius: '10px',
              padding: '0.45rem 0.65rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div style={{
          position: 'absolute',
          right: '1.5rem',
          top: '76px',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -10px rgba(15,23,42,0.15), 0 0 0 1px rgba(16,185,129,0.15)',
          minWidth: '240px',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}>
          {user && (
            <div style={{
              padding: '1.1rem 1.25rem',
              background: 'linear-gradient(135deg, #ECFDF5, #FEF3C7)',
              borderBottom: '1px solid #E2E8F0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: 38, height: 38,
                  background: 'linear-gradient(135deg, #059669, #10B981)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 900, fontSize: '1rem',
                }}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>{user.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                    {user.role === 'farmer' ? '🌾 Farmer' : '🏢 Procurement Centre'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: '0.4rem 0' }}>
            {user && (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.8rem 1.1rem', color: '#0F172A', textDecoration: 'none',
                    fontWeight: 700, fontSize: '0.93rem', transition: 'all 0.15s ease',
                    borderRadius: '8px', margin: '0 0.4rem',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#047857'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F172A'; }}
                >
                  <LayoutDashboard size={18} color="#059669" />
                  {t('dashboard')}
                </Link>
                <Link
                  to={user.role === 'farmer' ? '/farmer/profile' : '/centre/profile'}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.8rem 1.1rem', color: '#0F172A', textDecoration: 'none',
                    fontWeight: 700, fontSize: '0.93rem', transition: 'all 0.15s ease',
                    borderRadius: '8px', margin: '0 0.4rem',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#047857'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F172A'; }}
                >
                  <User size={18} color="#059669" />
                  {t('userProfile')}
                </Link>
              </>
            )}

            {!user && (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.8rem 1.1rem', color: '#0F172A', textDecoration: 'none',
                    fontWeight: 700, fontSize: '0.93rem', transition: 'all 0.15s ease',
                    borderRadius: '8px', margin: '0 0.4rem',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#047857'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F172A'; }}
                >
                  <User size={18} color="#059669" />
                  {t('loginBtn')}
                </Link>
                <Link
                  to="/register/farmer"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.8rem 1.1rem', color: '#0F172A', textDecoration: 'none',
                    fontWeight: 700, fontSize: '0.93rem', transition: 'all 0.15s ease',
                    borderRadius: '8px', margin: '0 0.4rem',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#047857'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F172A'; }}
                >
                  <img src="/logo.png" alt="Logo" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  {t('registerFarmer')}
                </Link>
                <Link
                  to="/register/centre"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.8rem 1.1rem', color: '#0F172A', textDecoration: 'none',
                    fontWeight: 700, fontSize: '0.93rem', transition: 'all 0.15s ease',
                    borderRadius: '8px', margin: '0 0.4rem',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#047857'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F172A'; }}
                >
                  <Building2 size={18} color="#059669" />
                  {t('registerCentre')}
                </Link>
              </>
            )}

            <div style={{ height: '1px', background: '#F1F5F9', margin: '0.3rem 0' }} />
            <button
              onClick={() => { toggleLanguage(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.8rem 1.1rem', color: '#0F172A', background: 'none', border: 'none',
                fontWeight: 700, fontSize: '0.93rem', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit', borderRadius: '8px', margin: '0 0.4rem', boxSizing: 'border-box'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FEF3C7'; e.currentTarget.style.color = '#B45309'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F172A'; }}
            >
              <Globe size={18} color="#D97706" />
              {isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
            </button>

            {user && (
              <>
                <div style={{ height: '1px', background: '#F1F5F9', margin: '0.3rem 0' }} />
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.8rem 1.1rem', color: '#DC2626', background: 'none', border: 'none',
                    fontWeight: 800, fontSize: '0.93rem', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'inherit', borderRadius: '8px', margin: '0 0.4rem', boxSizing: 'border-box'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogOut size={18} />
                  {t('logout')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <style>{`
        @media (max-width: 480px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </header>
  );
};

export default Header;
