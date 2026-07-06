const mongoose = require('mongoose');

const deliveryAgentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  vehicle: { type: String, required: true },
  vehicleNo: { type: String },
  avatar: { type: String },
  rating: { type: Number, default: 4.8 },
  totalDeliveries: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: true },
  currentOrderId: { type: String, default: null },
  password: { type: String, required: true }
});

module.exports = mongoose.model('DeliveryAgent', deliveryAgentSchema);
