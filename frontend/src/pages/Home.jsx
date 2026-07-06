import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurantCard from '../components/RestaurantCard';
import MapView from '../components/MapView';
import { api } from '../services/api';
import './Home.css';

const CATEGORIES = ['All', 'Indian', 'Pizza', 'Burgers', 'Chinese', 'Desserts'];

const CUISINES_SHOWCASE = [
  { name: 'Biryani', emoji: '🍛', color: '#FF6B35' },
  { name: 'Pizza', emoji: '🍕', color: '#E91E63' },
  { name: 'Burger', emoji: '🍔', color: '#FF9800' },
  { name: 'Sushi', emoji: '🍱', color: '#9C27B0' },
  { name: 'Pasta', emoji: '🍝', color: '#2196F3' },
  { name: 'Desserts', emoji: '🍰', color: '#4CAF50' },
  { name: 'Tacos', emoji: '🌮', color: '#F44336' },
  { name: 'Noodles', emoji: '🍜', color: '#795548' },
];

const PROMO_BANNERS = [
  { bg: 'linear-gradient(135deg,#FF6B35,#E91E63)', title: '50% OFF', sub: 'on first 3 orders', emoji: '🎉', code: 'FIRST50' },
  { bg: 'linear-gradient(135deg,#9C27B0,#3F51B5)', title: 'Free Delivery', sub: 'on orders above ₹299', emoji: '🚀', code: 'FREEDEL' },
  { bg: 'linear-gradient(135deg,#009688,#00BCD4)', title: '₹100 Cashback', sub: 'on UPI payments', emoji: '💰', code: 'UPICASH' },
];

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [topPicks, setTopPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [mapSelected, setMapSelected] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
    // auto-rotate banners
    const t = setInterval(() => setActiveBanner(a => (a + 1) % PROMO_BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [activeCategory]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = activeCategory !== 'All' ? { category: activeCategory } : {};
      const res = await api.getRestaurants(params);
      if (res.success) {
        setRestaurants(res.data);
        setTopPicks(res.data.filter(r => r.rating >= 4.5 && r.isOpen).slice(0, 4));
      }
    } catch { } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/restaurants?search=${search}`);
  };

  return (
    <div className="home page">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob blob1"></div>
          <div className="hero-blob blob2"></div>
          <div className="hero-blob blob3"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="badge-dot"></span> 500+ restaurants · Delivering now
            </div>
            <h1 className="hero-title">
              Craving something<br />
              <span className="hero-highlight">delicious? 🍽️</span>
            </h1>
            <p className="hero-subtitle">
              Order food from the best restaurants near you. Fast delivery, great deals, real-time tracking.
            </p>

            {/* Search */}
            <form className="hero-search" onSubmit={handleSearch}>
              <span className="search-loc">📍</span>
              <input
                type="text"
                placeholder="Search restaurants, cuisines, dishes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="btn btn-primary search-btn">
                🔍 Search
              </button>
            </form>

            {/* Quick Pills */}
            <div className="quick-pills">
              <span className="pills-label">Popular:</span>
              {['Biryani', 'Pizza', 'Burger', 'Momos', 'Rolls'].map(q => (
                <button key={q} className="quick-pill" onClick={() => navigate(`/restaurants?search=${q}`)}>
                  {q}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="hero-stats">
              <div className="stat"><strong>12+</strong><span>Restaurants</span></div>
              <div className="stat-div"></div>
              <div className="stat"><strong>30 min</strong><span>Avg Delivery</span></div>
              <div className="stat-div"></div>
              <div className="stat"><strong>4.8 ★</strong><span>App Rating</span></div>
              <div className="stat-div"></div>
              <div className="stat"><strong>100%</strong><span>Fresh Food</span></div>
            </div>
          </div>

          <div className="hero-image-area">
            <div className="hero-img-wrap">
              <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop" alt="Delicious Food" />
              <div className="floating-card card-a">🎉 Order Confirmed!</div>
              <div className="floating-card card-b">⚡ 25 min away</div>
              <div className="floating-card card-c">⭐ 4.9 Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Promo Banners ── */}
      <section className="section promo-section">
        <div className="container">
          <div className="promo-track">
            {PROMO_BANNERS.map((b, i) => (
              <div
                key={i}
                className={`promo-card ${i === activeBanner ? 'active' : ''}`}
                style={{ background: b.bg }}
                onClick={() => navigate('/restaurants')}
              >
                <div className="promo-emoji">{b.emoji}</div>
                <div className="promo-text">
                  <div className="promo-title">{b.title}</div>
                  <div className="promo-sub">{b.sub}</div>
                </div>
                <div className="promo-code">Use: {b.code}</div>
              </div>
            ))}
          </div>
          <div className="promo-dots">
            {PROMO_BANNERS.map((_, i) => (
              <button key={i} className={`pdot ${i === activeBanner ? 'active' : ''}`} onClick={() => setActiveBanner(i)}></button>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's on your mind ── */}
      <section className="section cuisine-section">
        <div className="container">
          <h2 className="section-title">What's on your mind?</h2>
          <p className="section-subtitle">Browse by cuisine type</p>
          <div className="cuisine-grid">
            {CUISINES_SHOWCASE.map(c => (
              <div key={c.name} className="cuisine-chip" onClick={() => navigate(`/restaurants?search=${c.name}`)}>
                <div className="cuisine-emoji-box" style={{ background: c.color + '18', border: `2px solid ${c.color}30` }}>
                  {c.emoji}
                </div>
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Picks ── */}
      {topPicks.length > 0 && (
        <section className="section top-picks-section">
          <div className="container">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">🔥 Top Picks for You</h2>
                <p className="section-subtitle">Highest rated restaurants right now</p>
              </div>
              <button className="see-all-btn" onClick={() => navigate('/restaurants')}>See All →</button>
            </div>
            <div className="top-picks-scroll">
              {topPicks.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── All Restaurants ── */}
      <section className="section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Restaurants Near You</h2>
              <p className="section-subtitle">{restaurants.length} restaurants available</p>
            </div>
            <div className="right-controls">
              <button className={`map-toggle-btn ${showMap ? 'active' : ''}`} onClick={() => setShowMap(!showMap)}>
                {showMap ? '📋 List View' : '🗺️ Map View'}
              </button>
              <div className="category-filters">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >{cat}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Map Section */}
          {showMap && (
            <div className="map-section">
              <MapView
                restaurants={restaurants}
                selectedId={mapSelected?.id}
                onSelectRestaurant={(r) => { setMapSelected(r); navigate(`/restaurant/${r.id}`); }}
              />
            </div>
          )}

          {loading ? (
            <div className="restaurants-grid">
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 300 }}></div>)}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '3rem' }}>🍽️</div>
              <h3>No restaurants found</h3>
            </div>
          ) : (
            <div className="restaurants-grid">
              {restaurants.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section how-it-works">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>How Eatzo Works</h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>Your food in 3 simple steps</p>
          <div className="steps-grid">
            {[
              { icon: '🔍', title: 'Browse Restaurants', desc: 'Explore hundreds of restaurants and cuisines near you with filters, ratings and offers.', color: '#FF6B35' },
              { icon: '🛒', title: 'Add to Cart', desc: 'Select your favourite dishes, customize as needed and add directly to your cart.', color: '#E91E63' },
              { icon: '🚀', title: 'Fast Delivery', desc: 'Track your order in real-time and get your food delivered hot & fresh to your door.', color: '#9C27B0' },
            ].map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-num" style={{ background: step.color }}>{i + 1}</div>
                <div className="step-icon-big">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── App Banner ── */}
      <section className="section app-banner-section">
        <div className="container">
          <div className="app-banner">
            <div className="app-banner-content">
              <h2>Get the Eatzo App 📱</h2>
              <p>Order faster, track in real-time, and get exclusive mobile-only offers!</p>
              <div className="app-badges">
                <div className="store-badge">🍎 App Store</div>
                <div className="store-badge">▶ Google Play</div>
              </div>
            </div>
            <div className="app-banner-visual">📱🍕🚀</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">🍕 <span>Eatzo</span></div>
              <p>India's favourite food delivery platform connecting customers with the best local restaurants.</p>
            </div>
            <div className="footer-links-col">
              <h4>Company</h4>
              <a href="#">About Us</a><a href="#">Careers</a><a href="#">Blog</a>
            </div>
            <div className="footer-links-col">
              <h4>For Restaurants</h4>
              <a href="#">Partner with Us</a><a href="#">Advertise</a>
            </div>
            <div className="footer-links-col">
              <h4>Help</h4>
              <a href="#">FAQ</a><a href="#">Contact Us</a><a href="#">Privacy Policy</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 Eatzo Technologies Pvt. Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
