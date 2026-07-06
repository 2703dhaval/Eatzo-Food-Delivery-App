const express = require('express');
const router = express.Router();
const DeliveryAgent = require('../models/DeliveryAgent');

// GET all delivery agents (Super Admin)
router.get('/', async (req, res) => {
  try {
    const agents = await DeliveryAgent.find();
    res.json({ success: true, data: agents });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching delivery agents', error: err.message });
  }
});

// POST Login delivery agent
router.post('/login', async (req, res) => {
  try {
    const { id, password } = req.body;
    const agent = await DeliveryAgent.findOne({ id, password });
    if (agent) {
      res.json({ success: true, data: agent, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid ID or password' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error logging in agent', error: err.message });
  }
});

// GET single agent
router.get('/:id', async (req, res) => {
  try {
    const agent = await DeliveryAgent.findOne({ id: req.params.id });
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching agent details', error: err.message });
  }
});

// PATCH update agent status
router.patch('/:id/status', async (req, res) => {
  try {
    const { isOnline, currentOrderId } = req.body;
    
    let updates = {};
    if (isOnline !== undefined) updates.isOnline = isOnline;
    if (currentOrderId !== undefined) updates.currentOrderId = currentOrderId;

    const agent = await DeliveryAgent.findOneAndUpdate(
      { id: req.params.id },
      updates,
      { new: true }
    );

    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, data: agent, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating agent status', error: err.message });
  }
});

// POST add new delivery agent (Super Admin)
router.post('/', async (req, res) => {
  try {
    const { name, phone, vehicle, vehicleNo, password } = req.body;
    if (!name || !phone || !vehicle) {
      return res.status(400).json({ success: false, message: 'Name, phone, and vehicle type are required' });
    }

    const count = await DeliveryAgent.countDocuments();
    const newId = 'D' + String(count + 1).padStart(3, '0');
    const avatars = { Bike: '🏍️', Bicycle: '🚴', Scooter: '🛵' };

    const newAgent = new DeliveryAgent({
      id: newId,
      name,
      phone,
      vehicle,
      vehicleNo: vehicleNo || 'N/A',
      avatar: avatars[vehicle] || '🛵',
      rating: 4.8,
      totalDeliveries: 0,
      isOnline: true,
      currentOrderId: null,
      password: password || 'delivery123'
    });

    await newAgent.save();
    res.status(201).json({ success: true, data: newAgent, message: 'Delivery agent added successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error adding delivery agent', error: err.message });
  }
});

// DELETE delivery agent (Super Admin)
router.delete('/:id', async (req, res) => {
  try {
    const result = await DeliveryAgent.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }
    res.json({ success: true, message: 'Delivery agent deleted safely' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting delivery agent', error: err.message });
  }
});

module.exports = router;
