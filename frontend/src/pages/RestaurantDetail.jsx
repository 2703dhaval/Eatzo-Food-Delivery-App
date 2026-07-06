import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { api } from '../services/api';
import './RestaurantDetail.css';

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, removeFromCart, getItemQty, totalItems, cartRestaurant } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
    window.scrollTo(0, 0);
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, menuData] = await Promise.all([
        api.getRestaurant(id),
        api.getMenu(id),
      ]);
      if (resData.success) setRestaurant(resData.data);
      if (menuData.success) setMenu(menuData.data);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(menu.map(item => item.category))];
  const filteredMenu = menu.filter(item => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const favorited = restaurant ? isFavorite(restaurant.id) : false;

  if (loading) return (
    <div className="page rd-loading">
      <div className="container">
        <div className="skeleton" style={{ height: 320, marginBottom: 24 }}></div>
        <div className="skeleton" style={{ height: 48, width: 320, marginBottom: 16 }}></div>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 130, marginBottom: 14 }}></div>)}
      </div>
    </div>
  );

  if (!restaurant) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>😕</div>
        <h2 style={{ marginBottom: 16 }}>Restaurant not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    </div>
  );

  return (
    <div className="page">
      {/* Cover */}
      <div className="rd-cover">
        <img src={restaurant.image || '/assets/kulfi.svg'} alt={restaurant.name} onError={e => { e.target.onerror = null; e.target.src = '/assets/kulfi.svg'; }} />
        <div className="rd-cover-overlay"></div>
        <div className="rd-cover-info container">
          <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
          <div className="rd-info-card">
            <div className="rd-info-top">
              <h1 className="rd-name">{restaurant.name}</h1>
              <div className="rd-actions">
                {!restaurant.isOpen && <span className="closed-badge">Closed</span>}
                <button
                  className={`fav-btn-detail ${favorited ? 'active' : ''}`}
                  onClick={() => toggleFavorite(restaurant)}
                  title={favorited ? 'Remove from favourites' : 'Save to favourites'}
                >
                  {favorited ? '❤️ Saved' : '🤍 Save'}
                </button>
              </div>
            </div>
            <p className="rd-cuisine">{restaurant.cuisine}</p>
            <p className="rd-address">📍 {restaurant.address}</p>
            <div className="rd-meta">
              <div className="rd-meta-item">
                <span className="rd-meta-val green">⭐ {restaurant.rating}</span>
                <span className="rd-meta-label">{restaurant.totalRatings?.toLocaleString()} ratings</span>
              </div>
              <div className="rd-meta-divider"></div>
              <div className="rd-meta-item">
                <span className="rd-meta-val">🕐 {restaurant.deliveryTime}</span>
                <span className="rd-meta-label">Delivery Time</span>
              </div>
              <div className="rd-meta-divider"></div>
              <div className="rd-meta-item">
                <span className="rd-meta-val">₹{restaurant.deliveryFee}</span>
                <span className="rd-meta-label">Delivery Fee</span>
              </div>
              <div className="rd-meta-divider"></div>
              <div className="rd-meta-item">
                <span className="rd-meta-val">₹{restaurant.minOrder}</span>
                <span className="rd-meta-label">Min Order</span>
              </div>
              {restaurant.priceForTwo && (
                <>
                  <div className="rd-meta-divider"></div>
                  <div className="rd-meta-item">
                    <span className="rd-meta-val">₹{restaurant.priceForTwo}</span>
                    <span className="rd-meta-label">For Two</span>
                  </div>
                </>
              )}
            </div>
            {restaurant.discount && <div className="rd-discount">🎉 {restaurant.discount}</div>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="rd-body container">
        {/* Menu Search */}
        <div className="menu-search-row">
          <div className="menu-search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search in menu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')}>✕</button>}
          </div>
          <div className="rd-cat-tabs">
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Count */}
        <p className="menu-count">{filteredMenu.length} item{filteredMenu.length !== 1 ? 's' : ''} found</p>

        {/* Menu Items */}
        <div className="menu-grid">
          {filteredMenu.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              No items match your search
            </div>
          ) : filteredMenu.map(item => {
            const qty = getItemQty(item.id);
            return (
              <div key={item.id} className="menu-card">
                <div className="menu-card-info">
                  <div className="menu-card-top">
                    <div className={item.isVeg ? 'badge-veg' : 'badge-nonveg'}></div>
                    {item.isBestseller && <span className="bestseller-tag">🏆 Bestseller</span>}
                    {item.rating && <span className="menu-rating">⭐ {item.rating}</span>}
                  </div>
                  <h3 className="menu-name">{item.name}</h3>
                  <p className="menu-price">₹{item.price}</p>
                  <p className="menu-desc">{item.description}</p>
                </div>
                <div className="menu-card-right">
                  <img
                    src={item.image}
                    alt={item.name}
                    onError={e => e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop'}
                  />
                  {restaurant.isOpen ? (
                    qty === 0 ? (
                      <button className="add-btn" onClick={() => addToCart(item, restaurant)}>+ ADD</button>
                    ) : (
                      <div className="qty-control">
                        <button onClick={() => removeFromCart(item.id)}>−</button>
                        <span>{qty}</span>
                        <button onClick={() => addToCart(item, restaurant)}>+</button>
                      </div>
                    )
                  ) : (
                    <button className="add-btn" disabled>Closed</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Bar */}
      {totalItems > 0 && cartRestaurant?.id === id && (
        <div className="cart-bar" onClick={() => navigate('/cart')}>
          <div className="cart-bar-left">
            <span className="cart-bar-count">{totalItems}</span>
            <span>item{totalItems > 1 ? 's' : ''} added</span>
          </div>
          <span className="cart-bar-cta">View Cart & Checkout →</span>
        </div>
      )}
    </div>
  );
}
