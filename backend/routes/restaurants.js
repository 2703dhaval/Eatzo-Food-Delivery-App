const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// GET all restaurants
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } }
      ];
    }

    const result = await Restaurant.find(query);
    res.json({ success: true, data: result, count: result.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching restaurants', error: err.message });
  }
});

// GET single restaurant
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ id: req.params.id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    res.json({ success: true, data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching restaurant details', error: err.message });
  }
});

// PATCH update restaurant status (admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { isOpen } = req.body;
    if (isOpen === undefined) {
      return res.status(400).json({ success: false, message: 'isOpen field is required' });
    }
    
    const restaurant = await Restaurant.findOneAndUpdate(
      { id: req.params.id },
      { isOpen },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    
    res.json({ success: true, data: restaurant, message: `Restaurant is now ${isOpen ? 'Online' : 'Offline'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating restaurant status', error: err.message });
  }
});

// POST add new restaurant (Super Admin)
router.post('/', async (req, res) => {
  try {
    const { name, cuisine, category, address, minOrder, deliveryFee, discount, image, lat, lng } = req.body;
    if (!name || !cuisine || !address) {
      return res.status(400).json({ success: false, message: 'Name, cuisine, and address are required' });
    }

    // Determine new unique string id
    const count = await Restaurant.countDocuments();
    const newId = String(count + 1);

    const newRestaurant = new Restaurant({
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
    });

    await newRestaurant.save();
    res.status(201).json({ success: true, data: newRestaurant, message: 'Restaurant added successfully! 🎉' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error adding restaurant', error: err.message });
  }
});

// DELETE restaurant (Super Admin)
router.delete('/:id', async (req, res) => {
  try {
    const result = await Restaurant.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    // Clean up related menu items
    await MenuItem.deleteMany({ restaurantId: req.params.id });
    res.json({ success: true, message: 'Restaurant and its menu deleted safely' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting restaurant', error: err.message });
  }
});

module.exports = router;
