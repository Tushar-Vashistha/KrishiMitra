import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Chatbot from './components/Chatbot';

// Public pages (lazy loaded for optimal bundle splitting)
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const NearestCentres = lazy(() => import('./pages/public/NearestCentres'));

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterSelection = lazy(() => import('./pages/auth/RegisterSelection'));
const FarmerRegister = lazy(() => import('./pages/auth/FarmerRegister'));
const CentreRegister = lazy(() => import('./pages/auth/CentreRegister'));

// Farmer pages
const FarmerDashboard = lazy(() => import('./pages/farmer/FarmerDashboard'));
const BookSlot = lazy(() => import('./pages/farmer/BookSlot'));
const TrackSlot = lazy(() => import('./pages/farmer/TrackSlot'));
const TatkaalBooking = lazy(() => import('./pages/farmer/TatkaalBooking'));
const MandiRates = lazy(() => import('./pages/farmer/MandiRates'));
const PaymentHistory = lazy(() => import('./pages/farmer/PaymentHistory'));
const TrustScore = lazy(() => import('./pages/farmer/TrustScore'));
const FarmerProfile = lazy(() => import('./pages/farmer/FarmerProfile'));

// Centre pages
const CentreDashboard = lazy(() => import('./pages/centre/CentreDashboard'));
const CentreCapacity = lazy(() => import('./pages/centre/CentreCapacity'));
const CentreLiveQueue = lazy(() => import('./pages/centre/CentreLiveQueue'));
const CentrePayments = lazy(() => import('./pages/centre/CentrePayments'));
const CentreTatkaal = lazy(() => import('./pages/centre/CentreTatkaal'));
const CentreProfile = lazy(() => import('./pages/centre/CentreProfile'));

// Fast lightweight page fallback spinner
const PageLoader = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    color: '#059669'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #E2E8F0',
      borderTopColor: '#059669',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>Loading...</span>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Protected route components
const FarmerRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'farmer') return <Navigate to="/centre/dashboard" replace />;
  return children;
};

const CentreRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'centre') return <Navigate to="/farmer/dashboard" replace />;
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/nearest-centres" element={<NearestCentres />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterSelection />} />
            <Route path="/register/farmer" element={<FarmerRegister />} />
            <Route path="/register/centre" element={<CentreRegister />} />

            {/* Farmer (protected) */}
            <Route path="/farmer/dashboard" element={<FarmerRoute><FarmerDashboard /></FarmerRoute>} />
            <Route path="/farmer/book-slot" element={<FarmerRoute><BookSlot /></FarmerRoute>} />
            <Route path="/farmer/track-slot" element={<FarmerRoute><TrackSlot /></FarmerRoute>} />
            <Route path="/farmer/tatkaal" element={<FarmerRoute><TatkaalBooking /></FarmerRoute>} />
            <Route path="/farmer/mandi-rates" element={<FarmerRoute><MandiRates /></FarmerRoute>} />
            <Route path="/farmer/payment-history" element={<FarmerRoute><PaymentHistory /></FarmerRoute>} />
            <Route path="/farmer/trust-score" element={<FarmerRoute><TrustScore /></FarmerRoute>} />
            <Route path="/farmer/profile" element={<FarmerRoute><FarmerProfile /></FarmerRoute>} />

            {/* Centre (protected) */}
            <Route path="/centre/dashboard" element={<CentreRoute><CentreDashboard /></CentreRoute>} />
            <Route path="/centre/capacity" element={<CentreRoute><CentreCapacity /></CentreRoute>} />
            <Route path="/centre/live-queue" element={<CentreRoute><CentreLiveQueue /></CentreRoute>} />
            <Route path="/centre/payments" element={<CentreRoute><CentrePayments /></CentreRoute>} />
            <Route path="/centre/tatkaal" element={<CentreRoute><CentreTatkaal /></CentreRoute>} />
            <Route path="/centre/profile" element={<CentreRoute><CentreProfile /></CentreRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Chatbot />
    </BrowserRouter>
  );
};

export default App;
