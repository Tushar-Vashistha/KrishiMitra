import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import {
  Menu, X, LayoutDashboard, User, Settings, LogOut,
  Globe, Building2, Layers, Users, CreditCard, Zap,
  Bell, Check, CheckCheck, Trash2, ChevronRight, Clock,
  Sparkles, AlertTriangle, FileText, CheckCircle2, UserCheck,
  XCircle, Activity
} from 'lucide-react';
import {
  getFarmerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications
} from '../data/notifications';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(getFarmerNotifications);

  const isHindi = i18n.language === 'hi';
  const isAuthPage = ['/login', '/register/farmer', '/register/centre'].includes(location.pathname);
  const showNavItems = user && !isAuthPage;

  // Sync notifications on custom and storage events
  useEffect(() => {
    const updateNotifs = () => {
      setNotifications(getFarmerNotifications());
    };
    window.addEventListener('storage', updateNotifs);
    window.addEventListener('krishimitra_notification_update', updateNotifs);
    return () => {
      window.removeEventListener('storage', updateNotifs);
      window.removeEventListener('krishimitra_notification_update', updateNotifs);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

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
    setNotifOpen(false);
    navigate('/');
  };

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id);
    setNotifOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
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
        <Link to={user ? dashboardPath : "/"} style={{
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
        </Link>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', position: 'relative' }}>

          {/* Notification Bell Button (ONLY shown when farmer is logged in) */}
          {showNavItems && user.role === 'farmer' && (
            <div style={{ position: 'relative' }}>
              <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setMenuOpen(false);
              }}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: unreadCount > 0 ? '#ECFDF5' : '#F8FAFC',
                color: unreadCount > 0 ? '#047857' : '#475569',
                border: unreadCount > 0 ? '1.5px solid #86EFAC' : '1.5px solid #E2E8F0',
                borderRadius: '10px',
                padding: '0.45rem 0.65rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title={isHindi ? `सूचनाएं (${unreadCount} नई)` : `Procurement Notifications (${unreadCount} new)`}
              aria-label="Notifications"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                  animation: 'pulse 1.8s infinite'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {notifOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '50px',
                width: '360px',
                maxWidth: '90vw',
                background: '#FFFFFF',
                borderRadius: '20px',
                boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(16, 185, 129, 0.15)',
                zIndex: 1001,
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                {/* Popover Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
                  color: '#FFFFFF',
                  padding: '1rem 1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={17} color="#A7F3D0" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900 }}>
                        {isHindi ? 'खरीद केंद्र अपडेट' : 'Procurement Updates'}
                      </h4>
                      <span style={{ fontSize: '0.7rem', color: '#A7F3D0' }}>
                        {unreadCount} {isHindi ? 'नई सूचनाएं' : 'unread notifications'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: 'none',
                          color: '#FFFFFF',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title={isHindi ? "सभी पढ़े हुए मार्क करें" : "Mark all as read"}
                      >
                        <CheckCheck size={13} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                        {isHindi ? 'पढ़ा' : 'Read all'}
                      </button>
                    )}
                    <button
                      onClick={() => setNotifOpen(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.5rem 0' }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748B' }}>
                      <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B' }}>
                        {isHindi ? 'कोई नई सूचना नहीं है' : 'All caught up!'}
                      </div>
                      <p style={{ fontSize: '0.78rem', margin: '0.2rem 0 0', opacity: 0.8 }}>
                        {isHindi ? 'केंद्र द्वारा कोई भी नया अपडेट यहाँ दिखाई देगा' : 'Centre updates will appear here in real-time'}
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isUnread = !notif.read;
                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          style={{
                            padding: '0.85rem 1.1rem',
                            borderBottom: '1px solid #F1F5F9',
                            background: isUnread ? '#F0FDF4' : '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'flex-start'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#ECFDF5'}
                          onMouseLeave={e => e.currentTarget.style.background = isUnread ? '#F0FDF4' : '#FFFFFF'}
                        >
                          {/* Type Icon Badge */}
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '10px',
                            background: notif.type === 'bill' ? '#DCFCE7' : notif.type === 'arrived' ? '#E0F2FE' : notif.type === 'processing' ? '#FEF3C7' : notif.type === 'cancelled' ? '#FEE2E2' : '#F1F5F9',
                            color: notif.type === 'bill' ? '#15803D' : notif.type === 'arrived' ? '#0369A1' : notif.type === 'processing' ? '#B45309' : notif.type === 'cancelled' ? '#DC2626' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}>
                            {notif.type === 'bill' ? <FileText size={16} /> : notif.type === 'arrived' ? <UserCheck size={16} /> : notif.type === 'processing' ? <Activity size={16} /> : notif.type === 'cancelled' ? <XCircle size={16} /> : <Bell size={16} />}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>
                                {isHindi ? (notif.title || notif.titleEn) : (notif.titleEn || notif.title)}
                              </span>
                              {isUnread && (
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
                              )}
                            </div>

                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.35 }}>
                              {isHindi ? (notif.message || notif.messageEn) : (notif.messageEn || notif.message)}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.7rem', color: '#94A3B8' }}>
                              <span>🏛️ {notif.centreName || "Govt. Centre"}</span>
                              <span>⏱️ {notif.time || "Recently"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Popover Footer */}
                {notifications.length > 0 && (
                  <div style={{
                    padding: '0.65rem 1rem',
                    background: '#F8FAFC',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <button
                      onClick={clearAllNotifications}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Trash2 size={12} /> {isHindi ? 'सभी साफ़ करें' : 'Clear all'}
                    </button>

                    <Link
                      to="/farmer/track-slot"
                      onClick={() => setNotifOpen(false)}
                      style={{
                        color: '#047857',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      <span>{isHindi ? 'लाइव स्लॉट ट्रैक करें' : 'Track Live Slot'}</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Dashboard button */}
          {showNavItems && (
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
            onClick={() => {
              setMenuOpen(!menuOpen);
              setNotifOpen(false);
            }}
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

      {/* Backdrop for notifications or menu */}
      {(menuOpen || notifOpen) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          onClick={() => {
            setMenuOpen(false);
            setNotifOpen(false);
          }}
        />
      )}

      {/* Dropdown Menu */}
      {menuOpen && (
        <div style={{
          position: 'absolute',
          right: '1.5rem',
          top: '76px',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -10px rgba(15,23,42,0.15), 0 0 0 1px rgba(16,185,129,0.15)',
          minWidth: '260px',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}>
          {showNavItems && (
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
                  {isHindi ? (user.nameHi?.[0] || (user.name === 'Ramesh Kumar' ? 'र' : user.name?.[0]?.toUpperCase() || 'U')) : (user.name?.[0]?.toUpperCase() || 'U')}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                    {isHindi ? (user.nameHi || (user.name === 'Ramesh Kumar' ? 'रमेश कुमार' : user.name)) : user.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                    {user.role === 'farmer' ? (isHindi ? '🌾 किसान' : '🌾 Farmer') : (isHindi ? '🏢 खरीद केंद्र' : '🏢 Procurement Centre')}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: '0.4rem 0' }}>
            {showNavItems && (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1.1rem', color: '#0F172A', textDecoration: 'none',
                    fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s ease',
                    borderRadius: '8px', margin: '0 0.4rem',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#047857'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F172A'; }}
                >
                  <LayoutDashboard size={18} color="#059669" />
                  {t('dashboard')}
                </Link>

                {/* 4 Dedicated Centre Pages if Centre user */}
                {user.role === 'centre' && (
                  <>
                    <div style={{ height: '1px', background: '#F1F5F9', margin: '0.3rem 0' }} />
                    <Link
                      to="/centre/capacity"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1.1rem', color: '#0F172A', textDecoration: 'none',
                        fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s ease',
                        borderRadius: '8px', margin: '0 0.4rem',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#047857'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F172A'; }}
                    >
                      <Layers size={18} color="#059669" />
                      {isHindi ? '1. केंद्र क्षमता' : '1. Centre Capacity'}
                    </Link>

                    <Link
                      to="/centre/live-queue"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1.1rem', color: '#0F172A', textDecoration: 'none',
                        fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s ease',
                        borderRadius: '8px', margin: '0 0.4rem',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#1D4ED8'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F172A'; }}
                    >
                      <Users size={18} color="#0284C7" />
                      {isHindi ? '2. लाइव कतार' : '2. Live Queue'}
                    </Link>

                    <Link
                      to="/centre/payments"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1.1rem', color: '#0F172A', textDecoration: 'none',
                        fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s ease',
                        borderRadius: '8px', margin: '0 0.4rem',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F0FDFA'; e.currentTarget.style.color = '#0F766E'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F172A'; }}
                    >
                      <CreditCard size={18} color="#0D9488" />
                      {isHindi ? '3. भुगतान व बिलिंग' : '3. Payments & Billing'}
                    </Link>

                    <Link
                      to="/centre/tatkaal"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1.1rem', color: '#0F172A', textDecoration: 'none',
                        fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s ease',
                        borderRadius: '8px', margin: '0 0.4rem',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FFFBEB'; e.currentTarget.style.color = '#B45309'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F172A'; }}
                    >
                      <Zap size={18} color="#D97706" />
                      {isHindi ? '4. तत्काल स्लॉट' : '4. Tatkal Slot'}
                    </Link>
                    <div style={{ height: '1px', background: '#F1F5F9', margin: '0.3rem 0' }} />
                  </>
                )}

                <Link
                  to={user.role === 'farmer' ? '/farmer/profile' : '/centre/profile'}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1.1rem', color: '#0F172A', textDecoration: 'none',
                    fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s ease',
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

            {showNavItems && (
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
