import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { CartProvider }         from './context/CartContext';
import { AuthProvider }         from './context/AuthContext';
import { FavoritesProvider }    from './context/FavoritesContext';
import { AdminProvider }        from './context/AdminContext';
import { DeliveryProvider }     from './context/DeliveryContext';
import { LocationProvider }     from './context/LocationContext';
import { SuperAdminProvider }   from './context/SuperAdminContext';

import Navbar           from './components/Navbar';
import Home             from './pages/Home';
import Restaurants      from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart             from './pages/Cart';
import Orders           from './pages/Orders';
import Login            from './pages/Login';
import OrderSuccess     from './pages/OrderSuccess';
import Favorites        from './pages/Favorites';

// 🛡️ Super Admin Panel (platform-level)
import SuperAdminLogin     from './pages/superadmin/SuperAdminLogin';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';

// 🍽️ Restaurant Partner Portal
import PartnerLogin     from './pages/admin/AdminLogin';
import PartnerDashboard from './pages/admin/AdminDashboard';

// 🛵 Delivery Agent App
import DeliveryLogin    from './pages/delivery/DeliveryLogin';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

import { notificationService } from './services/notificationService';

// ── Layouts ─────────────────────────────────────────────────
const CustomerLayout = () => (
  <div className="app">
    <Navbar />
    <Outlet />
  </div>
);

// Super Admin — full-screen dark navy app shell
const SuperAdminLayout = () => (
  <div style={{ background: '#0d1117', minHeight: '100vh', color: '#e6edf3' }}>
    <Outlet />
  </div>
);

// Restaurant Partner — full-screen warm dark app shell
const PartnerLayout = () => (
  <div style={{ background: '#0f0f0f', minHeight: '100vh', color: '#f0f0f0' }}>
    <Outlet />
  </div>
);

// Delivery Agent — light app shell
const DeliveryLayout = () => (
  <div className="delivery-app" style={{ background: '#fff', minHeight: '100vh', color: '#111' }}>
    <Outlet />
  </div>
);

// ── App ──────────────────────────────────────────────────────
function App() {
  React.useEffect(() => {
    notificationService.askPermissionAndInit();
  }, []);

  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <FavoritesProvider>
            <SuperAdminProvider>
              <AdminProvider>
                <DeliveryProvider>
                  <Routes>

                    {/* ── Customer App ───────────────────────── */}
                    <Route element={<CustomerLayout />}>
                      <Route path="/"                          element={<Home />} />
                      <Route path="/restaurants"              element={<Restaurants />} />
                      <Route path="/restaurant/:id"           element={<RestaurantDetail />} />
                      <Route path="/cart"                     element={<Cart />} />
                      <Route path="/orders"                   element={<Orders />} />
                      <Route path="/login"                    element={<Login />} />
                      <Route path="/order-success/:orderId"   element={<OrderSuccess />} />
                      <Route path="/favorites"                element={<Favorites />} />
                    </Route>

                    {/* ── 🛡️ Super Admin Panel (/admin) ────────── */}
                    <Route path="/admin" element={<SuperAdminLayout />}>
                      <Route index             element={<SuperAdminLogin />} />
                      <Route path="dashboard"  element={<SuperAdminDashboard />} />
                    </Route>

                    {/* ── 🍽️ Restaurant Partner Portal (/partner) ── */}
                    <Route path="/partner" element={<PartnerLayout />}>
                      <Route index             element={<PartnerLogin />} />
                      <Route path="dashboard"  element={<PartnerDashboard />} />
                    </Route>

                    {/* ── 🛵 Delivery Agent App (/delivery) ──── */}
                    <Route path="/delivery" element={<DeliveryLayout />}>
                      <Route index             element={<DeliveryLogin />} />
                      <Route path="dashboard"  element={<DeliveryDashboard />} />
                    </Route>

                  </Routes>
                </DeliveryProvider>
              </AdminProvider>
            </SuperAdminProvider>
          </FavoritesProvider>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
