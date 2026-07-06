const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  cuisine: { type: String, required: true },
  rating: { type: Number, default: 4.0 },
  totalRatings: { type: Number, default: 0 },
  deliveryTime: { type: String, default: '30-40 min' },
  minOrder: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  address: { type: String, required: true },
  image: { type: String },
  isOpen: { type: Boolean, default: true },
  discount: { type: String, default: '' },
  tags: [{ type: String }],
  priceForTwo: { type: Number, default: 0 },
  lat: { type: Number },
  lng: { type: Number },
  category: { type: String }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
