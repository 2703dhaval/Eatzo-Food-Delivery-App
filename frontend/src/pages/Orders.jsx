import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './Orders.css';

const STATUS_CONFIG = {
  placed: { label: 'Order Placed', color: '#FFC107', icon: '📋' },
  confirmed: { label: 'Confirmed', color: '#2196F3', icon: '✅' },
  preparing: { label: 'Preparing', color: '#FF9800', icon: '👨‍🍳' },
  out_for_delivery: { label: 'On the Way', color: '#9C27B0', icon: '🛵' },
  delivered: { label: 'Delivered', color: '#4CAF50', icon: '🎉' },
  cancelled: { label: 'Cancelled', color: '#F44336', icon: '❌' },
};

// Fallback demo orders for display
const DEMO_ORDERS = [
  {
    id: 'ORD001',
    restaurantName: 'Spice Garden',
    items: [{ name: 'Butter Chicken', qty: 1, price: 320 }, { name: 'Garlic Naan', qty: 2, price: 60 }],
    total: 440,
    status: 'delivered',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    address: 'Home - 123, MG Road, Delhi',
  },
  {
    id: 'ORD002',
    restaurantName: 'Pizza Palace',
    items: [{ name: 'Margherita Pizza', qty: 1, price: 350 }, { name: 'Garlic Bread', qty: 1, price: 150 }],
    total: 530,
    status: 'preparing',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    address: 'Work - Block B, Cyber City',
  },
];

export default function Orders() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadOrders();
  }, [isLoggedIn]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getUserOrders(user.id);
      const combined = res.success
        ? [...res.data, ...DEMO_ORDERS.filter(d => !res.data.find(o => o.id === d.id))]
        : DEMO_ORDERS;
      setOrders(combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch {
      setOrders(DEMO_ORDERS);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return (
    <div className="page orders-login-prompt">
      <div className="login-prompt-content">
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📦</div>
        <h2>Login to see your orders</h2>
        <p>Track your current and past orders from here</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ marginTop: 20 }}>
          Login / Sign Up
        </button>
      </div>
    </div>
  );

  return (
    <div className="page orders-page">
      <div className="container">
        <h1 className="section-title">My Orders</h1>
        <p className="section-subtitle">Hi {user?.name}, here are your recent orders</p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160 }}></div>)}
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
            <h3>No orders yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Time to order some food!</p>
            <button className="btn btn-primary" onClick={() => navigate('/restaurants')}>Order Now</button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => {
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
              const date = new Date(order.createdAt);
              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-card-left">
                      <h3 className="order-restaurant">{order.restaurantName}</h3>
                      <p className="order-id">#{order.id}</p>
                    </div>
                    <div className="order-status-badge" style={{ background: statusCfg.color + '22', color: statusCfg.color, border: `1px solid ${statusCfg.color}44` }}>
                      {statusCfg.icon} {statusCfg.label}
                    </div>
                  </div>

                  <div className="order-items-preview">
                    {order.items?.map((item, i) => (
                      <span key={i} className="order-item-tag">
                        {item.qty}x {item.name}
                      </span>
                    ))}
                  </div>

                  <div className="order-card-footer">
                    <div className="order-meta">
                      <span>🕐 {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span>💰 ₹{order.total}</span>
                      <span>·</span>
                      <span>📍 {order.address?.split(' - ')[0] || order.address}</span>
                    </div>
                    {order.status === 'delivered' && (
                      <button className="btn btn-outline reorder-btn" onClick={() => navigate(`/restaurant/${order.restaurantId || '1'}`)}>
                        Reorder
                      </button>
                    )}
                    {(order.status === 'placed' || order.status === 'confirmed' || order.status === 'preparing' || order.status === 'out_for_delivery') && (
                      <button className="btn btn-primary track-btn" onClick={() => navigate(`/order-success/${order.id}`)}>
                        Track Order 📍
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
