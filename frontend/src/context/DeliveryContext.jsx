import React, { createContext, useContext, useState, useEffect } from 'react';

const DeliveryContext = createContext();

const API_URL = 'http://localhost:5000/api';

export function DeliveryProvider({ children }) {
  const [deliveryAgent, setDeliveryAgent] = useState(() => {
    const saved = localStorage.getItem('eatzo_delivery');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (deliveryAgent) {
      localStorage.setItem('eatzo_delivery', JSON.stringify(deliveryAgent));
    } else {
      localStorage.removeItem('eatzo_delivery');
    }
  }, [deliveryAgent]);

  const deliveryLogin = async (id, password) => {
    try {
      const res = await fetch(`${API_URL}/delivery/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      });
      const data = await res.json();
      if (data.success) {
        setDeliveryAgent(data.data);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: 'Server error' };
    }
  };

  const deliveryLogout = () => {
    setDeliveryAgent(null);
  };

  const updateStatus = async (isOnline) => {
    if (!deliveryAgent) return;
    try {
      const res = await fetch(`${API_URL}/delivery/${deliveryAgent.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline })
      });
      const data = await res.json();
      if (data.success) {
        setDeliveryAgent(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DeliveryContext.Provider value={{ deliveryAgent, deliveryLogin, deliveryLogout, updateStatus }}>
      {children}
    </DeliveryContext.Provider>
  );
}

export const useDelivery = () => useContext(DeliveryContext);
