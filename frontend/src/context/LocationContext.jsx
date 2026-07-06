import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [currentLocation, setCurrentLocation] = useState(() => {
    const saved = localStorage.getItem('eatzo_current_location');
    return saved ? JSON.parse(saved) : null;
  });

  const [savedAddresses, setSavedAddresses] = useState(() => {
    const saved = localStorage.getItem('eatzo_saved_addresses');
    return saved ? JSON.parse(saved) : [
      { id: 1, type: 'home', label: 'Home', address: '', lat: null, lng: null },
      { id: 2, type: 'work', label: 'Work', address: '', lat: null, lng: null },
    ];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedAddress, setSelectedAddress] = useState(() => {
    return localStorage.getItem('eatzo_city') || 'New Delhi';
  });

  // Save locations to localStorage
  useEffect(() => {
    localStorage.setItem('eatzo_saved_addresses', JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  useEffect(() => {
    if (currentLocation) {
      localStorage.setItem('eatzo_current_location', JSON.stringify(currentLocation));
    } else {
      localStorage.removeItem('eatzo_current_location');
    }
  }, [currentLocation]);

  useEffect(() => {
    if (selectedAddress) {
      localStorage.setItem('eatzo_city', selectedAddress);
    }
  }, [selectedAddress]);

  // Get current location using geolocation API
  const getCurrentLocation = async () => {
    setLoading(true);
    setError('');
    
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('Geolocation not supported by your browser');
        setLoading(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocode using OpenStreetMap Nominatim
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await response.json();
            
            const address = data.address || {};
            const displayAddress = data.display_name;
            
            const location = {
              lat: latitude,
              lng: longitude,
              address: displayAddress,
              fullAddress: {
                street: address.road || address.footway || '',
                area: address.suburb || address.neighbourhood || address.village || '',
                city: address.city || address.town || address.county || '',
                state: address.state || '',
                zip: address.postcode || '',
              },
              timestamp: Date.now()
            };
            
            setCurrentLocation(location);
            setSelectedAddress(displayAddress);
            setLoading(false);
            resolve(location);
          } catch (err) {
            console.error('Reverse geocoding failed:', err);
            const location = { lat: latitude, lng: longitude, address: `${latitude}, ${longitude}`, timestamp: Date.now() };
            setCurrentLocation(location);
            setSelectedAddress(`${latitude}, ${longitude}`);
            setLoading(false);
            resolve(location);
          }
        },
        (err) => {
          let errorMsg = 'Unable to get location';
          if (err.code === 1) errorMsg = 'Permission denied. Please enable location access';
          else if (err.code === 2) errorMsg = 'Position unavailable';
          else if (err.code === 3) errorMsg = 'Request timed out';
          
          setError(errorMsg);
          setLoading(false);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  // Automatically fetch location on app load if not already set or default
  useEffect(() => {
    const autoFetchLocation = async () => {
      const saved = localStorage.getItem('eatzo_current_location');
      const savedCity = localStorage.getItem('eatzo_city');
      if (!saved || !savedCity || savedCity === 'New Delhi') {
        getCurrentLocation();
      }
    };
    autoFetchLocation();
  }, []);

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      return data.display_name || 'Unknown Location';
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return `${lat}, ${lng}`;
    }
  };

  // Geocode address to coordinates
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', India')}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        };
      }
      return null;
    } catch (err) {
      console.error('Geocoding failed:', err);
      return null;
    }
  };

  // Update saved address
  const updateSavedAddress = (id, updates) => {
    setSavedAddresses(prev =>
      prev.map(addr => addr.id === id ? { ...addr, ...updates } : addr)
    );
  };

  // Add custom address
  const addCustomAddress = (label, address, lat, lng) => {
    const newAddress = {
      id: Date.now(),
      type: 'custom',
      label,
      address,
      lat,
      lng
    };
    setSavedAddresses(prev => [...prev, newAddress]);
    return newAddress;
  };

  // Delete saved address
  const deleteSavedAddress = (id) => {
    setSavedAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  return (
    <LocationContext.Provider value={{
      currentLocation,
      setCurrentLocation,
      savedAddresses,
      setSavedAddresses,
      updateSavedAddress,
      addCustomAddress,
      deleteSavedAddress,
      getCurrentLocation,
      reverseGeocode,
      geocodeAddress,
      selectedAddress,
      setSelectedAddress,
      loading,
      error,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};
