import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import './SuperAdmin.css';

export default function SuperAdminLogin() {
  const { superAdmin, superAdminLogin } = useSuperAdmin();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (superAdmin) navigate('/admin/dashboard');
  }, [superAdmin, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // brief animation delay
    const result = superAdminLogin(username, password);
    setLoading(false);
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="sa-login-page">
      <div className="sa-login-bg" />
      <div className="sa-login-card">
        <div className="sa-login-logo">
          <span className="sa-shield">🛡️</span>
          <h1>Eatzo Admin</h1>
          <p>Platform Control Centre — Authorised Access Only</p>
        </div>

        {error && <div className="sa-error">⚠️ {error}</div>}

        <form onSubmit={handleLogin}>
          <div className="sa-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="sa-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="sa-login-btn" disabled={loading}>
            {loading ? '🔒 Authenticating...' : '🔑 Sign in to Admin Panel'}
          </button>
        </form>

        <p className="sa-demo-hint">
          Demo credentials: <code>admin</code> / <code>admin123</code>
        </p>
      </div>
    </div>
  );
}
