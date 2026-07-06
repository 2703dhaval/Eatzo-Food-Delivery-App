const express = require('express');
const router = express.Router();
const menuItems = require('../data/menu');

// GET menu for a restaurant
router.get('/:restaurantId', (req, res) => {
  const menu = menuItems[req.params.restaurantId];
  if (!menu) {
    return res.status(404).json({ success: false, message: 'Menu not found' });
  }
  res.json({ success: true, data: menu });
});

// POST add new item
router.post('/:restaurantId', (req, res) => {
  const { restaurantId } = req.params;
  const newItem = req.body;
  if (!menuItems[restaurantId]) {
    menuItems[restaurantId] = [];
  }
  
  // Generate random id
  newItem.id = 'n' + Math.random().toString(36).substr(2, 9);
  menuItems[restaurantId].push(newItem);
  res.status(201).json({ success: true, data: newItem, message: 'Item added successfully' });
});

// PUT update item
router.put('/:restaurantId/:itemId', (req, res) => {
  const { restaurantId, itemId } = req.params;
  const updates = req.body;
  const menu = menuItems[restaurantId];
  
  if (!menu) return res.status(404).json({ success: false, message: 'Restaurant menu not found' });
  
  const itemIndex = menu.findIndex(i => i.id === itemId);
  if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Item not found' });
  
  menuItems[restaurantId][itemIndex] = { ...menuItems[restaurantId][itemIndex], ...updates };
  res.json({ success: true, data: menuItems[restaurantId][itemIndex], message: 'Item updated' });
});

// DELETE item
router.delete('/:restaurantId/:itemId', (req, res) => {
  const { restaurantId, itemId } = req.params;
  const menu = menuItems[restaurantId];
  
  if (!menu) return res.status(404).json({ success: false, message: 'Restaurant menu not found' });
  
  menuItems[restaurantId] = menuItems[restaurantId].filter(i => i.id !== itemId);
  res.json({ success: true, message: 'Item deleted safely' });
});

module.exports = router;
