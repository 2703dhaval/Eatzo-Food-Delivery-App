const express = require('express');
const router = express.Router();
const restaurants = require('../data/restaurants');

// GET all restaurants
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let result = [...restaurants];

  if (category && category !== 'All') {
    result = result.filter(r => r.category === category);
  }
  if (search) {
    result = result.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.json({ success: true, data: result, count: result.length });
});

// GET single restaurant
router.get('/:id', (req, res) => {
  const restaurant = restaurants.find(r => r.id === req.params.id);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }
  res.json({ success: true, data: restaurant });
});

// PATCH update restaurant status (admin)
router.patch('/:id/status', (req, res) => {
  const { isOpen } = req.body;
  const restaurant = restaurants.find(r => r.id === req.params.id);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }
  
  if (isOpen !== undefined) {
    restaurant.isOpen = isOpen;
  }
  
  res.json({ success: true, data: restaurant, message: `Restaurant is now ${isOpen ? 'Online' : 'Offline'}` });
});

// POST add new restaurant (Super Admin)
router.post('/', (req, res) => {
  const { name, cuisine, category, address, minOrder, deliveryFee, discount, image, lat, lng } = req.body;
  if (!name || !cuisine || !address) {
    return res.status(400).json({ success: false, message: 'Name, cuisine, and address are required' });
  }

  const newId = String(restaurants.length + 1);
  const newRestaurant = {
    id: newId,
    name,
    cuisine,
    category: category || 'Indian',
    address,
    minOrder: Number(minOrder) || 100,
    deliveryFee: Number(deliveryFee) || 30,
    discount: discount || '10% OFF',
    image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
    isOpen: true,
    rating: 4.5,
    totalRatings: 1,
    priceForTwo: 400,
    lat: Number(lat) || 28.6139,
    lng: Number(lng) || 77.2090,
  };

  restaurants.push(newRestaurant);
  
  // Initialize empty menu for this restaurant in menu.js data store
  const menuItems = require('../data/menu');
  menuItems[newId] = [];

  res.status(201).json({ success: true, data: newRestaurant, message: 'Restaurant added successfully!' });
});

// DELETE restaurant (Super Admin)
router.delete('/:id', (req, res) => {
  const index = restaurants.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }
  restaurants.splice(index, 1);
  res.json({ success: true, message: 'Restaurant deleted safely' });
});

module.exports = router;
