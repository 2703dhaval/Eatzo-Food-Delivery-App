import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDelivery } from '../../context/DeliveryContext';
import DeliveryMap from './DeliveryMap';
import { notificationService } from '../../services/notificationService';
import './Delivery.css';

const BASE = 'http://localhost:5000/api';

function fmtCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

export default function DeliveryDashboard() {
  const { deliveryAgent, updateStatus, deliveryLogout } = useDelivery();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home'); // home, earnings, profile
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deliveryAgent) {
      navigate('/delivery');
      return;
    }
    loadOrders();
    const interval = setInterval(loadOrders, 4000); // Poll for active/new orders
    return () => clearInterval(interval);
  }, [deliveryAgent, navigate]);

  const loadOrders = useCallback(async () => {
    if (!deliveryAgent) return;
    try {
      const res = await fetch(`${BASE}/orders/delivery/${deliveryAgent.id}`);
      const data = await res.json();
      if (data.success) {
        const newOrdersList = data.data;
        setOrders(prevOrders => {
          const prevReady = prevOrders.filter(o => o.status === 'ready_for_pickup');
          const newReady = newOrdersList.filter(o => o.status === 'ready_for_pickup');
          if (newReady.length > prevReady.length && prevOrders.length > 0) {
            const latest = newReady[newReady.length - 1];
            notificationService.sendNotification('🛵 New Delivery Job Available!', {
              body: `Order #${latest.id} from ${latest.restaurantName} is ready for pickup.`,
              tag: `new-job-${latest.id}`,
            });
          }
          return newOrdersList;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [deliveryAgent]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, deliveryAgentId: deliveryAgent.id })
      });
      loadOrders();
    } catch (err) {
      console.error(err);
    }
  };

  if (!deliveryAgent) return null;

  // Active delivery: order assigned to this agent with status 'out_for_delivery'
  const currentActiveOrder = orders.find(o => o.deliveryAgentId === deliveryAgent.id && o.status === 'out_for_delivery');
  
  // Available orders for pickup (status 'ready_for_pickup')
  const availableOrders = orders.filter(o => o.status === 'ready_for_pickup');

  // Completed orders for earnings calculation
  const completedOrders = orders.filter(o => o.deliveryAgentId === deliveryAgent.id && o.status === 'delivered');
  const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.total * 0.1), 0); // 10% of order total is delivery pay

  return (
    <div className="dp-app">
      <div className="sa-login-bg" style={{ opacity: 0.3 }} />
      <div className="dp-shell">
        
        {/* ── Header ── */}
        <header className="dp-header">
          <div className="dp-header-top">
            <div className="dp-agent-pill">
              <div className="dp-avatar-circle">{deliveryAgent.avatar}</div>
              <div>
                <div className="dp-agent-name">{deliveryAgent.name}</div>
                <div className="dp-vehicle-tag">{deliveryAgent.vehicle} · {deliveryAgent.vehicleNo}</div>
              </div>
            </div>

            <div 
              className={`dp-online-toggle ${deliveryAgent.isOnline ? 'online' : 'offline'}`}
              onClick={() => updateStatus(!deliveryAgent.isOnline)}
            >
              <div className="sa-donut-dot dp-toggle-dot" />
              <span className="dp-toggle-label">{deliveryAgent.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
          </div>

          <div className="dp-header-stats">
            <div className="dp-hstat">
              <div className="dp-hstat-val" style={{ color: 'var(--dp-green)' }}>
                {completedOrders.length}
              </div>
              <div className="dp-hstat-lbl">Deliveries</div>
            </div>
            <div className="dp-hstat">
              <div className="dp-hstat-val" style={{ color: 'var(--dp-teal)' }}>
                {fmtCurrency(totalEarnings.toFixed(0))}
              </div>
              <div className="dp-hstat-lbl">Today's Pay</div>
            </div>
            <div className="dp-hstat">
              <div className="dp-hstat-val" style={{ color: '#ffc107' }}>
                ★ {deliveryAgent.rating || '4.8'}
              </div>
              <div className="dp-hstat-lbl">Rating</div>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="dp-content">
          {activeTab === 'home' && (
            <div>
              {!deliveryAgent.isOnline ? (
                <div className="dp-offline-screen">
                  <div className="dp-offline-ring">💤</div>
                  <h2>You're Offline</h2>
                  <p>Go online to start receiving delivery requests in your area and earn money.</p>
                  <button className="Sa-login-btn dp-go-online-btn" onClick={() => updateStatus(true)}>
                    🟢 Go Online Now
                  </button>
                </div>
              ) : currentActiveOrder ? (
                <div>
                  <DeliveryMap 
                    restaurantName={currentActiveOrder.restaurantName}
                    restaurantLat={currentActiveOrder.restaurantLat}
                    restaurantLng={currentActiveOrder.restaurantLng}
                    customerLat={currentActiveOrder.lat}
                    customerLng={currentActiveOrder.lng}
                  />

                  <div className="dp-active-card">
                    <div className="dp-active-tag">
                      <div className="dp-active-tag-dot" />
                      <span>Active Delivery</span>
                    </div>
                    <span className="dp-earn-pill">Pay: {fmtCurrency((currentActiveOrder.total * 0.1).toFixed(0))}</span>
                    <h2 className="dp-active-order-id">Order #{currentActiveOrder.id}</h2>

                    <div className="dp-route">
                      <div className="dp-route-stop">
                        <div className="dp-stop-icon pickup">🏪</div>
                        <div>
                          <div className="dp-stop-label">Pickup Location</div>
                          <div className="dp-stop-name">{currentActiveOrder.restaurantName}</div>
                          <div className="dp-stop-addr">Restaurant Kitchen</div>
                        </div>
                      </div>
                      <div className="dp-route-line" />
                      <div className="dp-route-stop">
                        <div className="dp-stop-icon dropoff">🏠</div>
                        <div>
                          <div className="dp-stop-label">Dropoff Location</div>
                          <div className="dp-stop-name">Customer Address</div>
                          <div className="dp-stop-addr">{currentActiveOrder.address}</div>
                        </div>
                      </div>
                    </div>

                    {(currentActiveOrder.receiverName || currentActiveOrder.receiverPhone) && (
                      <div className="dp-order-items-summary" style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {currentActiveOrder.receiverName && (
                          <div>👤 Receiver: <strong style={{ color: 'var(--dp-text)' }}>{currentActiveOrder.receiverName}</strong></div>
                        )}
                        {currentActiveOrder.receiverPhone && (
                          <div>📞 Contact: <strong style={{ color: 'var(--dp-text)' }}>{currentActiveOrder.receiverPhone}</strong></div>
                        )}
                      </div>
                    )}

                    <div className="dp-order-items-summary">
                      Items: <strong>{currentActiveOrder.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}</strong>
                    </div>

                    <button 
                      className="dp-mark-delivered" 
                      onClick={() => updateOrderStatus(currentActiveOrder.id, 'delivered')}
                    >
                      🏁 Swiped! Mark Delivered
                    </button>
                  </div>
                </div>
              ) : (
                <div className="dp-section-pad">
                  <div className="dp-section-title">New Requests Nearby</div>
                  {availableOrders.length === 0 ? (
                    <div className="dp-radar-wrap">
                      <div className="dp-radar">
                        <div className="dp-radar-center">📡</div>
                      </div>
                      <p>Scanning for nearby orders ready at kitchens...</p>
                    </div>
                  ) : (
                    availableOrders.map(order => (
                      <div key={order.id} className="dp-request-card">
                        <div className="dp-req-top">
                          <span className="dp-req-restaurant">{order.restaurantName}</span>
                          <span className="dp-req-earn">{fmtCurrency((order.total * 0.1).toFixed(0))}</span>
                        </div>
                        <div className="dp-req-row">
                          <div className="sa-donut-dot dp-toggle-dot" style={{ background: 'var(--dp-green)', marginTop: 4 }} />
                          <div className="dp-req-info">
                            <span className="dp-req-lbl">Order</span>
                            <span className="dp-req-val">#{order.id}</span>
                          </div>
                          <div className="dp-req-info" style={{ flex: 2 }}>
                            <span className="dp-req-lbl">Dropoff</span>
                            <span className="dp-req-val">{order.address?.split(',')[0]}</span>
                          </div>
                        </div>
                        <button 
                          className="dp-accept-btn"
                          onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                        >
                          ⚡ Accept Delivery Request
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="dp-section-pad">
              <div className="dp-earnings-hero">
                <div className="dp-earnings-label">Lifetime Earnings</div>
                <div className="dp-earnings-value">{fmtCurrency(totalEarnings.toFixed(0))}</div>
                <div className="dp-earnings-sub">Base pay + 10% platform order sharing</div>
              </div>

              <div className="dp-section-title">Earning Summary</div>
              <div className="dp-earnings-grid">
                <div className="dp-earn-card">
                  <div className="dp-earn-icon">📦</div>
                  <div className="dp-earn-val">{completedOrders.length}</div>
                  <div className="dp-earn-lbl">Completed Trips</div>
                </div>
                <div className="dp-earn-card">
                  <div className="dp-earn-icon">⛽</div>
                  <div className="dp-earn-val">{fmtCurrency((completedOrders.length * 15).toFixed(0))}</div>
                  <div className="dp-earn-lbl">Fuel Allowance</div>
                </div>
              </div>

              <div className="dp-section-title">Trip History</div>
              <div className="dp-deliveries-list">
                {completedOrders.length === 0 ? (
                  <div className="rp-empty" style={{ padding: '20px 0' }}>No completed orders in this shift.</div>
                ) : (
                  completedOrders.map(o => (
                    <div key={o.id} className="dp-delivery-row">
                      <div className="dp-delivery-icon">🏁</div>
                      <div className="dp-delivery-info">
                        <div className="dp-delivery-rest">{o.restaurantName}</div>
                        <div className="dp-delivery-time">Completed order #{o.id}</div>
                      </div>
                      <div className="dp-delivery-amount">+{fmtCurrency((o.total * 0.1).toFixed(0))}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <div className="dp-profile-hero">
                <div className="dp-profile-avatar">{deliveryAgent.avatar}</div>
                <div className="dp-profile-name">{deliveryAgent.name}</div>
                <div className="dp-profile-id">Eatzo Partner ID: {deliveryAgent.id}</div>
                <div className="dp-rating-badge">★ {deliveryAgent.rating || '4.8'} Rated Partner</div>
              </div>

              <div className="dp-profile-stats">
                <div className="dp-pstat">
                  <div className="dp-pstat-val" style={{ color: 'var(--dp-green)' }}>
                    {deliveryAgent.totalDeliveries || '342'}
                  </div>
                  <div className="dp-pstat-lbl">Lifetime Trips</div>
                </div>
                <div className="dp-pstat">
                  <div className="dp-pstat-val" style={{ color: 'var(--dp-teal)' }}>
                    Active
                  </div>
                  <div className="dp-pstat-lbl">Duty Status</div>
                </div>
                <div className="dp-pstat">
                  <div className="dp-pstat-val" style={{ color: '#FF9800' }}>
                    Bike
                  </div>
                  <div className="dp-pstat-lbl">Vehicle</div>
                </div>
              </div>

              <div className="dp-profile-rows">
                <div className="dp-profile-row">
                  <div className="dp-profile-row-icon">📞</div>
                  <div>
                    <div className="dp-profile-row-label">Registered Mobile</div>
                    <div className="dp-profile-row-value">{deliveryAgent.phone || '+91 98765 43210'}</div>
                  </div>
                </div>
                <div className="dp-profile-row">
                  <div className="dp-profile-row-icon">🏍️</div>
                  <div>
                    <div className="dp-profile-row-label">Vehicle Details</div>
                    <div className="dp-profile-row-value">{deliveryAgent.vehicleNo || 'DL 01 AB 1234'}</div>
                  </div>
                </div>
                <div className="dp-profile-row">
                  <div className="dp-profile-row-icon">🛡️</div>
                  <div>
                    <div className="dp-profile-row-label">Background Status</div>
                    <div className="dp-profile-row-value" style={{ color: 'var(--dp-green)' }}>Verified Partner</div>
                  </div>
                </div>

                <button 
                  className="dp-logout-pill"
                  onClick={() => { deliveryLogout(); navigate('/delivery'); }}
                >
                  🚪 End Shift & Logout
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ── Bottom Nav Tab Bar ── */}
        <footer className="sa-sidebar-footer dp-tabbar">
          <button 
            className={`dp-tab-btn ${activeTab === 'home' ? 'dp-tab-active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <div className="dp-tab-icon-wrap">
              <span className="dp-tab-icon">🛵</span>
              {availableOrders.length > 0 && activeTab !== 'home' && (
                <span className="dp-tab-badge">{availableOrders.length}</span>
              )}
            </div>
            <span>Home</span>
          </button>
          <button 
            className={`dp-tab-btn ${activeTab === 'earnings' ? 'dp-tab-active' : ''}`}
            onClick={() => setActiveTab('earnings')}
          >
            <span className="dp-tab-icon">💰</span>
            <span>Earnings</span>
          </button>
          <button 
            className={`dp-tab-btn ${activeTab === 'profile' ? 'dp-tab-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="dp-tab-icon">👤</span>
            <span>Profile</span>
          </button>
        </footer>

      </div>
    </div>
  );
}
