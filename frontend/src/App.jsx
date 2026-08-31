import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Chatbot from './components/Chatbot';

// Public pages
import LandingPage from './pages/public/LandingPage';
import NearestCentres from './pages/public/NearestCentres';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterSelection from './pages/auth/RegisterSelection';
import FarmerRegister from './pages/auth/FarmerRegister';
import CentreRegister from './pages/auth/CentreRegister';

// Farmer pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import BookSlot from './pages/farmer/BookSlot';
import TrackSlot from './pages/farmer/TrackSlot';
import TatkaalBooking from './pages/farmer/TatkaalBooking';
import MandiRates from './pages/farmer/MandiRates';
import PaymentHistory from './pages/farmer/PaymentHistory';
import TrustScore from './pages/farmer/TrustScore';
import FarmerProfile from './pages/farmer/FarmerProfile';

// Centre pages
import CentreDashboard from './pages/centre/CentreDashboard';
import CentreCapacity from './pages/centre/CentreCapacity';
import CentreLiveQueue from './pages/centre/CentreLiveQueue';
import CentrePayments from './pages/centre/CentrePayments';
import CentreTatkaal from './pages/centre/CentreTatkaal';
import CentreProfile from './pages/centre/CentreProfile';

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
      </main>
      <Chatbot />
    </BrowserRouter>
  );
};

export default App;
