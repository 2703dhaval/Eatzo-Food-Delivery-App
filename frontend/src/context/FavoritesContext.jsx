import React, { createContext, useContext, useState } from 'react';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('eatzo_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const toggleFavorite = (restaurant) => {
    setFavorites(prev => {
      const exists = prev.find(r => r.id === restaurant.id);
      const updated = exists
        ? prev.filter(r => r.id !== restaurant.id)
        : [...prev, restaurant];
      localStorage.setItem('eatzo_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (id) => favorites.some(r => r.id === id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
