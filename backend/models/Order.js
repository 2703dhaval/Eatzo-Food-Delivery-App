const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  restaurantId: { type: String, required: true },
  restaurantName: { type: String, required: true },
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      qty: { type: Number, required: true }
    }
  ],
  total: { type: Number, required: true },
  address: { type: String, required: true },
  addressLabel: { type: String },
  receiverName: { type: String },
  receiverPhone: { type: String },
  paymentMethod: { type: String },
  paymentStatus: { type: String, default: 'pending' },
  paymentId: { type: String },
  paymentOrderId: { type: String },
  paymentSignature: { type: String },
  restaurantLat: { type: Number },
  restaurantLng: { type: Number },
  lat: { type: Number },
  lng: { type: Number },
  status: { type: String, default: 'placed' },
  deliveryAgentId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
