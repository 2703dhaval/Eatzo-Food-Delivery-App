import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('eatzo_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData) => {
    const u = { id: 'user1', name: userData.name || 'Guest User', email: userData.email };
    setUser(u);
    localStorage.setItem('eatzo_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eatzo_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
