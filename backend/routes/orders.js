const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Razorpay = require('razorpay');

let razorpayInstance;
try {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TADeuaqhilwRuH',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '7af3wbjuZTvGZtMDx5iVYFs6'
  });
} catch (err) {
  console.error('Failed to initialize Razorpay in orders router:', err.message);
}

// GET all orders (filter by userId)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};
    if (userId) {
      query.userId = userId;
    }
    const result = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching orders', error: err.message });
  }
});

// GET all orders across the entire platform (Super Admin use)
router.get('/all', async (req, res) => {
  try {
    const result = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: result, count: result.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching all orders', error: err.message });
  }
});

// GET orders for a specific restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const result = await Order.find({ restaurantId: req.params.restaurantId }).sort({ createdAt: -1 });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching restaurant orders', error: err.message });
  }
});

// GET available orders for delivery (or assigned to an agent)
router.get('/delivery/:agentId', async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const result = await Order.find({
      $or: [
        { status: 'ready_for_pickup' },
        { deliveryAgentId: agentId, status: { $in: ['out_for_delivery', 'delivered'] } }
      ]
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching delivery orders', error: err.message });
  }
});

// GET single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching order details', error: err.message });
  }
});

// POST place new order
router.post('/', async (req, res) => {
  try {
    const { userId, restaurantId, restaurantName, items, total, address, addressLabel, receiverName, receiverPhone, paymentMethod, lat, lng } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Find restaurant to get its coordinates
    const restaurant = await Restaurant.findOne({ id: restaurantId });
    const rLat = restaurant ? restaurant.lat : 28.6139;
    const rLng = restaurant ? restaurant.lng : 77.2090;

    // Set customer coordinates
    const customerLat = lat ? Number(lat) : rLat + 0.0052;
    const customerLng = lng ? Number(lng) : rLng + 0.0078;

    // Generate custom ID (e.g., ORD005)
    const count = await Order.countDocuments();
    const orderId = 'ORD' + String(count + 1).padStart(3, '0');

    // Create Order object in DB
    const newOrder = new Order({
      id: orderId,
      userId: userId || 'guest',
      restaurantId,
      restaurantName,
      items,
      total,
      address: address || 'Home',
      addressLabel: addressLabel || '📍 Selected Location',
      receiverName: receiverName || 'Customer',
      receiverPhone: receiverPhone || '9876543210',
      restaurantLat: rLat,
      restaurantLng: rLng,
      lat: customerLat,
      lng: customerLng,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      status: paymentMethod === 'cod' ? 'placed' : 'pending_payment',
      createdAt: new Date()
    });

    // If payment method is online (not cod), create a Razorpay Order first
    if (paymentMethod !== 'cod' && razorpayInstance) {
      const options = {
        amount: Math.round(total * 100), // in paisa
        currency: 'INR',
        receipt: orderId
      };
      
      const razorpayOrder = await razorpayInstance.orders.create(options);
      newOrder.paymentOrderId = razorpayOrder.id;
      await newOrder.save();

      return res.status(201).json({
        success: true,
        data: newOrder,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID || 'rzp_test_TADeuaqhilwRuH'
        },
        message: 'Order created, payment pending... 💳'
      });
    }

    await newOrder.save();
    res.status(201).json({ success: true, data: newOrder, message: 'Order placed successfully! 🎉' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error placing order', error: err.message });
  }
});

// PATCH update order status (admin/delivery agent)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, deliveryAgentId } = req.body;
    const validStatuses = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled', 'pending_payment'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    let updates = {};
    if (status) updates.status = status;
    if (deliveryAgentId) updates.deliveryAgentId = deliveryAgentId;

    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      updates,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, data: order, message: 'Order status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating order status', error: err.message });
  }
});

module.exports = router;
