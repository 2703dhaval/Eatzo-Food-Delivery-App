import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { api } from '../services/api';
import './Cart.css';

export default function Cart() {
  const { cartItems, cartRestaurant, addToCart, removeFromCart, clearCart, subtotal, deliveryFee, total, totalItems } = useCart();
  const { user } = useAuth();
  const { currentLocation, savedAddresses, loading: locationLoading, getCurrentLocation, selectedAddress, setSelectedAddress } = useLocation();
  const navigate = useNavigate();
  
  const [address, setAddress] = useState(selectedAddress || '');
  const [addressLabel, setAddressLabel] = useState('📍 Selected Location');
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEditingConfirmAddress, setIsEditingConfirmAddress] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [houseError, setHouseError] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(true);

  // Load current location on component mount
  useEffect(() => {
    const initializeAddress = async () => {
      setLoadingAddress(true);
      
      if (selectedAddress && selectedAddress !== 'New Delhi' && selectedAddress !== 'Please select or add an address') {
        setAddress(selectedAddress);
        setAddressLabel('📍 Selected Location');
      } else if (currentLocation && currentLocation.address) {
        setAddress(currentLocation.address);
        setAddressLabel('📍 Current Location');
        setSelectedAddress(currentLocation.address);
      } else {
        // Try to get current location
        const loc = await getCurrentLocation();
        if (loc && loc.address) {
          setAddress(loc.address);
          setAddressLabel('📍 Current Location');
          setSelectedAddress(loc.address);
        } else {
          // Fallback to first saved address
          const firstSaved = savedAddresses.find(a => a.address);
          if (firstSaved) {
            setAddress(firstSaved.address);
            setAddressLabel(`📍 ${firstSaved.label}`);
            setSelectedAddress(firstSaved.address);
          } else {
            setAddress('Please select or add an address');
          }
        }
      }
      setLoadingAddress(false);
    };

    initializeAddress();
  }, [selectedAddress]);

  const handleAddressChange = (newAddr, newLabel) => {
    setAddress(newAddr);
    setAddressLabel(newLabel);
    setSelectedAddress(newAddr);
  };

  const handlePlaceOrderClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!address || address === 'Please select or add an address') {
      alert('Please select a delivery address');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmOrder = async () => {
    let hasError = false;

    if (!houseNumber.trim()) {
      setHouseError('Please enter your house, flat, or building number');
      hasError = true;
    } else {
      setHouseError('');
    }

    if (!receiverName.trim()) {
      setNameError('Please enter receiver name');
      hasError = true;
    } else {
      setNameError('');
    }

    if (!receiverPhone.trim()) {
      setPhoneError('Please enter receiver phone number');
      hasError = true;
    } else if (!/^[6-9]\d{9}$/.test(receiverPhone.trim())) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      hasError = true;
    } else {
      setPhoneError('');
    }

    if (hasError) return;

    setPlacing(true);
    try {
      const fullAddress = `${houseNumber.trim()}, ${address}`;
      
      // Try to determine coordinates for the map
      let orderLat = null;
      let orderLng = null;
      if (currentLocation && currentLocation.address === address) {
        orderLat = currentLocation.lat;
        orderLng = currentLocation.lng;
      } else {
        const matched = savedAddresses.find(a => a.address === address);
        if (matched) {
          orderLat = matched.lat;
          orderLng = matched.lng;
        }
      }

      const orderPayload = {
        userId: user.id,
        restaurantId: cartRestaurant.id,
        restaurantName: cartRestaurant.name,
        items: cartItems.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
        total: total + Math.round(subtotal * 0.05), // total includes taxes
        address: fullAddress,
        addressLabel,
        receiverName,
        receiverPhone: receiverPhone.trim(),
        paymentMethod,
        lat: orderLat,
        lng: orderLng,
      };
      
      const res = await api.placeOrder(orderPayload);
      if (!res.success) {
        alert('Order failed: ' + res.message);
        setPlacing(false);
        return;
      }

      // If Cash on Delivery, place order and redirect immediately
      if (paymentMethod === 'cod') {
        clearCart();
        setShowConfirmation(false);
        setReceiverName('');
        setReceiverPhone('');
        setHouseNumber('');
        navigate(`/order-success/${res.data.id}`);
        return;
      }

      // If Razorpay payment method
      if (!res.razorpayOrder) {
        alert('Failed to initialize digital payment gateway. Try Cash on Delivery.');
        setPlacing(false);
        return;
      }

      const options = {
        key: res.razorpayOrder.key,
        amount: res.razorpayOrder.amount,
        currency: res.razorpayOrder.currency,
        name: "Eatzo Food Delivery",
        description: `Order #${res.data.id} from ${res.data.restaurantName}`,
        image: "/eatzo-logo.jpg",
        order_id: res.razorpayOrder.id,
        handler: async function (response) {
          try {
            setPlacing(true);
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: res.data.id
            });

            if (verifyRes.success) {
              clearCart();
              setShowConfirmation(false);
              setReceiverName('');
              setReceiverPhone('');
              setHouseNumber('');
              navigate(`/order-success/${res.data.id}`);
            } else {
              alert("Payment Verification Failed: " + verifyRes.message);
            }
          } catch (err) {
            console.error("Signature verification error:", err);
            alert("Error verifying payment signature. Please contact support.");
          } finally {
            setPlacing(false);
          }
        },
        prefill: {
          name: receiverName,
          contact: receiverPhone,
          email: user.email || "customer@eatzo.com"
        },
        theme: {
          color: "#fc8019"
        },
        modal: {
          ondismiss: async function () {
            console.log("Razorpay checkout dismissed");
            try {
              await api.reportPaymentFailure({
                orderId: res.data.id,
                errorDescription: "Payment cancelled by user",
                errorCode: "USER_CANCELLED"
              });
            } catch (err) {
              console.error("Failed to cancel order status:", err);
            }
            alert("Payment cancelled. The order has not been completed.");
            setPlacing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response) {
        console.error("Payment failed event:", response.error);
        try {
          await api.reportPaymentFailure({
            orderId: res.data.id,
            errorDescription: response.error.description,
            errorCode: response.error.code
          });
        } catch (err) {
          console.error("Failed to report payment failure:", err);
        }
        alert(`Payment Failed: ${response.error.description || 'Transaction failed'}`);
        setPlacing(false);
      });
      rzp.open();

    } catch (e) {
      console.error(e);
      alert('Something went wrong. Please try again.');
      setPlacing(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setReceiverName('');
    setReceiverPhone('');
    setHouseNumber('');
    setNameError('');
    setPhoneError('');
    setHouseError('');
    setIsEditingConfirmAddress(false);
  };

  if (totalItems === 0) return (
    <div className="page cart-empty">
      <div className="empty-cart-content">
        <div className="empty-cart-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add items from a restaurant to get started</p>
        <button className="btn btn-primary" onClick={() => navigate('/restaurants')}>
          Browse Restaurants
        </button>
      </div>
    </div>
  );

  return (
    <div className="page cart-page">
      <div className="container">
        <h1 className="section-title">Your Cart</h1>
        <p className="section-subtitle">From {cartRestaurant?.name}</p>

        <div className="cart-layout">
          {/* Left: Items */}
          <div className="cart-items-section">
            <div className="cart-restaurant-header">
              <img src={cartRestaurant?.image} alt={cartRestaurant?.name} />
              <div>
                <h3>{cartRestaurant?.name}</h3>
                <p>📍 {cartRestaurant?.address}</p>
              </div>
            </div>

            <div className="cart-items-list">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className={item.isVeg ? 'badge-veg' : 'badge-nonveg'}></div>
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p>₹{item.price} × {item.qty}</p>
                  </div>
                  <div className="qty-control">
                    <button onClick={() => removeFromCart(item.id)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => addToCart(item, cartRestaurant)}>+</button>
                  </div>
                  <span className="cart-item-total">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            {/* Delivery Address */}
            <div className="cart-address-section">
              <h3 className="cart-section-title">📍 Delivery Address</h3>
              <div className="address-options">
                {loadingAddress ? (
                  <div className="loading-address">Loading your location...</div>
                ) : (
                  <>
                    {/* Current Location */}
                    {currentLocation && currentLocation.address && (
                      <label className={`address-option current-location ${address === currentLocation.address ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="address" 
                          value={currentLocation.address} 
                          checked={address === currentLocation.address} 
                          onChange={() => handleAddressChange(currentLocation.address, '📍 Current Location')}
                        />
                        <div className="address-label-wrapper">
                          <span className="address-icon">📍</span>
                          <div>
                            <span className="address-label-text">Current Location</span>
                            <span className="address-desc">{currentLocation.address.substring(0, 60)}...</span>
                          </div>
                        </div>
                      </label>
                    )}

                    {/* Saved Addresses */}
                    {savedAddresses.map(addr => (
                      addr.address && (
                        <label key={addr.id} className={`address-option ${address === addr.address ? 'selected' : ''}`}>
                          <input 
                            type="radio" 
                            name="address" 
                            value={addr.address} 
                            checked={address === addr.address} 
                            onChange={() => handleAddressChange(addr.address, `${addr.type === 'home' ? '🏠' : '🏢'} ${addr.label}`)}
                          />
                          <div className="address-label-wrapper">
                            <span className="address-icon">{addr.type === 'home' ? '🏠' : addr.type === 'work' ? '🏢' : '📍'}</span>
                            <div>
                              <span className="address-label-text">{addr.label}</span>
                              <span className="address-desc">{addr.address.substring(0, 60)}...</span>
                            </div>
                          </div>
                        </label>
                      )
                    ))}

                    {/* Custom Address Input */}
                    <div className="address-custom">
                      <input
                        type="text"
                        placeholder="Or enter a custom address..."
                        value={address}
                        onChange={e => handleAddressChange(e.target.value, '📍 Custom Address')}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="cart-payment-section">
              <h3 className="cart-section-title">💳 Payment Method</h3>
              <div className="payment-options">
                {[
                  { id: 'upi', label: '📱 UPI / Google Pay', desc: 'Instant payment' },
                  { id: 'card', label: '💳 Credit / Debit Card', desc: 'Visa, Mastercard' },
                  { id: 'cod', label: '💵 Cash on Delivery', desc: 'Pay when delivered' },
                ].map(opt => (
                  <label key={opt.id} className={`payment-option ${paymentMethod === opt.id ? 'selected' : ''}`}>
                    <input type="radio" name="payment" value={opt.id} checked={paymentMethod === opt.id} onChange={() => setPaymentMethod(opt.id)} />
                    <div>
                      <span className="pay-label">{opt.label}</span>
                      <span className="pay-desc">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Bill Summary */}
          <div className="cart-summary">
            <h3 className="cart-section-title">🧾 Bill Summary</h3>
            <div className="bill-rows">
              <div className="bill-row"><span>Item Total</span><span>₹{subtotal}</span></div>
              <div className="bill-row"><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
              <div className="bill-row"><span>Taxes & Fees</span><span>₹{Math.round(subtotal * 0.05)}</span></div>
              <div className="bill-divider"></div>
              <div className="bill-row total-row">
                <span>To Pay</span>
                <span>₹{total + Math.round(subtotal * 0.05)}</span>
              </div>
            </div>

            <div className="savings-tag">
              🏷️ You saved ₹{Math.round(subtotal * 0.1)} on this order!
            </div>

            <button
              className="btn btn-primary place-order-btn"
              onClick={handlePlaceOrderClick}
              disabled={placing}
            >
              {placing ? (
                <><span className="spinner"></span> Placing Order...</>
              ) : (
                <>🚀 Place Order · ₹{total + Math.round(subtotal * 0.05)}</>
              )}
            </button>

            <p className="cart-note">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="modal-overlay">
            <div className="confirmation-modal">
              <div className="modal-header">
                <h2>✓ Confirm Your Order</h2>
                <button className="modal-close" onClick={handleCancelConfirmation}>×</button>
              </div>

              <div className="modal-content">
                {/* Address Section */}
                <div className="confirmation-section">
                  <div className="section-header">
                    <span className="section-icon">📍</span>
                    <h3>Delivery Address</h3>
                  </div>
                  <div className="address-display" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    {isEditingConfirmAddress ? (
                      <div className="edit-confirm-address-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                        <textarea
                          className="confirm-address-textarea"
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            setSelectedAddress(e.target.value);
                          }}
                          placeholder="Enter delivery address..."
                          rows="3"
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            background: '#222',
                            color: '#fff',
                            border: '1px solid #444',
                            fontFamily: 'inherit',
                            fontSize: '0.85rem',
                            resize: 'vertical',
                            lineHeight: '1.4'
                          }}
                        />
                        <button 
                          className="btn btn-primary"
                          style={{ alignSelf: 'flex-end', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
                          onClick={() => setIsEditingConfirmAddress(false)}
                        >
                          Save Address
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="address-text">{address}</p>
                        <button 
                          className="btn-edit-address"
                          onClick={() => setIsEditingConfirmAddress(true)}
                        >
                          Change Address
                        </button>
                      </>
                    )}
                  </div>

                  {/* House / Flat Number Input */}
                  <div className="house-number-input-group" style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
                      House / Flat / Floor / Building No. <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="receiver-name-input"
                      placeholder="e.g. Flat 402, 4th Floor, Royal Apartments"
                      value={houseNumber}
                      onChange={(e) => {
                        setHouseNumber(e.target.value);
                        if (e.target.value.trim()) setHouseError('');
                      }}
                    />
                    {houseError && <p className="input-error">{houseError}</p>}
                  </div>
                </div>

                {/* Receiver Details Section */}
                <div className="confirmation-section">
                  <div className="section-header">
                    <span className="section-icon">👤</span>
                    <h3>Receiver Details</h3>
                  </div>
                  <div className="receiver-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
                        Receiver Name <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="receiver-name-input"
                        placeholder="Enter receiver's full name"
                        value={receiverName}
                        onChange={(e) => {
                          setReceiverName(e.target.value);
                          if (e.target.value.trim()) setNameError('');
                        }}
                      />
                      {nameError && <p className="input-error">{nameError}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
                        Receiver Phone Number <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        className="receiver-name-input"
                        placeholder="Enter 10-digit mobile number"
                        value={receiverPhone}
                        maxLength={10}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, ''); // only digits
                          setReceiverPhone(val);
                          if (val.trim() && /^[6-9]\d{9}$/.test(val)) setPhoneError('');
                        }}
                      />
                      {phoneError && <p className="input-error">{phoneError}</p>}
                    </div>
                  </div>
                </div>

                {/* Payment Method Summary */}
                <div className="confirmation-section">
                  <div className="section-header">
                    <span className="section-icon">💳</span>
                    <h3>Payment Method</h3>
                  </div>
                  <p className="payment-summary">
                    {paymentMethod === 'upi' && '📱 UPI / Google Pay'}
                    {paymentMethod === 'card' && '💳 Credit / Debit Card'}
                    {paymentMethod === 'cod' && '💵 Cash on Delivery'}
                  </p>
                </div>

                {/* Order Total */}
                <div className="confirmation-section order-total">
                  <div className="total-line">
                    <span>Order Total</span>
                    <span className="total-amount">₹{total + Math.round(subtotal * 0.05)}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary cancel-btn"
                  onClick={handleCancelConfirmation}
                  disabled={placing}
                >
                  Edit Details
                </button>
                <button
                  className="btn btn-primary confirm-btn"
                  onClick={handleConfirmOrder}
                  disabled={placing || !receiverName.trim()}
                >
                  {placing ? (
                    <><span className="spinner"></span> Confirming...</>
                  ) : (
                    <>✓ Confirm & Pay</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
