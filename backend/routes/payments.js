const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');

let razorpayInstance;
try {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TADeuaqhilwRuH',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '7af3wbjuZTvGZtMDx5iVYFs6'
  });
} catch (err) {
  console.error('Failed to initialize Razorpay in payments router:', err.message);
}

// POST verify payment signature
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, message: 'Missing required signature verification fields' });
    }

    // Verify signature
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const secret = process.env.RAZORPAY_KEY_SECRET || '7af3wbjuZTvGZtMDx5iVYFs6';
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    const isValidSignature = generated_signature === razorpay_signature;

    // Find the corresponding order in MongoDB
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found in database' });
    }

    if (isValidSignature) {
      // Update order details for successful payment
      order.paymentStatus = 'paid';
      order.status = 'placed'; // Active status for order tracking
      order.paymentId = razorpay_payment_id;
      order.paymentSignature = razorpay_signature;
      await order.save();

      console.log(`✅ Payment successful for order ${orderId}, Razorpay ID: ${razorpay_payment_id}`);

      return res.json({
        success: true,
        message: 'Payment verified successfully! 🎉',
        data: order
      });
    } else {
      // Signature mismatch (could be fraud attempt or transmission error)
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      await order.save();

      console.log(`❌ Payment signature mismatch for order ${orderId}`);

      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed. Possible tampering detected.'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during payment verification', error: err.message });
  }
});

// POST handle payment failure callback
router.post('/failure', async (req, res) => {
  try {
    const { orderId, errorDescription, errorCode } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = 'failed';
    order.status = 'cancelled';
    await order.save();

    console.log(`❌ Payment failed for order ${orderId}: ${errorDescription || 'Unknown reason'} (Code: ${errorCode || 'N/A'})`);

    res.json({ success: true, message: 'Order status updated to cancelled due to payment failure.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error handling payment failure', error: err.message });
  }
});

module.exports = router;
