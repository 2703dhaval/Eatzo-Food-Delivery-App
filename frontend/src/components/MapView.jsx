import React, { useEffect, useRef } from 'react';
import './MapView.css';

// Leaflet is loaded via CDN to avoid SSR issues
let L = null;

export default function MapView({ restaurants = [], selectedId = null, onSelectRestaurant }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Dynamically load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Dynamically load Leaflet JS
    const initMap = () => {
      L = window.L;
      if (!L || !mapRef.current || mapInstanceRef.current) return;

      // Fix default marker icon
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Center on India
      const map = L.map(mapRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      addMarkers(map);
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.id = 'leaflet-js';
      script.onload = initMap;
      if (!document.getElementById('leaflet-js')) {
        document.head.appendChild(script);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const addMarkers = (map) => {
    if (!L || !map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    restaurants.forEach(r => {
      if (!r.lat || !r.lng) return;

      const isSelected = r.id === selectedId;
      const markerHtml = `
        <div class="map-marker ${isSelected ? 'selected' : ''}">
          <span>🍕</span>
        </div>`;

      const icon = L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const marker = L.marker([r.lat, r.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="map-popup">
            <img src="${r.image}" alt="${r.name}" />
            <div class="map-popup-info">
              <strong>${r.name}</strong>
              <span>⭐ ${r.rating} · ${r.deliveryTime}</span>
              <span style="color:#FF6B35">₹${r.deliveryFee} delivery</span>
            </div>
          </div>
        `, { maxWidth: 220 });

      marker.on('click', () => {
        if (onSelectRestaurant) onSelectRestaurant(r);
      });

      markersRef.current.push(marker);
    });
  };

  // Re-add markers when restaurants change
  useEffect(() => {
    if (mapInstanceRef.current && window.L) {
      addMarkers(mapInstanceRef.current);
    }
  }, [restaurants, selectedId]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map-view"></div>
      <div className="map-overlay-info">
        <span>📍 {restaurants.filter(r => r.lat).length} restaurants on map</span>
        <span>Scroll to zoom • Click marker for details</span>
      </div>
    </div>
  );
}
