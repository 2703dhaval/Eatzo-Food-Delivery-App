// In-memory orders store
let orders = [
  {
    id: 'ORD001',
    userId: 'user1',
    restaurantId: '1',
    restaurantName: 'Spice Garden',
    items: [
      { name: 'Butter Chicken', price: 320, qty: 1 },
      { name: 'Garlic Naan', price: 60, qty: 2 }
    ],
    total: 440,
    status: 'delivered',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    address: '123, MG Road, Delhi',
  }
];

module.exports = { orders };
