import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { api } from '../../services/api';
import './Admin.css';

export default function PartnerLogin() {
  const { adminLogin, adminUser } = useAdmin();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedId, setSelectedId]   = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    if (adminUser) navigate('/partner/dashboard');

    const fetchRes = async () => {
      const res = await api.getRestaurants();
      if (res.success) {
        setRestaurants(res.data);
        if (res.data.length > 0) setSelectedId(res.data[0].id);
      }
    };
    fetchRes();
  }, [adminUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    await adminLogin(selectedId);
    setLoading(false);
    navigate('/partner/dashboard');
  };

  return (
    <div className="rp-login-page">
      <div className="rp-login-bg" />
      <div className="rp-login-card">
        <div className="rp-login-logo">
          <span className="rp-store-icon">🍽️</span>
          <h1>Partner Portal</h1>
          <p>Manage your orders, menu &amp; restaurant profile</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="rp-field">
            <label>Select Your Restaurant</label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} required>
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name} — {r.address?.split(',').slice(-2).join(',').trim()}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="rp-login-btn" disabled={loading || !selectedId}>
            {loading ? '🔄 Logging in...' : '🚀 Access My Dashboard →'}
          </button>
        </form>

        <p className="rp-demo-hint">Select your restaurant from the list above to access your partner dashboard</p>
      </div>
    </div>
  );
}
