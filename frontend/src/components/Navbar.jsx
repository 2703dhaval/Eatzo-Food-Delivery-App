import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useLocation as useGeoLocation } from '../context/LocationContext';
import LocationPicker from './LocationPicker';
import { api } from '../services/api';
import './Navbar.css';

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const { selectedAddress, setSelectedAddress } = useGeoLocation();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [showLocPicker, setShowLocPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = React.useRef(null);
  const PLACEHOLDER_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect fill="#222" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24">🍨</text></svg>'
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserDropdown(false);
  }, [location.pathname]);

  const handleCityChange = (newCity) => {
    setSelectedAddress(newCity);
  };

  const isActive = (path) => location.pathname === path;

  // Fetch suggestions when searchTerm changes (debounced)
  useEffect(() => {
    if (!searchTerm) {
      setSuggestions([]);
      return;
    }
    // debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.getRestaurants({ search: searchTerm });
        if (res.success) setSuggestions(res.data.slice(0, 6));
      } catch (e) {
        setSuggestions([]);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          {/* Logo */}
          <Link to="/" className="nav-logo">
            <span className="logo-emoji">🍕</span>
            <span className="logo-text">Eat<span className="logo-accent">zo</span></span>
          </Link>

          {/* Location button - clickable */}
          <button className="nav-location" onClick={() => setShowLocPicker(true)}>
            <span className="loc-pin">📍</span>
            <div className="loc-text">
              <span className="loc-label">Deliver to</span>
              <span className="loc-city">{selectedAddress.length > 14 ? selectedAddress.slice(0, 14) + '…' : selectedAddress} ▾</span>
            </div>
          </button>

          {/* Desktop: Search Bar */}
          <div className="nav-search" onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search for restaurants, food..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm) navigate(`/restaurants?search=${encodeURIComponent(searchTerm)}`);
              }}
            />
            {searchTerm && <button className="clear-btn" onClick={() => { setSearchTerm(''); setSuggestions([]); }}>✕</button>}

            {showSuggestions && suggestions.length > 0 && (
              <div className="nav-suggestions">
                {suggestions.map(s => (
                  <button key={s.id} className="suggestion-item" onMouseDown={() => navigate(`/restaurant/${s.id}`)}>
                    <div className="sugg-left">
                      <img src={s.image || PLACEHOLDER_SVG} alt={s.name} onError={e => e.target.src = PLACEHOLDER_SVG} />
                    </div>
                    <div className="sugg-mid">
                      <div className="sugg-name">{s.name}</div>
                      <div className="sugg-cuisine">{s.cuisine} · {s.deliveryTime}</div>
                    </div>
                  </button>
                ))}
                <div className="sugg-footer">
                  <button onMouseDown={() => navigate(`/restaurants?search=${encodeURIComponent(searchTerm)}`)}>See all results</button>
                </div>
              </div>
            )}
          </div>

          {/* Right Nav Links */}
          <div className={`nav-right ${menuOpen ? 'open' : ''}`}>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <span className="nav-link-icon">🏠</span>
              <span>Home</span>
            </Link>

            <Link to="/restaurants" className={`nav-link ${isActive('/restaurants') ? 'active' : ''}`}>
              <span className="nav-link-icon">🍽️</span>
              <span>Restaurants</span>
            </Link>

            <Link to="/favorites" className={`nav-link ${isActive('/favorites') ? 'active' : ''}`}>
              <span className="nav-link-icon">❤️</span>
              <span>Favourites</span>
              {favorites.length > 0 && <span className="nav-badge fav-badge">{favorites.length}</span>}
            </Link>

            <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
              <span className="nav-link-icon">📦</span>
              <span>Orders</span>
            </Link>

            <Link to="/cart" className={`nav-link cart-link ${isActive('/cart') ? 'active' : ''}`}>
              <span className="nav-link-icon">🛒</span>
              <span>Cart</span>
              {totalItems > 0 && <span className="nav-badge cart-badge">{totalItems}</span>}
            </Link>

            {/* User section */}
            {user ? (
              <div className="nav-user-wrap">
                <button className="nav-user-btn" onClick={() => setUserDropdown(!userDropdown)}>
                  <div className="user-avatar">{user.name[0].toUpperCase()}</div>
                  <span className="user-name-short">{user.name.split(' ')[0]}</span>
                  <span className="dropdown-arrow">▾</span>
                </button>
                {userDropdown && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">{user.name[0].toUpperCase()}</div>
                      <div>
                        <div className="dropdown-name">{user.name}</div>
                        <div className="dropdown-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item" onClick={() => { setShowLocPicker(true); setUserDropdown(false); }}>
                      📍 Change Location
                    </button>
                    <Link to="/orders" className="dropdown-item">📦 My Orders</Link>
                    <Link to="/favorites" className="dropdown-item">❤️ Saved Restaurants</Link>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item danger" onClick={handleLogout}>🚪 Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary nav-login-btn">
                Login / Sign Up
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* Location Picker Modal */}
      {showLocPicker && (
        <LocationPicker
          currentCity={selectedAddress}
          onCityChange={handleCityChange}
          onClose={() => setShowLocPicker(false)}
        />
      )}
    </>
  );
}
