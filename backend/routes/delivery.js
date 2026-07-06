const express = require('express');
const router = express.Router();
const { deliveryAgents, deliveryCredentials } = require('../data/deliveryAgents');

// GET all delivery agents (Super Admin)
router.get('/', (req, res) => {
  res.json({ success: true, data: deliveryAgents });
});

// POST Login delivery agent
router.post('/login', (req, res) => {
  const { id, password } = req.body;
  if (deliveryCredentials[id] && deliveryCredentials[id] === password) {
    const agent = deliveryAgents.find(a => a.id === id);
    res.json({ success: true, data: agent, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid ID or password' });
  }
});

// GET single agent
router.get('/:id', (req, res) => {
  const agent = deliveryAgents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
  res.json({ success: true, data: agent });
});

// PATCH update agent status
router.patch('/:id/status', (req, res) => {
  const { isOnline, currentOrderId } = req.body;
  const agent = deliveryAgents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

  if (isOnline !== undefined) agent.isOnline = isOnline;
  if (currentOrderId !== undefined) agent.currentOrderId = currentOrderId;

  res.json({ success: true, data: agent, message: 'Status updated' });
});

// POST add new delivery agent (Super Admin)
router.post('/', (req, res) => {
  const { name, phone, vehicle, vehicleNo, password } = req.body;
  if (!name || !phone || !vehicle) {
    return res.status(400).json({ success: false, message: 'Name, phone, and vehicle type are required' });
  }

  const newId = 'D' + String(deliveryAgents.length + 1).padStart(3, '0');
  const avatars = { Bike: '🏍️', Bicycle: '🚴', Scooter: '🛵' };

  const newAgent = {
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
  };

  deliveryAgents.push(newAgent);
  deliveryCredentials[newId] = password || 'delivery123';

  res.status(201).json({ success: true, data: newAgent, message: 'Delivery agent added successfully!' });
});

// DELETE delivery agent (Super Admin)
router.delete('/:id', (req, res) => {
  const index = deliveryAgents.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Agent not found' });
  }
  deliveryAgents.splice(index, 1);
  delete deliveryCredentials[req.params.id];
  res.json({ success: true, message: 'Delivery agent deleted safely' });
});

module.exports = router;
