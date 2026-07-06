import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { api } from '../../services/api';
import { notificationService } from '../../services/notificationService';
import './Admin.css';

const BASE = 'http://localhost:5000/api';

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}
function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

// ── Live Orders Tab ────────────────────────────────────────
function LiveOrdersTab({ orders, onStatusChange }) {
  const newOrders    = orders.filter(o => o.status === 'placed');
  const confirmed    = orders.filter(o => o.status === 'confirmed');
  const preparing    = orders.filter(o => o.status === 'preparing');
  const ready        = orders.filter(o => o.status === 'ready_for_pickup');
  const liveOrders   = [...newOrders, ...confirmed, ...preparing];
  const handedOrders = [...ready, ...orders.filter(o => ['out_for_delivery','delivered'].includes(o.status))].slice(0,10);

  const OrderCard = ({ order, isNew }) => (
    <div className={`rp-order-card ${isNew ? 'rp-new-order' : ''}`}>
      <div className="rp-order-head">
        <span className="rp-order-id">#{order.id}</span>
        <span className="rp-order-time">{fmtTime(order.createdAt)}</span>
      </div>
      <div className="rp-order-items">
        {order.items?.map((item, i) => (
          <div key={i}>• {item.qty}× {item.name} <span style={{color:'#555',fontSize:'0.78rem'}}>₹{item.price * item.qty}</span></div>
        ))}
      </div>
      <div className="rp-order-addr">📍 {order.address}</div>
      {order.receiverPhone && <div className="rp-order-phone">📞 {order.receiverPhone}</div>}
      <div className="rp-order-total">Total: ₹{order.total}</div>
      <div className="rp-order-actions">
        {order.status === 'placed' && (
          <>
            <button className="rp-btn-accept"  onClick={() => onStatusChange(order.id, 'confirmed')}>✅ Accept Order</button>
            <button className="rp-btn-cancel"  onClick={() => onStatusChange(order.id, 'cancelled')}>✕ Reject</button>
          </>
        )}
        {order.status === 'confirmed' && (
          <button className="rp-btn-prepare" onClick={() => onStatusChange(order.id, 'preparing')}>👨‍🍳 Start Preparing</button>
        )}
        {order.status === 'preparing' && (
          <button className="rp-btn-ready"   onClick={() => onStatusChange(order.id, 'ready_for_pickup')}>📦 Mark Ready for Pickup</button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Stats row */}
      <div className="rp-stats-row">
        <div className="rp-stat-card">
          <div className="rp-stat-icon">🔔</div>
          <div className="rp-stat-val" style={{color:'#FF6B35'}}>{newOrders.length}</div>
          <div className="rp-stat-lbl">New Orders</div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon">👨‍🍳</div>
          <div className="rp-stat-val" style={{color:'#ff9800'}}>{preparing.length + confirmed.length}</div>
          <div className="rp-stat-lbl">In Kitchen</div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon">📦</div>
          <div className="rp-stat-val" style={{color:'#4caf50'}}>{ready.length}</div>
          <div className="rp-stat-lbl">Ready for Pickup</div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon">📊</div>
          <div className="rp-stat-val">{orders.length}</div>
          <div className="rp-stat-lbl">Total Today</div>
        </div>
      </div>

      <div className="rp-orders-col-wrap">
        {/* Active orders */}
        <div className="rp-orders-col">
          <div className="rp-col-title">
            🔔 New &amp; Active Orders
            {liveOrders.length > 0 && <span className="rp-nav-badge" style={{marginLeft:'auto'}}>{liveOrders.length}</span>}
          </div>
          {liveOrders.length === 0
            ? <div className="rp-empty">✅ No active orders right now</div>
            : liveOrders.map(o => <OrderCard key={o.id} order={o} isNew={o.status==='placed'} />)
          }
        </div>

        {/* Handed over / delivered */}
        <div className="rp-orders-col">
          <div className="rp-col-title">✅ Handed Over / Delivered</div>
          {handedOrders.length === 0
            ? <div className="rp-empty">No completed orders yet</div>
            : handedOrders.map(o => (
                <div key={o.id} className="rp-order-card">
                  <div className="rp-order-head">
                    <span className="rp-order-id">#{o.id}</span>
                    <span className={`rp-status-badge ${o.status}`}>{o.status.replace(/_/g,' ')}</span>
                  </div>
                  <div className="rp-order-items">
                    {o.items?.map((item,i)=><div key={i}>• {item.qty}× {item.name}</div>)}
                  </div>
                  <div className="rp-order-total">Total: ₹{o.total}</div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

// ── Menu Manager Tab ───────────────────────────────────────
function MenuManagerTab({ restaurantId, menu, onRefresh }) {
  const blankItem = { name:'', price:'', category:'', isVeg:true, description:'' };
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null); // null = add mode, object = edit mode
  const [form, setForm]         = useState(blankItem);
  const [saving, setSaving]     = useState(false);

  const openAdd  = () => { setForm(blankItem); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ name: item.name, price: item.price, category: item.category, isVeg: item.isVeg, description: item.description || '' });
    setEditItem(item);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' };
      if (editItem) {
        await fetch(`${BASE}/menu/${restaurantId}/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${BASE}/menu/${restaurantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await onRefresh();
      closeForm();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await fetch(`${BASE}/menu/${restaurantId}/${itemId}`, { method: 'DELETE' });
      await onRefresh();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="rp-menu-topbar">
        <span style={{color:'#888',fontSize:'0.88rem'}}>{menu.length} items in your menu</span>
        <button className="rp-btn-add-item" onClick={openAdd}>+ Add New Item</button>
      </div>

      {showForm && (
        <form className="rp-menu-form" onSubmit={handleSave}>
          <div className="rp-field">
            <label>Item Name *</label>
            <input type="text" placeholder="e.g. Butter Chicken" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
          </div>
          <div className="rp-field">
            <label>Price (₹) *</label>
            <input type="number" placeholder="e.g. 280" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required min="1" />
          </div>
          <div className="rp-field">
            <label>Category *</label>
            <input type="text" placeholder="e.g. Main Course, Starters..." value={form.category} onChange={e=>setForm({...form,category:e.target.value})} required />
          </div>
          <div className="rp-field">
            <label>Dietary Type</label>
            <select value={form.isVeg ? 'veg' : 'nonveg'} onChange={e=>setForm({...form,isVeg:e.target.value==='veg'})}>
              <option value="veg">🟢 Vegetarian</option>
              <option value="nonveg">🔴 Non-Vegetarian</option>
            </select>
          </div>
          <div className="rp-field full">
            <label>Description</label>
            <textarea placeholder="Brief description of this dish..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          </div>
          <div className="rp-form-actions">
            <button type="button" className="rp-btn-cancel-form" onClick={closeForm}>Cancel</button>
            <button type="submit" className="rp-btn-save" disabled={saving}>
              {saving ? 'Saving...' : editItem ? '✏️ Update Item' : '+ Add Item'}
            </button>
          </div>
        </form>
      )}

      <div className="rp-menu-grid">
        {menu.map(item => (
          <div key={item.id} className="rp-menu-card">
            <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} alt={item.name} />
            <div className="rp-menu-card-body">
              <div className="rp-menu-card-top">
                <div className={item.isVeg ? 'rp-veg-dot' : 'rp-nonveg-dot'} title={item.isVeg ? 'Veg' : 'Non-Veg'} />
                <span className="rp-menu-price">₹{item.price}</span>
              </div>
              <div className="rp-menu-name">{item.name}</div>
              <span className="rp-menu-cat">{item.category}</span>
              {item.description && <div className="rp-menu-desc">{item.description}</div>}
              <div className="rp-menu-actions">
                <button className="rp-btn-edit"   onClick={() => openEdit(item)}>✏️ Edit</button>
                <button className="rp-btn-delete" onClick={() => handleDelete(item.id)}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        ))}
        {menu.length === 0 && <div style={{color:'#555',gridColumn:'1/-1',textAlign:'center',padding:40}}>No menu items yet. Add your first item!</div>}
      </div>
    </div>
  );
}

// ── Order History Tab ──────────────────────────────────────
function OrderHistoryTab({ orders }) {
  const [search, setSearch] = useState('');
  const past = orders
    .filter(o => ['ready_for_pickup','out_for_delivery','delivered','cancelled'].includes(o.status))
    .filter(o => o.id?.toLowerCase().includes(search.toLowerCase()) || o.userId?.toLowerCase().includes(search.toLowerCase()))
    .slice().reverse();

  return (
    <div className="rp-table-wrap">
      <div className="rp-table-header">
        <h3>Order History ({past.length})</h3>
        <input className="rp-search" placeholder="🔍  Search by Order ID or User..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      <table className="rp-table">
        <thead>
          <tr><th>Order ID</th><th>Items</th><th>Total</th><th>Address</th><th>Status</th><th>Time</th></tr>
        </thead>
        <tbody>
          {past.map(o => (
            <tr key={o.id}>
              <td><span style={{fontFamily:'monospace',color:'#FF6B35',fontWeight:700}}>#{o.id}</span></td>
              <td style={{fontSize:'0.82rem',color:'#ccc'}}>
                {o.items?.slice(0,2).map(i=>`${i.qty}× ${i.name}`).join(', ')}
                {o.items?.length > 2 && ` +${o.items.length-2} more`}
              </td>
              <td style={{fontWeight:700}}>₹{o.total}</td>
              <td style={{color:'#888',fontSize:'0.78rem',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.address}</td>
              <td><span className={`rp-status-badge ${o.status}`}>{o.status.replace(/_/g,' ')}</span></td>
              <td style={{color:'#666',fontSize:'0.78rem',whiteSpace:'nowrap'}}>{fmtDate(o.createdAt)}</td>
            </tr>
          ))}
          {past.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'#555'}}>No order history yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ── Restaurant Settings Tab ────────────────────────────────
function SettingsTab({ restaurantData, restaurantId, onUpdate }) {
  const [form, setForm]   = useState({
    name:         restaurantData?.name         || '',
    address:      restaurantData?.address      || '',
    deliveryTime: restaurantData?.deliveryTime || '',
    minOrder:     restaurantData?.minOrder     || '',
    deliveryFee:  restaurantData?.deliveryFee  || '',
    discount:     restaurantData?.discount     || '',
  });
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync form if restaurantData changes
  useEffect(() => {
    if (restaurantData) {
      setForm({
        name:         restaurantData.name         || '',
        address:      restaurantData.address      || '',
        deliveryTime: restaurantData.deliveryTime || '',
        minOrder:     restaurantData.minOrder     || '',
        deliveryFee:  restaurantData.deliveryFee  || '',
        discount:     restaurantData.discount     || '',
      });
    }
  }, [restaurantData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // We use the restaurant status endpoint to update basic info
      // For this demo, we patch what the backend supports (isOpen toggle)
      // Additional fields update locally
      setSaved(true);
      onUpdate({ ...restaurantData, ...form, minOrder: Number(form.minOrder), deliveryFee: Number(form.deliveryFee) });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  return (
    <div className="rp-settings-card">
      <h3>⚙️ Restaurant Settings</h3>
      <form onSubmit={handleSave}>
        <div className="rp-settings-grid">
          <div className="rp-field full">
            <label>Restaurant Name</label>
            <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          </div>
          <div className="rp-field full">
            <label>Address</label>
            <input type="text" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} />
          </div>
          <div className="rp-field">
            <label>Delivery Time (e.g. 30-35 min)</label>
            <input type="text" value={form.deliveryTime} onChange={e=>setForm({...form,deliveryTime:e.target.value})} />
          </div>
          <div className="rp-field">
            <label>Minimum Order (₹)</label>
            <input type="number" value={form.minOrder} onChange={e=>setForm({...form,minOrder:e.target.value})} min="0" />
          </div>
          <div className="rp-field">
            <label>Delivery Fee (₹)</label>
            <input type="number" value={form.deliveryFee} onChange={e=>setForm({...form,deliveryFee:e.target.value})} min="0" />
          </div>
          <div className="rp-field">
            <label>Discount Text</label>
            <input type="text" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})} placeholder="e.g. 20% OFF up to ₹100" />
          </div>
        </div>
        <div className="rp-settings-actions">
          <button type="submit" className="rp-btn-save-settings" disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
          {saved && <span className="rp-saved-msg">✅ Settings saved!</span>}
        </div>
      </form>
    </div>
  );
}

// ── Main Partner Dashboard ─────────────────────────────────
const TABS = [
  { key:'orders',   label:'Live Orders',    icon:'🔔' },
  { key:'menu',     label:'Menu Manager',   icon:'🍽️' },
  { key:'history',  label:'Order History',  icon:'📋' },
  { key:'settings', label:'My Restaurant',  icon:'⚙️' },
];

export default function PartnerDashboard() {
  const { adminUser, restaurantData, setRestaurantData, adminLogout } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders]       = useState([]);
  const [menu, setMenu]           = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!adminUser) { navigate('/partner'); return; }
    loadData();
    const iv = setInterval(loadData, 5000);
    return () => clearInterval(iv);
  }, [adminUser, navigate]);

  const loadData = useCallback(async () => {
    try {
      const [orderRes, menuRes] = await Promise.all([
        fetch(`${BASE}/orders/restaurant/${adminUser.id}`).then(r=>r.json()),
        api.getMenu(adminUser.id),
      ]);
      if (orderRes.success) {
        const newOrdersList = orderRes.data;
        setOrders(prevOrders => {
          const prevPlaced = prevOrders.filter(o => o.status === 'placed');
          const newPlaced = newOrdersList.filter(o => o.status === 'placed');
          if (newPlaced.length > prevPlaced.length && prevOrders.length > 0) {
            const latest = newPlaced[newPlaced.length - 1];
            notificationService.sendNotification('🔔 New Order Received!', {
              body: `Order #${latest.id} has been placed. Tap to accept and prepare!`,
              tag: `new-order-${latest.id}`,
            });
          }
          return newOrdersList.slice().reverse();
        });
      }
      if (menuRes.success) setMenu(menuRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [adminUser]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await fetch(`${BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (err) { console.error(err); }
  };

  const toggleOpen = async () => {
    const newStatus = !restaurantData.isOpen;
    try {
      const res = await fetch(`${BASE}/restaurants/${adminUser.id}/status`, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ isOpen: newStatus }),
      });
      const data = await res.json();
      if (data.success) setRestaurantData(data.data);
    } catch (err) { console.error(err); }
  };

  const newOrderCount = orders.filter(o => o.status === 'placed').length;
  const liveCount     = orders.filter(o => ['placed','confirmed','preparing'].includes(o.status)).length;

  if (!restaurantData || loading) {
    return (
      <div className="rp-app" style={{alignItems:'center',justifyContent:'center'}}>
        <div style={{color:'#888'}}>Loading your dashboard…</div>
      </div>
    );
  }

  return (
    <div className="rp-app">
      {/* ── Sidebar ── */}
      <aside className="rp-sidebar">
        <div className="rp-sidebar-brand">
          <div className="rp-brand-icon">🍽️</div>
          <div>
            <h2>Partner Portal</h2>
            <p>Restaurant Dashboard</p>
          </div>
        </div>

        {/* Restaurant info */}
        <div className="rp-res-info">
          <img src={restaurantData.image} alt={restaurantData.name} className="rp-res-img" />
          <div className="rp-res-name">{restaurantData.name}</div>
          <div className="rp-res-addr">{restaurantData.address?.split(',').slice(-2).join(',')}</div>
          <div className="rp-status-toggle">
            <span className="rp-status-label">{restaurantData.isOpen ? '🟢 Accepting Orders' : '🔴 Closed'}</span>
            <label className="rp-switch">
              <input type="checkbox" checked={!!restaurantData.isOpen} onChange={toggleOpen} />
              <span className="rp-slider" />
            </label>
          </div>
        </div>

        {/* Nav */}
        <nav className="rp-nav">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`rp-nav-btn ${activeTab===t.key?'rp-active':''}`}
              onClick={() => setActiveTab(t.key)}
            >
              <span className="rp-nav-icon">{t.icon}</span>
              {t.label}
              {t.key==='orders' && liveCount > 0 && (
                <span className="rp-nav-badge">{liveCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="rp-sidebar-footer">
          <button className="rp-logout-btn" onClick={() => { adminLogout(); navigate('/partner'); }}>
            🚪 Log Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="rp-main">
        <header className="rp-topbar">
          <h2>{TABS.find(t=>t.key===activeTab)?.icon} {TABS.find(t=>t.key===activeTab)?.label}</h2>
          {activeTab === 'orders' && liveCount > 0 && (
            <span className="rp-live-badge">
              <span className="rp-live-dot" /> LIVE · {liveCount} active
            </span>
          )}
        </header>

        <div className="rp-content">
          {activeTab === 'orders'   && (
            <LiveOrdersTab orders={orders} onStatusChange={updateOrderStatus} />
          )}
          {activeTab === 'menu'     && (
            <MenuManagerTab restaurantId={adminUser.id} menu={menu} onRefresh={loadData} />
          )}
          {activeTab === 'history'  && (
            <OrderHistoryTab orders={orders} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab restaurantData={restaurantData} restaurantId={adminUser.id} onUpdate={setRestaurantData} />
          )}
        </div>
      </main>
    </div>
  );
}
