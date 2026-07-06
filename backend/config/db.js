const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const DeliveryAgent = require('../models/DeliveryAgent');
const Order = require('../models/Order');

const seedDatabase = async () => {
  try {
    // 1. Seed Restaurants
    const restaurantCount = await Restaurant.countDocuments();
    if (restaurantCount === 0) {
      console.log('🌱 Seeding restaurants...');
      const mockRestaurants = require('../data/restaurants');
      await Restaurant.insertMany(mockRestaurants);
      console.log(`✅ Seeded ${mockRestaurants.length} restaurants.`);
    }

    // 2. Seed Menu Items
    const menuItemCount = await MenuItem.countDocuments();
    if (menuItemCount === 0) {
      console.log('🌱 Seeding menu items...');
      const mockMenuItems = require('../data/menu');
      const allItems = [];
      for (const restaurantId in mockMenuItems) {
        const items = mockMenuItems[restaurantId];
        items.forEach(item => {
          allItems.push({
            ...item,
            restaurantId: restaurantId
          });
        });
      }
      await MenuItem.insertMany(allItems);
      console.log(`✅ Seeded ${allItems.length} menu items.`);
    }

    // 3. Seed Delivery Agents
    const agentCount = await DeliveryAgent.countDocuments();
    if (agentCount === 0) {
      console.log('🌱 Seeding delivery agents...');
      const { deliveryAgents, deliveryCredentials } = require('../data/deliveryAgents');
      const agentsToInsert = deliveryAgents.map(agent => ({
        ...agent,
        password: deliveryCredentials[agent.id] || 'delivery123'
      }));
      await DeliveryAgent.insertMany(agentsToInsert);
      console.log(`✅ Seeded ${agentsToInsert.length} delivery agents.`);
    }

    // 4. Seed Orders
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      console.log('🌱 Seeding orders...');
      const { orders } = require('../data/orders');
      await Order.insertMany(orders);
      console.log(`✅ Seeded ${orders.length} orders.`);
    }
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  }
};

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/eatzo';

  try {
    console.log(`📂 Attempting connection to MongoDB Atlas...`);
    const conn = await mongoose.connect(primaryUri);
    console.log(`📂 MongoDB Atlas Connected: ${conn.connection.host}`);
    await seedDatabase();
  } catch (err) {
    console.warn(`⚠️ MongoDB Atlas Connection Failed. Error: ${err.message}`);
    console.warn(`💡 Ensure your IP address is whitelisted on your Atlas cluster (Network Access -> Add IP Address -> Allow Access from Anywhere / 0.0.0.0/0).`);
    
    try {
      console.log(`📂 Retrying connection with local fallback: ${fallbackUri}...`);
      const conn = await mongoose.connect(fallbackUri);
      console.log(`📂 Local MongoDB Connected: ${conn.connection.host}`);
      await seedDatabase();
    } catch (localErr) {
      console.error(`❌ Connection to both MongoDB Atlas and Local MongoDB failed.`);
      console.error(`🔴 Atlas Error: ${err.message}`);
      console.error(`🔴 Local Error: ${localErr.message}`);
      console.error(`\n======================================================`);
      console.error(`TO RESOLVE DATABASE CONNECTION ISSUES:`);
      console.error(`1. Go to https://cloud.mongodb.com/`);
      console.error(`2. Navigate to Network Access -> Add IP Address`);
      console.error(`3. Click 'Allow Access From Anywhere' (0.0.0.0/0) and save.`);
      console.error(`4. Alternatively, make sure MongoDB is running locally.`);
      console.error(`======================================================\n`);
      console.warn(`⚠️ Keeping backend server running to prevent Render container crashes. Database calls will fail until connected.`);
    }
  }
};

module.exports = connectDB;
