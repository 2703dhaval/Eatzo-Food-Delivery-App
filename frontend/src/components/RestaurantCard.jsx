import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import './RestaurantCard.css';

export default function RestaurantCard({ restaurant }) {
  const { id, name, cuisine, rating, totalRatings, deliveryTime, minOrder, deliveryFee, image, isOpen, discount, priceForTwo, tags } = restaurant;
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(id);

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(restaurant);
  };

  return (
    <Link to={`/restaurant/${id}`} className={`restaurant-card ${!isOpen ? 'closed' : ''}`}>
      {/* Image */}
      <div className="card-image-wrap">
        <img src={image || '/assets/kulfi.svg'} alt={name} className="card-image"
          onError={(e) => { e.target.onerror = null; e.target.src = '/assets/kulfi.svg'; }} />
        {!isOpen && <div className="card-closed-overlay"><span>Currently Closed</span></div>}
        {discount && <div className="card-discount">{discount}</div>}
        <button className={`fav-btn ${favorited ? 'active' : ''}`} onClick={handleFav} title={favorited ? 'Remove from favorites' : 'Add to favorites'}>
          {favorited ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Info */}
      <div className="card-body">
        <div className="card-header">
          <h3 className="card-name">{name}</h3>
          <div className="card-rating-box">
            <span className="star">★</span>
            <span className="rating-val">{rating}</span>
            {totalRatings && <span className="rating-count">({(totalRatings / 1000).toFixed(1)}k)</span>}
          </div>
        </div>
        <p className="card-cuisine">{cuisine}</p>
        {tags && (
          <div className="card-tags">
            {tags.slice(0, 3).map(t => <span key={t} className="card-tag">{t}</span>)}
          </div>
        )}
        <div className="card-divider"></div>
        <div className="card-footer">
          <span className="card-meta">🕐 {deliveryTime}</span>
          <span className="card-dot">·</span>
          <span className="card-meta">₹{deliveryFee} delivery</span>
          {priceForTwo && <>
            <span className="card-dot">·</span>
            <span className="card-meta">₹{priceForTwo} for 2</span>
          </>}
        </div>
      </div>
    </Link>
  );
}
