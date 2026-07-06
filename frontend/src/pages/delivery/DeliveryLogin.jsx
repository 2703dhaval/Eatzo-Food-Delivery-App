import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDelivery } from '../../context/DeliveryContext';
import './Delivery.css';

// Demo agent list (mirrors backend data)
const DEMO_AGENTS = [
  { id: 'D001', name: 'Arjun Kumar',  avatar: '🏍️' },
  { id: 'D002', name: 'Priya Sharma', avatar: '🛵' },
  { id: 'D003', name: 'Rahul Singh',  avatar: '🚴' },
  { id: 'D004', name: 'Sneha Patel',  avatar: '🛵' },
  { id: 'D005', name: 'Karan Mehta',  avatar: '🏍️' },
];

export default function DeliveryLogin() {
  const { deliveryLogin, deliveryAgent } = useDelivery();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState('D001');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (deliveryAgent) navigate('/delivery/dashboard');
  }, [deliveryAgent, navigate]);

  const selected = DEMO_AGENTS.find(a => a.id === selectedId);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await deliveryLogin(selectedId, password);
    setLoading(false);
    if (res.success) {
      navigate('/delivery/dashboard');
    } else {
      setError('Invalid credentials. Please check your ID and password.');
    }
  };

  return (
    <div className="dp-app" style={{ minHeight: '100vh' }}>
      <div className="dp-login-page">
        <div className="dp-login-glow" />

        <div className="dp-login-card">
          <div className="dp-login-logo">
            <span className="dp-moto">{selected?.avatar || '🛵'}</span>
            <h1>Delivery Partner</h1>
            <p>Start earning — login to begin your shift</p>
          </div>

          {error && <div className="dp-error">⚠️ {error}</div>}

          <form onSubmit={handleLogin}>
            <div className="dp-field">
              <label>Select Your Agent ID</label>
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                {DEMO_AGENTS.map(a => (
                  <option key={a.id} value={a.id}>{a.avatar} {a.name} ({a.id})</option>
                ))}
              </select>
            </div>

            <div className="dp-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="dp-login-btn" disabled={loading}>
              {loading ? '🔄 Logging in...' : '🚀 Go Online & Start Delivering'}
            </button>
          </form>

          <p className="dp-login-hint">
            Demo password: <code>delivery123</code> (works for all agents)
          </p>
        </div>
      </div>
    </div>
  );
}
