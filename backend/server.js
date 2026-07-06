const express = require('express');
const cors = require('cors');
require('dotenv').config();

const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const deliveryRoutes = require('./routes/delivery');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Eatzo Food Delivery API is running 🍕', status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`✅ Eatzo Backend running at http://localhost:${PORT}`);
});
