import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { notificationService } from '../services/notificationService';
import './OrderSuccess.css';

const STATUS_STEPS = [
  { key: 'placed',           label: 'Order Placed',  icon: '✅', desc: 'Your order has been placed successfully' },
  { key: 'confirmed',        label: 'Confirmed',      icon: '🏪', desc: 'Restaurant confirmed your order' },
  { key: 'preparing',        label: 'Preparing',      icon: '👨‍🍳', desc: 'Chef is preparing your food' },
  { key: 'out_for_delivery', label: 'On the Way',     icon: '🛵', desc: 'Delivery partner is heading your way' },
  { key: 'delivered',        label: 'Delivered',      icon: '🎉', desc: 'Food delivered! Enjoy your meal' },
];

// Map backend status string → step index
const STATUS_INDEX = {
  placed:           0,
  confirmed:        1,
  preparing:        2,
  ready_for_pickup: 2,   // treat same as preparing
  out_for_delivery: 3,
  delivered:        4,
  cancelled:        4,   // show as final
};

export default function OrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder]           = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDone, setIsDone]         = useState(false);   // stop polling once delivered/cancelled

  const prevStepRef   = useRef(-1);   // to detect step changes for notifications
  const pollIntervalRef = useRef(null);

  // ─── Fetch order from backend and sync step ───────────────────────────────
  const syncOrderStatus = useCallback(async () => {
    try {
      const res = await api.getOrder(orderId);
      if (!res.success) return;

      const ord = res.data;
      setOrder(ord);

      const step = STATUS_INDEX[ord.status] ?? 0;
      setCurrentStep(step);

      // Fire notification only when step actually changes
      if (step !== prevStepRef.current) {
        prevStepRef.current = step;
        notificationService.triggerOrderStatusNotification(ord.restaurantName, step);
      }

      // Stop polling once terminal state reached
      if (ord.status === 'delivered' || ord.status === 'cancelled') {
        setIsDone(true);
        clearInterval(pollIntervalRef.current);
      }
    } catch (err) {
      console.error('Failed to fetch order status:', err);
    }
  }, [orderId]);

  // ─── On mount: immediate fetch + start polling every 5 s ─────────────────
  useEffect(() => {
    syncOrderStatus();                                   // first fetch immediately
    pollIntervalRef.current = setInterval(syncOrderStatus, 5000); // poll every 5 s

    return () => clearInterval(pollIntervalRef.current); // cleanup on unmount
  }, [syncOrderStatus]);

  const isDelivered  = order?.status === 'delivered';
  const isCancelled  = order?.status === 'cancelled';

  return (
    <div className="page order-success-page">
      <div className="container">

        {/* ── Success Banner ──────────────────────────────────────────────── */}
        <div className={`success-banner ${isCancelled ? 'cancelled-banner' : ''}`}>
          <div className="success-animation">{isCancelled ? '❌' : '🎉'}</div>
          <h1>{isCancelled ? 'Order Cancelled' : 'Order Placed Successfully!'}</h1>
          <p>Order ID: <strong>#{orderId}</strong></p>
          {!isCancelled && (
            <div className="eta-badge">
              <span>⚡</span>
              Estimated Delivery: <strong>30–35 minutes</strong>
            </div>
          )}
        </div>

        {/* ── Live Tracking Timeline ──────────────────────────────────────── */}
        <div className="tracking-card">
          <h2 className="tracking-title">
            📦 Live Order Tracking
            {!isDone && (
              <span className="live-badge">
                <span className="live-dot"></span> LIVE
              </span>
            )}
          </h2>

          <div className="timeline">
            {STATUS_STEPS.map((step, idx) => {
              // skip delivered step if cancelled
              if (isCancelled && idx === 4) return null;

              const isCompleted = idx <= currentStep;
              const isActive    = idx === currentStep;

              return (
                <div
                  key={step.key}
                  className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                >
                  <div className="step-indicator">
                    <div className="step-icon-circle">
                      {isCompleted
                        ? step.icon
                        : <span className="step-num">{idx + 1}</span>
                      }
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`step-connector ${idx < currentStep ? 'filled' : ''}`}></div>
                    )}
                  </div>

                  <div className="step-content">
                    <h4>{step.label}</h4>
                    <p>{step.desc}</p>
                    {isActive && !isDone && <div className="active-pulse"></div>}
                    {isActive && isDone && isDelivered && (
                      <span className="completed-chip">✅ Completed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status hint at bottom of timeline */}
          {!isDone && (
            <p className="polling-note">🔄 Tracking updates automatically every few seconds</p>
          )}
        </div>

        {/* ── Order Summary ───────────────────────────────────────────────── */}
        {order && (
          <div className="order-detail-card">
            <h3>🧾 Order Summary</h3>
            <div className="order-items-list">
              {order.items?.map((item, i) => (
                <div key={i} className="order-item-row">
                  <span>{item.qty}x {item.name}</span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
              <div className="order-total-row">
                <span>Total Paid</span>
                <span>₹{order.total}</span>
              </div>
            </div>
            <div className="order-address">
              <span>📍</span> {order.address}
            </div>
          </div>
        )}

        {/* ── Action Buttons ──────────────────────────────────────────────── */}
        <div className="success-actions">
          <Link to="/orders" className="btn btn-outline">View All Orders</Link>
          <Link to="/"       className="btn btn-primary">Order More Food 🍕</Link>
        </div>
      </div>
    </div>
  );
}
