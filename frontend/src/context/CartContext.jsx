import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);

  const addToCart = (item, restaurant) => {
    // If adding from a different restaurant, clear cart first
    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      const ok = window.confirm(
        `Your cart has items from ${cartRestaurant.name}. Clear cart and add from ${restaurant.name}?`
      );
      if (!ok) return;
      setCartItems([]);
    }

    setCartRestaurant(restaurant);
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.qty > 1) {
        return prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i);
      }
      const updated = prev.filter(i => i.id !== itemId);
      if (updated.length === 0) setCartRestaurant(null);
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setCartRestaurant(null);
  };

  const getItemQty = (itemId) => {
    const item = cartItems.find(i => i.id === itemId);
    return item ? item.qty : 0;
  };

  const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryFee = cartRestaurant?.deliveryFee || 0;
  const total = subtotal + deliveryFee;

  return (
    <CartContext.Provider value={{
      cartItems, cartRestaurant,
      addToCart, removeFromCart, clearCart, getItemQty,
      totalItems, subtotal, deliveryFee, total
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
