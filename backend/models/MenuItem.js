const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  isVeg: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },
  category: { type: String },
  rating: { type: Number, default: 4.0 },
  totalRatings: { type: Number, default: 0 }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
