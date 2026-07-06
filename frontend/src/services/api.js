const BASE_URL = 'http://localhost:5000/api';

export const api = {
  async getRestaurants(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/restaurants?${query}`);
    return res.json();
  },

  async getRestaurant(id) {
    const res = await fetch(`${BASE_URL}/restaurants/${id}`);
    return res.json();
  },

  async getMenu(restaurantId) {
    const res = await fetch(`${BASE_URL}/menu/${restaurantId}`);
    return res.json();
  },

  async placeOrder(orderData) {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return res.json();
  },

  async getOrder(id) {
    const res = await fetch(`${BASE_URL}/orders/${id}`);
    return res.json();
  },

  async getUserOrders(userId) {
    const res = await fetch(`${BASE_URL}/orders?userId=${userId}`);
    return res.json();
  },

  async updateOrderStatus(id, status) {
    const res = await fetch(`${BASE_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },
};
