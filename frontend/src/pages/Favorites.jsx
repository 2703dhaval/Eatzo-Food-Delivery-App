import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import RestaurantCard from '../components/RestaurantCard';
import './Favorites.css';

export default function Favorites() {
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  return (
    <div className="page favorites-page">
      <div className="container">
        {/* Header */}
        <div className="fav-header">
          <div>
            <h1 className="section-title">❤️ Your Favourites</h1>
            <p className="section-subtitle">
              {favorites.length > 0
                ? `${favorites.length} restaurant${favorites.length > 1 ? 's' : ''} saved`
                : 'Restaurants you love, all in one place'}
            </p>
          </div>
          {favorites.length > 0 && (
            <button className="btn btn-outline" onClick={() => navigate('/restaurants')}>
              Explore More
            </button>
          )}
        </div>

        {/* Empty state */}
        {favorites.length === 0 ? (
          <div className="fav-empty">
            <div className="fav-empty-icon">💔</div>
            <h2>No favourites yet!</h2>
            <p>Tap the ❤️ on any restaurant card to save it here for quick access.</p>
            <div className="fav-empty-features">
              <div className="fav-feature">
                <span>🔍</span>
                <p>Browse restaurants</p>
              </div>
              <div className="fav-feature-arrow">→</div>
              <div className="fav-feature">
                <span>🤍</span>
                <p>Tap the heart</p>
              </div>
              <div className="fav-feature-arrow">→</div>
              <div className="fav-feature">
                <span>❤️</span>
                <p>Find it here</p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/restaurants')}>
              Explore Restaurants
            </button>
          </div>
        ) : (
          <>
            {/* Inline promo */}
            <div className="fav-promo">
              <span>🎉</span>
              <div>
                <strong>Exclusive offer for you!</strong>
                <p>Order from your favourite restaurants and save 10% extra with code <span className="code-chip">FAV10</span></p>
              </div>
            </div>

            {/* Restaurant Grid */}
            <div className="restaurants-grid">
              {favorites.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
