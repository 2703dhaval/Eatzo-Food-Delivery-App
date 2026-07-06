import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isLoggedIn) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    if (tab === 'signup' && !form.name) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      login({ name: form.name || form.email.split('@')[0], email: form.email });
      navigate('/');
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="page login-page">
      <div className="login-container">
        {/* Left: Visual */}
        <div className="login-visual">
          <div className="login-visual-content">
            <div className="login-logo">🍕 Eatzo</div>
            <h2>India's Favourite<br />Food Delivery App</h2>
            <p>Order from your favourite restaurants and get food delivered hot & fresh!</p>
            <div className="login-features">
              {['⚡ 30-minute delivery', '🎉 Best offers & discounts', '🛡️ Safe & secure payments', '📍 Real-time tracking'].map(f => (
                <div key={f} className="login-feature">{f}</div>
              ))}
            </div>
            <div className="login-bg-blob"></div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="login-form-section">
          <div className="tab-switcher">
            <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>
              Login
            </button>
            <button className={`tab-btn ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>
              Sign Up
            </button>
          </div>

          <h2 className="form-title">
            {tab === 'login' ? 'Welcome Back! 👋' : 'Create Account 🚀'}
          </h2>
          <p className="form-subtitle">
            {tab === 'login' ? 'Login to track orders and enjoy great food' : 'Join thousands of food lovers'}
          </p>

          {error && <div className="form-error">⚠️ {error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {tab === 'signup' && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
              {loading ? (
                <><span className="spinner"></span> {tab === 'login' ? 'Logging in...' : 'Creating account...'}</>
              ) : (
                tab === 'login' ? 'Login to Eatzo' : 'Create Account'
              )}
            </button>
          </form>

          <div className="or-divider"><span>OR</span></div>

          {/* Demo Login */}
          <button
            className="btn btn-ghost guest-btn"
            onClick={() => {
              login({ name: 'Demo User', email: 'demo@eatzo.com' });
              navigate('/');
            }}
          >
            👤 Continue as Guest (Demo)
          </button>

          <p className="auth-switch">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button className="auth-link" onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}>
              {tab === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
