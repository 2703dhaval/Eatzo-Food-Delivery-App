import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import RestaurantCard from '../components/RestaurantCard';
import { api } from '../services/api';
import './Restaurants.css';

const CATEGORIES = ['All', 'Indian', 'Pizza', 'Burgers', 'Chinese'];
const SORT_OPTIONS = [
  { value: 'rating', label: '⭐ Top Rated' },
  { value: 'delivery', label: '⚡ Fastest Delivery' },
  { value: 'minOrder', label: '💰 Low Min Order' },
];

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [vegOnly, setVegOnly] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearch(q);
    loadRestaurants();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [restaurants, search, activeCategory, sortBy, vegOnly]);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const res = await api.getRestaurants();
      if (res.success) setRestaurants(res.data);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let list = [...restaurants];
    if (search) {
      list = list.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (activeCategory !== 'All') {
      list = list.filter(r => r.category === activeCategory);
    }
    // Sort
    if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'delivery') list.sort((a, b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime));
    if (sortBy === 'minOrder') list.sort((a, b) => a.minOrder - b.minOrder);
    setFiltered(list);
  };

  return (
    <div className="restaurants-page page">
      <div className="container">
        {/* Header */}
        <div className="rp-header">
          <h1 className="section-title">All Restaurants</h1>
          <p className="section-subtitle">{filtered.length} restaurants near you</p>

          {/* Search */}
          <div className="rp-search-bar">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search restaurants or cuisines..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')}>✕</button>}
          </div>

          {/* Filters Row */}
          <div className="rp-filters">
            <div className="filters-left">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="filters-right">
              <label className="veg-toggle">
                <div className="veg-dot"></div>
                <input type="checkbox" checked={vegOnly} onChange={e => setVegOnly(e.target.checked)} />
                Pure Veg
              </label>
              <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="restaurants-grid">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 300 }}></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <h3>No restaurants found</h3>
            <p>Try a different search or category</p>
          </div>
        ) : (
          <div className="restaurants-grid">
            {filtered.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
