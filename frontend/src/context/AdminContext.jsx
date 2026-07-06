import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('eatzo_admin');
    return saved ? JSON.parse(saved) : null;
  });

  const [restaurantData, setRestaurantData] = useState(null);

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem('eatzo_admin', JSON.stringify(adminUser));
      fetchRestaurantData(adminUser.id);
    } else {
      localStorage.removeItem('eatzo_admin');
      setRestaurantData(null);
    }
  }, [adminUser]);

  const fetchRestaurantData = async (id) => {
    try {
      const res = await api.getRestaurant(id);
      if (res.success) setRestaurantData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const adminLogin = async (restaurantId) => {
    const res = await api.getRestaurant(restaurantId);
    if (res.success) {
      setAdminUser({ id: restaurantId, name: res.data.name + ' Admin' });
      setRestaurantData(res.data);
      return { success: true };
    }
    return { success: false, message: 'Invalid Restaurant ID' };
  };

  const adminLogout = () => {
    setAdminUser(null);
  };

  return (
    <AdminContext.Provider value={{ adminUser, restaurantData, setRestaurantData, adminLogin, adminLogout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
