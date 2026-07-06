import React, { createContext, useContext, useState } from 'react';

const SuperAdminContext = createContext();

// Hardcoded super-admin credentials (demo)
const SUPER_ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

export function SuperAdminProvider({ children }) {
  const [superAdmin, setSuperAdmin] = useState(() => {
    const saved = localStorage.getItem('eatzo_superadmin');
    return saved ? JSON.parse(saved) : null;
  });

  const superAdminLogin = (username, password) => {
    if (
      username === SUPER_ADMIN_CREDENTIALS.username &&
      password === SUPER_ADMIN_CREDENTIALS.password
    ) {
      const admin = { username, name: 'Super Admin', role: 'superadmin' };
      setSuperAdmin(admin);
      localStorage.setItem('eatzo_superadmin', JSON.stringify(admin));
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials' };
  };

  const superAdminLogout = () => {
    setSuperAdmin(null);
    localStorage.removeItem('eatzo_superadmin');
  };

  return (
    <SuperAdminContext.Provider value={{ superAdmin, superAdminLogin, superAdminLogout }}>
      {children}
    </SuperAdminContext.Provider>
  );
}

export const useSuperAdmin = () => useContext(SuperAdminContext);
