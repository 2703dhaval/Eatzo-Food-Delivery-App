import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import './SuperAdmin.css';

const BASE = 'http://localhost:5000/api';
const STATUS_ORDER = ['placed','confirmed','preparing','ready_for_pickup','out_for_delivery','delivered','cancelled'];

function fmtCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}
function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ icon, value, label, accent }) {
  return (
    <div className="sa-stat-card" style={{ '--card-accent': accent }}>
      <div className="sa-stat-icon">{icon}</div>
      <div className="sa-stat-value">{value}</div>
      <div className="sa-stat-label">{label}</div>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────
function OverviewTab({ restaurants, orders, agents }) {
  const totalRevenue   = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders  = orders.filter(o => ['placed','confirmed','preparing'].includes(o.status)).length;
  const onlineRests    = restaurants.filter(r => r.isOpen).length;
  const onlineAgents   = agents.filter(a => a.isOnline).length;

  const statusCounts = STATUS_ORDER.map(s => ({
    status: s,
    count: orders.filter(o => o.status === s).length,
    colors: { placed:'#ffc107', confirmed:'#818cf8', preparing:'#ff9800', ready_for_pickup:'#64b5f6', out_for_delivery:'#ce93d8', delivered:'#81c784', cancelled:'#f85149' }
  }));

  const restOrderMap = {};
  orders.forEach(o => { restOrderMap[o.restaurantName] = (restOrderMap[o.restaurantName] || 0) + 1; });
  const topRests = Object.entries(restOrderMap).sort((a,b) => b[1]-a[1]).slice(0,5);
  const maxOrders = topRests[0]?.[1] || 1;

  return (
    <div>
      <div className="sa-stats-grid">
        <StatCard icon="🏪" value={restaurants.length} label="Total Restaurants" accent="#5865f2" />
        <StatCard icon="📦" value={orders.length}       label="Total Orders"      accent="#ff9800" />
        <StatCard icon="💰" value={fmtCurrency(totalRevenue)} label="Platform Revenue" accent="#81c784" />
        <StatCard icon="⏳" value={pendingOrders}        label="Pending Orders"   accent="#f85149" />
        <StatCard icon="🟢" value={`${onlineRests}/${restaurants.length}`} label="Restaurants Online" accent="#5865f2" />
        <StatCard icon="🛵" value={`${onlineAgents}/${agents.length}`}     label="Agents Online"      accent="#a78bfa" />
      </div>

      <div className="sa-analytics-grid">
        <div className="sa-analytics-card">
          <h3>Orders by Status</h3>
          <div className="sa-donut-row">
            {statusCounts.filter(s => s.count > 0).map(s => (
              <div key={s.status} className="sa-donut-item">
                <div className="sa-donut-dot" style={{ background: s.colors[s.status] }} />
                <span className="sa-donut-name">{s.status.replace(/_/g,' ')}</span>
                <div className="sa-donut-bar-wrap">
                  <div className="sa-donut-bar-fill" style={{ width: `${Math.max((s.count/Math.max(orders.length,1))*100,4)}%`, background: s.colors[s.status] }} />
                </div>
                <span className="sa-donut-val">{s.count}</span>
              </div>
            ))}
            {orders.length === 0 && <p className="sa-empty">No orders yet</p>}
          </div>
        </div>

        <div className="sa-analytics-card">
          <h3>Top Restaurants by Orders</h3>
          <div className="sa-donut-row">
            {topRests.map(([name, count], i) => {
              const cols = ['#5865f2','#ff9800','#81c784','#f85149','#a78bfa'];
              return (
                <div key={name} className="sa-donut-item">
                  <div className="sa-donut-dot" style={{ background: cols[i] }} />
                  <span className="sa-donut-name" style={{fontSize:'0.78rem'}}>{name}</span>
                  <div className="sa-donut-bar-wrap">
                    <div className="sa-donut-bar-fill" style={{ width: `${(count/maxOrders)*100}%`, background: cols[i] }} />
                  </div>
                  <span className="sa-donut-val">{count}</span>
                </div>
              );
            })}
            {topRests.length === 0 && <p className="sa-empty">No order data yet</p>}
          </div>
        </div>
      </div>

      {/* Quick Summary Lists */}
      <div className="sa-analytics-grid" style={{ marginTop: 24 }}>
        <div className="sa-analytics-card">
          <h3>Quick Restaurants List ({restaurants.length})</h3>
          <div className="sa-donut-row" style={{ gap: 14 }}>
            {restaurants.slice(0, 5).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #21262d', paddingBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={r.image} alt={r.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{r.name}</div>
                    <div style={{ color: '#8b949e', fontSize: '0.72rem' }}>{r.cuisine}</div>
                  </div>
                </div>
                <span className={`sa-badge ${r.isOpen ? 'open' : 'closed'}`} style={{ fontSize: '0.65rem' }}>
                  {r.isOpen ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
            ))}
            {restaurants.length === 0 && <p className="sa-empty">No restaurants registered yet</p>}
          </div>
        </div>

        <div className="sa-analytics-card">
          <h3>Quick Delivery Partners ({agents.length})</h3>
          <div className="sa-donut-row" style={{ gap: 14 }}>
            {agents.slice(0, 5).map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #21262d', paddingBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.2rem' }}>{a.avatar}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{a.name}</div>
                    <div style={{ color: '#8b949e', fontSize: '0.72rem' }}>{a.vehicle} · {a.phone}</div>
                  </div>
                </div>
                <span className={`sa-badge ${a.isOnline ? 'online' : 'offline'}`} style={{ fontSize: '0.65rem' }}>
                  {a.isOnline ? '🟢 Duty' : '⚫ Off'}
                </span>
              </div>
            ))}
            {agents.length === 0 && <p className="sa-empty">No delivery staff registered yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Restaurants Tab (Manage Restaurants + Add + Delete) ────
function RestaurantsTab({ restaurants, onToggle, onAdd, onDelete }) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: '', cuisine: '', category: 'Indian', address: '', minOrder: '100', deliveryFee: '30', discount: '10% OFF', image: '', lat: '', lng: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(form);
    setForm({ name: '', cuisine: '', category: 'Indian', address: '', minOrder: '100', deliveryFee: '30', discount: '10% OFF', image: '', lat: '', lng: '' });
    setShowAddForm(false);
  };

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <button className="sa-btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Close Form' : '➕ Add Restaurant'}
        </button>
      </div>

      {showAddForm && (
        <form className="sa-form-card" onSubmit={handleSubmit}>
          <h4>Add New Restaurant</h4>
          <div className="sa-form-grid">
            <div className="sa-field">
              <label>Restaurant Name *</label>
              <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="e.g. Burger Point" />
            </div>
            <div className="sa-field">
              <label>Cuisine *</label>
              <input type="text" value={form.cuisine} onChange={e=>setForm({...form,cuisine:e.target.value})} required placeholder="e.g. Fast Food, Burgers" />
            </div>
            <div className="sa-field">
              <label>Category</label>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                <option value="Indian">Indian</option>
                <option value="Chinese">Chinese</option>
                <option value="Burgers">Burgers</option>
                <option value="Desserts">Desserts</option>
              </select>
            </div>
            <div className="sa-field">
              <label>Address *</label>
              <input type="text" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} required placeholder="e.g. Connaught Place, New Delhi" />
            </div>
            <div className="sa-field">
              <label>Min Order (₹)</label>
              <input type="number" value={form.minOrder} onChange={e=>setForm({...form,minOrder:e.target.value})} />
            </div>
            <div className="sa-field">
              <label>Delivery Fee (₹)</label>
              <input type="number" value={form.deliveryFee} onChange={e=>setForm({...form,deliveryFee:e.target.value})} />
            </div>
            <div className="sa-field">
              <label>Discount Text</label>
              <input type="text" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})} placeholder="e.g. 20% OFF" />
            </div>
            <div className="sa-field">
              <label>Image URL</label>
              <input type="text" value={form.image} onChange={e=>setForm({...form,image:e.target.value})} placeholder="Leave blank for default" />
            </div>
          </div>
          <div className="sa-form-actions">
            <button type="button" className="sa-btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="sa-btn-primary">Add Restaurant</button>
          </div>
        </form>
      )}

      <div className="sa-table-wrap">
        <div className="sa-table-header">
          <h3>All Restaurants ({restaurants.length})</h3>
          <input className="sa-search" placeholder="🔍  Search by name or cuisine..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Restaurant</th><th>Cuisine</th><th>Rating</th><th>Category</th><th>Min Order</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <img src={r.image} alt={r.name} style={{width:36,height:36,borderRadius:8,objectFit:'cover',flexShrink:0}} />
                    <div>
                      <div style={{fontWeight:700,fontSize:'0.88rem'}}>{r.name}</div>
                      <div style={{color:'#8b949e',fontSize:'0.75rem'}}>{r.address?.split(',').slice(-2).join(',')}</div>
                    </div>
                  </div>
                </td>
                <td style={{color:'#c9d1d9',fontSize:'0.84rem'}}>{r.cuisine}</td>
                <td><span style={{color:'#ffc107',fontWeight:700}}>★ {r.rating}</span></td>
                <td><span className="sa-badge" style={{background:'rgba(88,101,242,0.1)',color:'#818cf8',border:'1px solid rgba(88,101,242,0.3)'}}>{r.category}</span></td>
                <td style={{color:'#8b949e',fontSize:'0.84rem'}}>₹{r.minOrder}</td>
                <td><span className={`sa-badge ${r.isOpen?'open':'closed'}`}>{r.isOpen?'🟢 Open':'🔴 Closed'}</span></td>
                <td>
                  <div className="sa-action-cell">
                    <button
                      className={`sa-toggle-btn ${r.isOpen?'open':'closed'}`}
                      onClick={() => onToggle(r.id, !r.isOpen)}
                    >
                      {r.isOpen ? 'Close' : 'Open'}
                    </button>
                    <button className="sa-btn-delete" onClick={() => onDelete(r.id)}>🗑️ Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="sa-empty">No restaurants match your search.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── All Orders Tab ─────────────────────────────────────────
