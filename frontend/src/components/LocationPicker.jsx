import React, { useState, useEffect, useRef } from 'react';
import './LocationPicker.css';

const POPULAR_CITIES = [
  { name: 'New Delhi', state: 'Delhi', emoji: '🏛️', type: 'city' },
  { name: 'Mumbai', state: 'Maharashtra', emoji: '🌊', type: 'city' },
  { name: 'Bangalore', state: 'Karnataka', emoji: '🌿', type: 'city' },
  { name: 'Hyderabad', state: 'Telangana', emoji: '🌶️', type: 'city' },
  { name: 'Chennai', state: 'Tamil Nadu', emoji: '🎭', type: 'city' },
  { name: 'Kolkata', state: 'West Bengal', emoji: '🐅', type: 'city' },
  { name: 'Pune', state: 'Maharashtra', emoji: '🎓', type: 'city' },
  { name: 'Ahmedabad', state: 'Gujarat', emoji: '🦁', type: 'city' },
  { name: 'Jaipur', state: 'Rajasthan', emoji: '🏰', type: 'city' },
  { name: 'Gurgaon', state: 'Haryana', emoji: '🏢', type: 'city' },
  { name: 'Noida', state: 'Uttar Pradesh', emoji: '🏗️', type: 'city' },
  { name: 'Chandigarh', state: 'Punjab', emoji: '🌸', type: 'city' },
];

