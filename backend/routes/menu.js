const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// GET menu for a restaurant
router.get('/:restaurantId', async (req, res) => {
  try {
    const menu = await MenuItem.find({ restaurantId: req.params.restaurantId });
    res.json({ success: true, data: menu });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching menu', error: err.message });
  }
});

// POST add new item
router.post('/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const itemData = req.body;
    
    // Generate random id
    const itemId = 'n' + Math.random().toString(36).substr(2, 9);
    
    const newItem = new MenuItem({
      ...itemData,
      id: itemId,
      restaurantId: restaurantId
    });

    await newItem.save();
    res.status(201).json({ success: true, data: newItem, message: 'Item added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error adding menu item', error: err.message });
  }
});

// PUT update item
router.put('/:restaurantId/:itemId', async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    const updates = req.body;
    
    const updatedItem = await MenuItem.findOneAndUpdate(
      { restaurantId, id: itemId },
      updates,
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    
    res.json({ success: true, data: updatedItem, message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating menu item', error: err.message });
  }
});

// DELETE item
router.delete('/:restaurantId/:itemId', async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    
    const result = await MenuItem.deleteOne({ restaurantId, id: itemId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    
    res.json({ success: true, message: 'Item deleted safely' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting menu item', error: err.message });
  }
});

module.exports = router;
