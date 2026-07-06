# 🍕 Eatzo - Food Delivery App
> A full-stack Swiggy/Zomato-style food delivery application built as a college project.

## 📋 Project Overview
**Title:** Online Food Delivery Application  
**Description:** A web-based platform that connects customers with local restaurants, allowing users to browse menus, place food orders, make payments, and track deliveries in real-time.

## 🚀 Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (Custom Design System) |
| Backend | Node.js + Express.js |
| State Management | React Context API |
| Routing | React Router v6 |
| Maps (ready) | Leaflet.js |

## 📁 Project Structure
```
Eatzo/
├── frontend/               ← React App
│   ├── src/
│   │   ├── components/     ← Navbar, RestaurantCard
│   │   ├── pages/          ← Home, Restaurants, RestaurantDetail, Cart, Orders, Login, OrderSuccess
│   │   ├── context/        ← CartContext, AuthContext
│   │   └── services/       ← API service layer
├── backend/                ← Express API
│   ├── routes/             ← restaurants, menu, orders
│   ├── data/               ← Mock data (restaurants, menu, orders)
│   └── server.js
└── README.md
```

## ✨ Features
- 🏠 **Home Page** — Hero banner, search, cuisine showcase, restaurant listing
- 🍽️ **Restaurants** — Filter by category, sort by rating/delivery time, search
- 📋 **Restaurant Detail** — Full menu with add-to-cart, veg/non-veg indicators
- 🛒 **Cart** — Quantity management, address selection, payment method choice, bill summary
- 📦 **Order Tracking** — Live animated status timeline (Placed → Confirmed → Preparing → Out for Delivery → Delivered)
- 🔐 **Authentication** — Login/Signup with persistent session
- 📜 **Order History** — All past orders with status badges

## 🛠️ How to Run

### Step 1: Start Backend
```bash
cd backend
npm install
node server.js
```
Backend runs at: http://localhost:5000

### Step 2: Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

## 🌐 API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/restaurants | Get all restaurants |
| GET | /api/restaurants/:id | Get single restaurant |
| GET | /api/menu/:restaurantId | Get restaurant menu |
| POST | /api/orders | Place new order |
| GET | /api/orders/:id | Get order by ID |
| GET | /api/orders?userId=x | Get user's orders |
| PATCH | /api/orders/:id/status | Update order status |

## 👨‍💻 How to Demo
1. Open http://localhost:5173
2. Browse restaurants on the home page
3. Click a restaurant → view menu → add items to cart
4. Go to cart → select address → choose payment → Place Order
5. See animated order tracking with live status updates
6. Check order history in "My Orders"

## admin URL and access

URL:http://localhost:5173/admin
Email: admin@eatzo.com 
password: admin123

## delivery partner URL and access

URL: http://localhost:5173/delivery
Email: delivery@eatzo.com
password: delivery123

---
*Built with ❤️ as a college project*
