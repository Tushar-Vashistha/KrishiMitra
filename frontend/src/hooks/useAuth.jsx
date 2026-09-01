import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('krishimitra_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Listen for external auth changes (like 401 unauth resets)
  useEffect(() => {
    const handleAuthChange = () => {
      const savedUser = localStorage.getItem('krishimitra_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    window.addEventListener('krishimitra_auth_change', handleAuthChange);
    return () => window.removeEventListener('krishimitra_auth_change', handleAuthChange);
  }, []);

  const login = (role, authData) => {
    let newUser;
    if (authData && authData.accessToken) {
      // Real backend authentication data payload
      const mappedRole = authData.user.role === 'FARMER' ? 'farmer' : 'centre';
      const profile = authData.user.profile || {};
      
      // Extract details based on backend structure
      newUser = {
        role: mappedRole,
        backendRole: authData.user.role,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        id: authData.user.id,
        mobile: authData.user.mobile,
        // Profile fields
        name: profile.name || '',
        dob: profile.dob || '',
        gender: profile.gender || '',
        aadhaar: profile.aadhaarMasked || '',
        farmerId: profile.aadhaarMasked || profile.centreId || '',
        centreId: profile.centreId || '',
        village: profile.village || '',
        tehsil: profile.tehsil || '',
        district: profile.district || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        khasraNumber: profile.khasraNumber || '',
        landOwnerName: profile.landOwnerName || '',
        bankName: profile.bankName || '',
        accountNumber: profile.accountNumberMasked || '',
        ifscCode: profile.ifscCode || '',
        trustScore: profile.trustScore || 100,
        status: profile.status || '',
      };

      // Handle staff center assignments mapping
      if (authData.user.role !== 'FARMER' && profile.assignments && profile.assignments.length > 0) {
        const activeAssignment = profile.assignments.find(a => a.active) || profile.assignments[0];
        if (activeAssignment && activeAssignment.centre) {
          newUser.centreId = activeAssignment.centre.id; // numerical db ID
          newUser.centreCode = activeAssignment.centre.centreId; // e.g. UP-LKO-001
          newUser.centreName = activeAssignment.centre.name;
          newUser.centreNameHi = activeAssignment.centre.nameHi;
        }
      }
    } else {
      // Fallback/Legacy direct mock data login
      newUser = { role, ...authData };
    }

    setUser(newUser);
    localStorage.setItem('krishimitra_user', JSON.stringify(newUser));
  };

  const updateUser = (updatedData) => {
    setUser(prev => {
      const updated = { ...(prev || {}), ...updatedData };
      localStorage.setItem('krishimitra_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout API call failed:', e);
    }
    setUser(null);
    localStorage.removeItem('krishimitra_user');
    window.dispatchEvent(new Event('krishimitra_auth_change'));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

