const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, default: 'percentage' },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date }
});

module.exports = mongoose.model('Coupon', couponSchema);
