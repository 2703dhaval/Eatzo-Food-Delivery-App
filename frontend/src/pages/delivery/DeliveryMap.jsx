import React, { useEffect, useRef } from 'react';
import './DeliveryMap.css';

let L = null;

export default function DeliveryMap({ 
  restaurantName = 'Restaurant', 
  restaurantLat, 
  restaurantLng, 
  customerLat, 
  customerLng 
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // 1. Dynamically append Leaflet stylesheet if not loaded yet
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Load Leaflet script dynamically
    const initMap = () => {
      L = window.L;
      if (!L || !mapRef.current || mapInstanceRef.current) return;

      const rLat = Number(restaurantLat) || 28.5355;
      const rLng = Number(restaurantLng) || 77.3910;
      const cLat = Number(customerLat) || rLat + 0.0052;
      const cLng = Number(customerLng) || rLng + 0.0078;

      // Fix default marker asset references
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Create map centered between restaurant and customer
      const map = L.map(mapRef.current, {
        center: [(rLat + cLat) / 2, (rLng + cLng) / 2],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
      });

      // Premium dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Create custom markers
      const restaurantIcon = L.divIcon({
        html: `<div class="sa-div-marker sa-restaurant-marker">🏪</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const customerIcon = L.divIcon({
        html: `<div class="sa-div-marker sa-customer-marker">🏠</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Add markers
      const restMarker = L.marker([rLat, rLng], { icon: restaurantIcon }).addTo(map);
      restMarker.bindPopup(`<strong>${restaurantName}</strong><br/>Pickup point`).openPopup();

      L.marker([cLat, cLng], { icon: customerIcon }).addTo(map)
        .bindPopup(`<strong>Dropoff Point</strong><br/>Deliver here`);

      // Draw a polyline (delivery route)
      const routeCoordinates = [
        [rLat, rLng],
        [cLat, cLng]
      ];
      L.polyline(routeCoordinates, {
        color: '#00c853',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Adjust map view to fit both markers perfectly
      const bounds = L.latLngBounds([
        [rLat, rLng],
        [cLat, cLng]
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });

      mapInstanceRef.current = map;
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
  }, [restaurantName, restaurantLat, restaurantLng, customerLat, customerLng]);

  return (
    <div className="dp-map-wrapper">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