export default function LocationPicker({ currentCity, onCityChange, onClose }) {
  const [search, setSearch] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsTimeoutRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced API search for locations
  useEffect(() => {
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    if (!search.trim()) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    suggestionsTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search + ', India')}&format=json&addressdetails=1&limit=10`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data
            .map(item => {
              const address = item.address || {};
              const displayName = item.display_name.split(',')[0].trim();
              const city = address.city || address.town || address.village || address.county || displayName;
              const state = address.state || '';
              return {
                name: city,
                state,
                address: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                type: 'search',
                emoji: '📍'
              };
            })
            .filter(s => s.name && s.name.trim()) // Just filter for non-empty name
            .slice(0, 8); // Limit to 8 results
          setSuggestions(formatted);
        }
      } catch (e) {
        console.error('Location search failed:', e);
      }
      setLoadingSuggestions(false);
    }, 400);

    return () => {
      if (suggestionsTimeoutRef.current) clearTimeout(suggestionsTimeoutRef.current);
    };
  }, [search]);

  // Combine popular cities (on first load) with search results
  const filtered = search.trim()
    ? suggestions
    : POPULAR_CITIES;

  const selectCity = (city) => {
    onCityChange(city.name);
    onClose();
  };

  const useCurrentLocation = () => {
    setLocating(true);
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLocating(false);
      return;
    }
    // First try a single high-accuracy request. If accuracy is poor, fall back to watching
    const processPosition = async (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      // Save coords for later use
      try { localStorage.setItem('eatzo_coords', `${latitude},${longitude}`); } catch {}

      // If accuracy is coarse (>150m), try watching for a better fix for a short period
      if (accuracy == null || accuracy > 150) {
        const start = Date.now();
        let best = pos;
        const watchId = navigator.geolocation.watchPosition(
          (p) => {
            if (!p || !p.coords) return;
            if (!best || p.coords.accuracy < (best.coords?.accuracy || Infinity)) best = p;
            // stop if we get good accuracy or timeout after 8s
            if ((p.coords.accuracy && p.coords.accuracy <= 100) || Date.now() - start > 8000) {
              navigator.geolocation.clearWatch(watchId);
              finalize(best);
            }
          },
          (e) => {
            navigator.geolocation.clearWatch(watchId);
            setLocating(false);
            if (e.code === 1) setError('Location permission denied. Please allow access.');
            else setError('Unable to get a better location fix. Using the best available location.');
            finalize(best);
          },
          { enableHighAccuracy: true, maximumAge: 0 }
        );
        // also timeout the watch after 9s to avoid hanging
        setTimeout(() => {
          try { navigator.geolocation.clearWatch(watchId); } catch {}
          finalize(best);
        }, 9000);
      } else {
        finalize(pos);
      }
    };

    const finalize = async (positionToUse) => {
      if (!positionToUse || !positionToUse.coords) {
        setLocating(false);
        setError('Unable to determine your location.');
        return;
      }
      const { latitude, longitude, accuracy } = positionToUse.coords;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        const addr = data.address || {};
        const parts = [
          addr.house_number ? `${addr.house_number} ${addr.road || ''}`.trim() : addr.road,
          addr.suburb,
          addr.city_district,
          addr.city || addr.town || addr.village || addr.county,
          addr.state,
          addr.postcode,
        ].filter(Boolean);
        const pretty = parts.length > 0 ? parts.join(', ') : data.display_name || `📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        const display = accuracy ? `${pretty} (≈${Math.round(accuracy)}m)` : pretty;
        onCityChange(display);
        try { localStorage.setItem('eatzo_coords', `${latitude},${longitude}`); } catch {}
        onClose();
      } catch (e) {
        onCityChange(`📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        onClose();
      } finally {
        setLocating(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => processPosition(position),
      (err) => {
        setLocating(false);
        if (err.code === 1) setError('Location permission denied. Please allow access.');
        else setError('Unable to get your location. Please try again.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="loc-overlay" onClick={onClose}>
      <div className="loc-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="loc-header">
          <h2>📍 Change Location</h2>
          <button className="loc-close" onClick={onClose}>✕</button>
        </div>

        {/* Current Location Button */}
        <button
          className={`loc-gps-btn ${locating ? 'loading' : ''}`}
          onClick={useCurrentLocation}
          disabled={locating}
        >
          <span className="gps-icon">{locating ? '⏳' : '🎯'}</span>
          <div className="gps-text">
            <strong>{locating ? 'Detecting your location...' : 'Use Current Location'}</strong>
            <span>{locating ? 'Please wait' : 'GPS based automatic detection'}</span>
          </div>
          {!locating && <span className="gps-arrow">→</span>}
        </button>

        {error && <div className="loc-error">⚠️ {error}</div>}

        {/* Search */}
        <div className="loc-search">
          <span>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for your city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
          {search && <button onClick={() => setSearch('')} className="clear-btn">✕</button>}
          {loadingSuggestions && search && <span className="search-loading">⏳</span>}
        </div>

        {/* Popular Cities / Results */}
        <div className="loc-cities-header">
          {loadingSuggestions && search ? (
            'Searching locations...'
          ) : search ? (
            `${filtered.length} result${filtered.length !== 1 ? 's' : ''} found`
          ) : (
            'Popular Cities'
          )}
        </div>
        <div className="loc-cities-grid">
          {filtered.length === 0 ? (
            <div className="loc-no-result">
              {search ? (
                <>
                  No locations found for "<strong>{search}</strong>"<br />
                  <span className="hint">Try searching for a city name (e.g., "Delhi", "Mumbai")</span>
                </>
              ) : (
                'Loading popular cities...'
              )}
            </div>
          ) : (
            filtered.map((city, idx) => (
              <button
                key={`${city.name}-${idx}`}
                className={`loc-city-card ${currentCity === city.name ? 'selected' : ''} ${city.type === 'search' ? 'search-result' : ''}`}
                onClick={() => selectCity(city)}
                title={city.address}
              >
                <span className="city-emoji">{city.emoji}</span>
                <div className="city-content">
                  <div className="city-name">{city.name}</div>
                  {city.type === 'search' && city.address ? (
                    <div className="city-address">{city.address}</div>
                  ) : (
                    <div className="city-state">{city.state}</div>
                  )}
                </div>
                {currentCity === city.name && <span className="city-check">✓</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
