const express = require('express');
const router = express.Router();
const { orders } = require('../data/orders');

// GET all orders (filter by userId)
router.get('/', (req, res) => {
  const { userId } = req.query;
  let result = [...orders];
  if (userId) {
    result = result.filter(o => o.userId === userId);
  }
  res.json({ success: true, data: result });
});

// GET all orders across the entire platform (Super Admin use)
router.get('/all', (req, res) => {
  res.json({ success: true, data: [...orders].reverse(), count: orders.length });
});


// GET orders for a specific restaurant
router.get('/restaurant/:restaurantId', (req, res) => {
  const result = orders.filter(o => o.restaurantId === req.params.restaurantId);
  res.json({ success: true, data: result });
});

// GET available orders for delivery (or assigned to an agent)
router.get('/delivery/:agentId', (req, res) => {
  const agentId = req.params.agentId;
  const result = orders.filter(o => 
    o.status === 'ready_for_pickup' || 
    (o.deliveryAgentId === agentId && ['out_for_delivery', 'delivered'].includes(o.status))
  );
  res.json({ success: true, data: result });
});

// GET single order
router.get('/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.json({ success: true, data: order });
});

// POST place new order
router.post('/', (req, res) => {
  const { userId, restaurantId, restaurantName, items, total, address, receiverName, receiverPhone, lat, lng } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  // Find restaurant to get its coordinates
  const restaurants = require('../data/restaurants');
  const restaurant = restaurants.find(r => r.id === restaurantId);
  const rLat = restaurant ? restaurant.lat : 28.6139;
  const rLng = restaurant ? restaurant.lng : 77.2090;

  // Set customer coordinates (use provided or generate a nice realistic offset from restaurant)
  const customerLat = lat ? Number(lat) : rLat + 0.0052;
  const customerLng = lng ? Number(lng) : rLng + 0.0078;

  const newOrder = {
    id: 'ORD' + String(orders.length + 1).padStart(3, '0'),
    userId: userId || 'guest',
    restaurantId,
    restaurantName,
    items,
    total,
    address: address || 'Home',
    receiverName: receiverName || 'Customer',
    receiverPhone: receiverPhone || '9876543210',
    restaurantLat: rLat,
    restaurantLng: rLng,
    lat: customerLat,
    lng: customerLng,
    status: 'placed',
    createdAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  res.status(201).json({ success: true, data: newOrder, message: 'Order placed successfully! 🎉' });
});

// PATCH update order status (admin)
router.patch('/:id/status', (req, res) => {
  const { status, deliveryAgentId } = req.body;
  const validStatuses = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.status = status;
  if (deliveryAgentId) {
    order.deliveryAgentId = deliveryAgentId;
  }
  
  res.json({ success: true, data: order, message: 'Order status updated' });
});

module.exports = router;