function AllOrdersTab({ orders }) {
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]         = useState(1);
  const PER_PAGE = 15;

  const filtered = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o =>
      o.id?.toLowerCase().includes(search.toLowerCase()) ||
      o.restaurantName?.toLowerCase().includes(search.toLowerCase()) ||
      o.userId?.toLowerCase().includes(search.toLowerCase())
    );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const statusFilters = ['all', ...STATUS_ORDER];

  return (
    <div>
      <div className="sa-filters">
        {statusFilters.map(s => (
          <button key={s} className={`sa-filter-btn ${statusFilter===s?'sa-filter-active':''}`} onClick={()=>{ setStatusFilter(s); setPage(1); }}>
            {s === 'all' ? `All (${orders.length})` : `${s.replace(/_/g,' ')} (${orders.filter(o=>o.status===s).length})`}
          </button>
        ))}
      </div>

      <div className="sa-table-wrap">
        <div className="sa-table-header">
          <h3>Orders ({filtered.length})</h3>
          <input className="sa-search" placeholder="🔍  Search by Order ID, Restaurant, User..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} />
        </div>
        <table className="sa-table">
          <thead>
            <tr><th>Order ID</th><th>Restaurant</th><th>User ID</th><th>Items</th><th>Total</th><th>Address</th><th>Status</th><th>Time</th></tr>
          </thead>
          <tbody>
            {paged.map(o => (
              <tr key={o.id}>
                <td><span style={{fontFamily:'monospace',color:'#818cf8',fontWeight:700}}>#{o.id}</span></td>
                <td style={{fontWeight:600,fontSize:'0.86rem'}}>{o.restaurantName}</td>
                <td style={{color:'#8b949e',fontSize:'0.82rem'}}>{o.userId}</td>
                <td style={{color:'#c9d1d9',fontSize:'0.82rem'}}>
                  {o.items?.slice(0,2).map(i=>`${i.qty}× ${i.name}`).join(', ')}
                  {o.items?.length > 2 && ` +${o.items.length-2} more`}
                </td>
                <td style={{fontWeight:700,color:'#e6edf3'}}>{fmtCurrency(o.total)}</td>
                <td style={{color:'#8b949e',fontSize:'0.78rem',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.address}</td>
                <td><span className={`sa-badge ${o.status}`}>{o.status?.replace(/_/g,' ')}</span></td>
                <td style={{color:'#8b949e',fontSize:'0.78rem',whiteSpace:'nowrap'}}>{fmtDate(o.createdAt)}</td>
              </tr>
            ))}
            {paged.length === 0 && <tr><td colSpan={8} className="sa-empty">No orders found.</td></tr>}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="sa-pagination">
            <span className="sa-page-info">Page {page} of {totalPages}</span>
            {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
              <button key={p} className={`sa-page-btn ${p===page?'sa-page-active':''}`} onClick={()=>setPage(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Delivery Agents Tab (Manage Staff + Add + Delete) ──────
function AgentsTab({ agents, onToggleAgent, onAdd, onDelete }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', vehicle: 'Bike', vehicleNo: '', password: 'delivery123'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(form);
    setForm({ name: '', phone: '', vehicle: 'Bike', vehicleNo: '', password: 'delivery123' });
    setShowAddForm(false);
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <button className="sa-btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Close Form' : '➕ Add Delivery Agent'}
        </button>
      </div>

      {showAddForm && (
        <form className="sa-form-card" onSubmit={handleSubmit}>
          <h4>Add New Delivery Agent (Staff)</h4>
          <div className="sa-form-grid">
            <div className="sa-field">
              <label>Agent Name *</label>
              <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="e.g. Ramesh Kumar" />
            </div>
            <div className="sa-field">
              <label>Phone Number *</label>
              <input type="text" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required placeholder="e.g. 9876543210" />
            </div>
            <div className="sa-field">
              <label>Vehicle Type *</label>
              <select value={form.vehicle} onChange={e=>setForm({...form,vehicle:e.target.value})}>
                <option value="Bike">🏍️ Bike</option>
                <option value="Scooter">🛵 Scooter</option>
                <option value="Bicycle">🚴 Bicycle</option>
              </select>
            </div>
            <div className="sa-field">
              <label>Vehicle Number</label>
              <input type="text" value={form.vehicleNo} onChange={e=>setForm({...form,vehicleNo:e.target.value})} placeholder="e.g. DL 01 AB 1234" />
            </div>
            <div className="sa-field">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Default: delivery123" />
            </div>
          </div>
          <div className="sa-form-actions">
            <button type="button" className="sa-btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="sa-btn-primary">Add Agent</button>
          </div>
        </form>
      )}

      <div className="sa-table-wrap">
        <div className="sa-table-header">
          <h3>Delivery Agents ({agents.length})</h3>
          <span style={{color:'#8b949e',fontSize:'0.82rem'}}>
            {agents.filter(a=>a.isOnline).length} online · {agents.filter(a=>!a.isOnline).length} offline
          </span>
        </div>
        <table className="sa-table">
          <thead>
            <tr><th>Agent</th><th>Vehicle</th><th>Phone</th><th>Rating</th><th>Deliveries</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:'1.6rem'}}>{a.avatar}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:'0.88rem'}}>{a.name}</div>
                      <div style={{color:'#8b949e',fontSize:'0.75rem'}}>{a.id}</div>
                    </div>
                  </div>
                </td>
                <td><span style={{color:'#c9d1d9',fontSize:'0.84rem'}}>{a.vehicle} · {a.vehicleNo}</span></td>
                <td style={{color:'#8b949e',fontSize:'0.84rem'}}>{a.phone}</td>
                <td><span style={{color:'#ffc107',fontWeight:700}}>★ {a.rating}</span></td>
                <td style={{fontWeight:700}}>{a.totalDeliveries}</td>
                <td><span className={`sa-badge ${a.isOnline?'online':'offline'}`}>{a.isOnline?'🟢 Online':'⚫ Offline'}</span></td>
                <td>
                  <div className="sa-action-cell">
                    <button
                      className={`sa-toggle-btn ${a.isOnline?'open':'closed'}`}
                      onClick={() => onToggleAgent(a.id, !a.isOnline)}
                    >
                      {a.isOnline ? 'Set Offline' : 'Set Online'}
                    </button>
                    <button className="sa-btn-delete" onClick={() => onDelete(a.id)}>🗑️ Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Analytics Tab ──────────────────────────────────────────
function AnalyticsTab({ orders, restaurants }) {
  const days = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const revenueByDay = days.map(day => ({
    day: day.slice(5), // MM-DD
    revenue: orders
      .filter(o => o.status==='delivered' && o.createdAt?.startsWith(day))
      .reduce((s,o)=>s+(o.total||0),0)
  }));
  const maxRev = Math.max(...revenueByDay.map(d=>d.revenue), 1);

  const catMap = {};
  restaurants.forEach(r => { catMap[r.category] = (catMap[r.category]||0)+1; });
  const catEntries = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const catColors = ['#5865f2','#ff9800','#81c784','#f85149','#a78bfa','#64b5f6'];

  return (
    <div className="sa-analytics-grid" style={{gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div className="sa-analytics-card">
        <h3>Revenue — Last 7 Days</h3>
        <div className="sa-bar-chart">
          {revenueByDay.map((d,i) => (
            <div key={i} className="sa-bar-col">
              <div className="sa-bar" style={{height:`${Math.max((d.revenue/maxRev)*100,4)}%`}} title={fmtCurrency(d.revenue)} />
              <span className="sa-bar-label">{d.day}</span>
            </div>
          ))}
        </div>
        <p style={{marginTop:12,color:'#8b949e',fontSize:'0.78rem',textAlign:'center'}}>
          Total: {fmtCurrency(orders.filter(o=>o.status==='delivered').reduce((s,o)=>s+(o.total||0),0))}
        </p>
      </div>

      <div className="sa-analytics-card">
        <h3>Restaurants by Category</h3>
        <div className="sa-donut-row">
          {catEntries.map(([cat, count], i) => (
            <div key={cat} className="sa-donut-item">
              <div className="sa-donut-dot" style={{background:catColors[i%catColors.length]}} />
              <span className="sa-donut-name">{cat}</span>
              <div className="sa-donut-bar-wrap">
                <div className="sa-donut-bar-fill" style={{width:`${(count/restaurants.length)*100}%`,background:catColors[i%catColors.length]}} />
              </div>
              <span className="sa-donut-val">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────
const sa_TABS = [
  { sa_key:'overview',    label:'Overview',    icon:'📊' },
  { sa_key:'restaurants', label:'Restaurants', icon:'🏪' },
  { sa_key:'orders',      label:'All Orders',  icon:'📦' },
  { sa_key:'agents',      label:'Delivery Agents', icon:'🛵' },
  { sa_key:'analytics',   label:'Analytics',   icon:'📈' },
];

export default function SuperAdminDashboard() {
  const { superAdmin, superAdminLogout } = useSuperAdmin();
  const navigate = useNavigate();
  const [activeTab, sa_setActiveTab] = useState('overview');
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders]           = useState([]);
  const [agents, setAgents]           = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!superAdmin) { navigate('/admin'); return; }
    loadAll();
    const iv = setInterval(loadAll, 8000);
    return () => clearInterval(iv);
  }, [superAdmin, navigate]);

  const loadAll = useCallback(async () => {
    try {
      const [rSa_res, oSa_res, aSa_res] = await Promise.all([
        fetch(`${BASE}/restaurants`).then(r=>r.json()),
        fetch(`${BASE}/orders/all`).then(r=>r.json()),
        fetch(`${BASE}/delivery`).then(r=>r.json()),
      ]);
      if (rSa_res.success) setRestaurants(rSa_res.data);
      if (oSa_res.success) setOrders(oSa_res.data);
      if (aSa_res.success) setAgents(aSa_res.data);
    } catch(err) {
      console.error('Super Admin load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleRestaurant = async (id, isOpen) => {
    try {
      const res = await fetch(`${BASE}/restaurants/${id}/status`, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ isOpen }),
      });
      const data = await res.json();
      if (data.success) setRestaurants(prev => prev.map(r => r.id===id ? data.data : r));
    } catch(sa_err) { console.error(sa_err); }
  };

  const toggleAgent = async (id, isOnline) => {
    try {
      const res = await fetch(`${BASE}/delivery/${id}/status`, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ isOnline }),
      });
      const data = await res.json();
      if (data.success) setAgents(prev => prev.map(a => a.id===id ? data.data : a));
    } catch(sa_err) { console.error(sa_err); }
  };

  const addRestaurant = async (form) => {
    try {
      const res = await fetch(`${BASE}/restaurants`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setRestaurants(prev => [...prev, data.data]);
        loadAll();
      }
    } catch(sa_err) { console.error(sa_err); }
  };

  const deleteRestaurant = async (id) => {
    if (!window.confirm('Delete this restaurant from the platform?')) return;
    try {
      const res = await fetch(`${BASE}/restaurants/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRestaurants(prev => prev.filter(r => r.id !== id));
        loadAll();
      }
    } catch(sa_err) { console.error(sa_err); }
  };

  const addAgent = async (form) => {
    try {
      const res = await fetch(`${BASE}/delivery`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setAgents(prev => [...prev, data.data]);
        loadAll();
      }
    } catch(sa_err) { console.error(sa_err); }
  };

  const deleteAgent = async (id) => {
    if (!window.confirm('Delete this delivery agent from the platform?')) return;
    try {
      const res = await fetch(`${BASE}/delivery/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAgents(prev => prev.filter(a => a.id !== id));
        loadAll();
      }
    } catch(sa_err) { console.error(sa_err); }
  };

  const pendingCount = orders.filter(o => ['placed','confirmed','preparing'].includes(o.status)).length;

  if (loading) return <div className="sa-app"><div className="sa-loading">Loading platform data…</div></div>;

  return (
    <div className="sa-app">
      <aside className="sa-sidebar">
        <div className="sa-sidebar-brand">
          <div className="sa-brand-icon">sa_🛡️</div>
          <div>
            <h2>Eatzo Admin</h2>
            <p>Super Admin Panel</p>
          </div>
        </div>

        <nav className="sa-nav">
          {sa_TABS.map(t => (
            <button
              key={t.sa_key}
              className={`sa-nav-btn ${activeTab===t.sa_key?'sa-active':''}`}
              onClick={() => sa_setActiveTab(t.sa_key)}
            >
              <span className="sa-nav-icon">{t.icon}</span>
              {t.label}
              {t.sa_key==='orders' && pendingCount > 0 && (
                <span className="sa-nav-badge">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sa-sidebar-footer">
          <div style={{padding:'0 2px 12px',fontSize:'0.78rem',color:'#8b949e'}}>
            Logged in as <strong style={{color:'#e6edf3'}}>Super Admin</strong>
          </div>
          <button className="sa-logout-btn" onClick={() => { superAdminLogout(); navigate('/admin'); }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <main className="sa-main">
        <header className="sa-topbar">
          <h2>{sa_TABS.find(t=>t.sa_key===activeTab)?.icon} {sa_TABS.find(t=>t.sa_key===activeTab)?.label}</h2>
          <span className="sa-topbar-meta">
            {restaurants.filter(r=>r.isOpen).length} restaurants online · {orders.length} total orders · Last refreshed {new Date().toLocaleTimeString()}
          </span>
        </header>

        <div className="sa-content">
          {activeTab === 'overview'    && <OverviewTab restaurants={restaurants} orders={orders} agents={agents} />}
          {activeTab === 'restaurants' && <RestaurantsTab restaurants={restaurants} onToggle={toggleRestaurant} onAdd={addRestaurant} onDelete={deleteRestaurant} />}
          {activeTab === 'orders'      && <AllOrdersTab orders={orders} />}
          {activeTab === 'agents'      && <AgentsTab agents={agents} onToggleAgent={toggleAgent} onAdd={addAgent} onDelete={deleteAgent} />}
          {activeTab === 'analytics'   && <AnalyticsTab orders={orders} restaurants={restaurants} />}
        </div>
      </main>
    </div>
  );
}
