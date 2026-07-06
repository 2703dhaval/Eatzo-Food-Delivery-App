// Web Notification API Service for Eatzo
// Use Eatzo brand logo served from public folder
const EATZO_ICON = '/eatzo-logo.jpg';

const PROMOS = [
  {
    title: '😋 Weekend Special!',
    body: 'Flat 20% off on all Ice Creams & Desserts today! Use code SWEET20 at checkout.'
  },
  {
    title: '🍕 Pizza Party Time!',
    body: 'Buy 1 Get 1 Free on all Medium Pan Pizzas! Order from Pizza Palace now.'
  },
  {
    title: '🌶️ Biryani Love!',
    body: 'Free delivery on all Biryanis for the next 1 hour! Order from Spice Garden.'
  },
  {
    title: '💰 Cashback Alert!',
    body: 'Get flat ₹100 cashback when paying using UPI. Limited time offer!'
  }
];

export const notificationService = {
  // Request notification permission from the user
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Web notifications are not supported by this browser.');
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      localStorage.setItem('eatzo_notification_permission', permission);
      
      if (permission === 'granted') {
        this.sendNotification('🎉 Eatzo Notifications Enabled!', {
          body: 'You will now get live order tracking updates & exclusive food offers straight to your device!',
          requireInteraction: false
        });
      }
      return permission;
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return 'denied';
    }
  },

  // Ask for permission on app entry (if not already set)
  async askPermissionAndInit() {
    if (!('Notification' in window)) return;

    const savedPermission = localStorage.getItem('eatzo_notification_permission');
    
    // If not decided yet, request it
    if (Notification.permission === 'default' && !savedPermission) {
      // Small delay so user gets a chance to see the page first
      setTimeout(async () => {
        const permission = await this.requestPermission();
        if (permission === 'granted') {
          this.schedulePromotionalOffer();
        }
      }, 3000);
    } else if (Notification.permission === 'granted') {
      // Permission already granted, schedule promo notification
      this.schedulePromotionalOffer();
    }
  },

  // Send a custom desktop notification
  sendNotification(title, options = {}) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        const defaultOptions = {
          icon: EATZO_ICON,
          badge: EATZO_ICON,
          vibrate: [200, 100, 200],
          ...options
        };
        new Notification(title, defaultOptions);
      } catch (err) {
        console.error('Failed to trigger notification:', err);
      }
    }
  },

  // Schedule a random promotional notification after load
  schedulePromotionalOffer() {
    // Only schedule if permission is granted
    if (Notification.permission !== 'granted') return;

    // Trigger a promotional notification 15 seconds after app load
    setTimeout(() => {
      const randomPromo = PROMOS[Math.floor(Math.random() * PROMOS.length)];
      this.sendNotification(randomPromo.title, {
        body: randomPromo.body,
        tag: 'promo-alert'
      });
    }, 15000);
  },

  // Trigger notification for order status updates
  triggerOrderStatusNotification(restaurantName, stepIndex) {
    if (Notification.permission !== 'granted') return;

    const STATUS_NOTIFICATIONS = [
      {
        title: '🍕 Order Placed!',
        body: `Your order from ${restaurantName} has been received successfully.`
      },
      {
        title: '🏪 Order Confirmed!',
        body: `${restaurantName} has accepted your order and will start cooking soon.`
      },
      {
        title: '👨‍🍳 Cooking in Progress!',
        body: `Our chef is cooking your delicious meal from ${restaurantName}.`
      },
      {
        title: '🛵 Out for Delivery!',
        body: `Your hot & fresh food from ${restaurantName} is on the way with our partner.`
      },
      {
        title: '🎉 Order Delivered!',
        body: `Enjoy your delicious food! Thank you for ordering from Eatzo.`
      }
    ];

    const notification = STATUS_NOTIFICATIONS[stepIndex];
    if (notification) {
      this.sendNotification(notification.title, {
        body: notification.body,
        tag: `order-status-${stepIndex}`,
        requireInteraction: stepIndex === 3 || stepIndex === 4 // Require interaction on delivery
      });
    }
  }
};
