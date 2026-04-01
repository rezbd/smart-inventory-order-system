# StockCommand — Smart Inventory & Order Management System

A production-grade full-stack application for managing product inventory,
processing orders, tracking stock levels, and monitoring business operations
in real time. Built with the MERN stack.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Demo Access](#demo-access)
- [API Reference](#api-reference)
- [Architecture Notes](#architecture-notes)
- [Key Business Logic](#key-business-logic)

---

## Features

### Authentication
- Email + password signup and login with JWT
- One-click Demo Login for instant access
- Persistent sessions via localStorage (Zustand)
- Auto-logout on token expiry (401 interceptor)
- Role-based access control (`admin` / `staff`)

### Product & Category Management
- Create, update, and delete product categories (with guard against deleting categories that have associated products)
- Full product CRUD: Name, Category, Price, Stock Quantity, Min Stock Threshold, Status
- Auto-generated SKU on product creation
- Stock color-coded in tables: green (healthy) → amber (low) → red (zero)

### Order Management
- Create orders with multiple line items and live total preview
- Customer name, email, notes, and full product snapshot (price at time of order)
- Filter orders by status: All, Pending, Confirmed, Shipped, Delivered, Cancelled
- Enforce legal status transitions (e.g., Shipped → Delivered only; cannot reopen terminal states)
- Full order detail view with one-click status advancement
- Cancel orders with automatic stock restoration

### Stock Rules (Atomic & Race-Condition Safe)
- Stock is deducted atomically using MongoDB transactions on order creation
- Orders are blocked if requested quantity exceeds available stock
- Inactive or Out-of-Stock products cannot be ordered
- Stock automatically set to `Out of Stock` when it reaches 0
- Stock restored and product reactivated when an order is cancelled

### Conflict Detection
- Duplicate products in the same order are rejected with a clear error message
- All validation errors for multi-item orders are collected and returned at once
- Race conditions handled via `$gte` condition inside `findOneAndUpdate` — returns 409 if stock changed between validation and deduction

### Restock Queue
- Derived query (no separate collection) — always accurate, never out of sync
- Products where `stock < minStockThreshold` sorted by urgency ratio (most critical first)
- Urgency labels: CRITICAL / HIGH / MEDIUM / LOW
- Manual restock with live preview of new stock level vs. threshold
- Auto-refresh every 30 seconds

### Dashboard
- Metrics: Orders Today, Revenue Today (Delivered only), Low Stock Count, Completed Orders
- Recent activity feed (latest 10 system events)
- Recent orders table with direct links
- Product summary table — all fetched in a single parallel `Promise.all` call

### Activity Log
- Every significant system event is recorded: order created/cancelled/updated,
  stock deducted/restored/restocked, product created/updated/deleted, user login/signup
- Logs include: action code, human-readable message, entity reference, performer, metadata, timestamp
- Fire-and-forget — log failures never crash the parent operation

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Runtime     | Node.js 20+                                     |
| Framework   | Express.js 4                                    |
| Database    | MongoDB 7+ with Mongoose 8 (transactions req.)  |
| Auth        | JSON Web Tokens (jsonwebtoken + bcryptjs)        |
| Frontend    | React 18 + Vite 5                               |
| Routing     | React Router v6                                 |
| State       | Zustand (auth/UI) + TanStack React Query (data) |
| HTTP Client | Axios with request/response interceptors         |
| Styling     | Tailwind CSS 3                                  |
| Fonts       | Syne (display) + JetBrains Mono (data/code)     |
| Security    | Helmet, CORS, express-rate-limit                |

---

## Project Structure
```
smart-inventory/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios instance
│   │   ├── components/
│   │   │   ├── common/      # Badge, Modal, Spinner, EmptyState, toast
│   │   │   └── layout/      # AppLayout, Sidebar, Topbar, ProtectedRoute
│   │   ├── features/
│   │   │   ├── auth/        # LoginPage, SignupPage, authStore (Zustand)
│   │   │   ├── dashboard/   # DashboardPage
│   │   │   ├── products/    # ProductsPage, useProducts (React Query)
│   │   │   ├── categories/  # CategoriesPage, useCategories
│   │   │   ├── orders/      # OrdersPage, OrderDetailPage, useOrders
│   │   │   └── inventory/   # RestockQueuePage, useRestock
│   │   ├── lib/             # React Query client config
│   │   └── router/          # All route definitions
│   └── ...config files
│
└── server/                  # Node + Express backend
    └── src/
        ├── config/          # MongoDB connection
        ├── models/          # Mongoose schemas (User, Category, Product, Order, ActivityLog)
        ├── controllers/     # Route handlers (thin — delegate to services)
        ├── services/        # Business logic (stock, restock, activityLog)
        ├── routes/          # Express routers
        ├── middleware/      # JWT auth, global error handler
        └── utils/           # AppError class
```

---

## Prerequisites

- **Node.js** v20 or higher
- **MongoDB** v7 or higher — must support **replica sets** for transactions.
  - For local development, use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier) or run a local replica set.
  - A standalone `mongod` instance does **not** support multi-document transactions.

> **Quick local replica set setup:**
> ```bash
> # If using mongod directly, start with --replSet flag
> mongod --replSet rs0 --dbpath /your/db/path
>
> # Then in mongosh, initiate the replica set once:
> rs.initiate()
> ```
> Or simply use a free MongoDB Atlas cluster — transactions work out of the box.

---

## Environment Variables

### Server — `server/.env`
```env
# Application
NODE_ENV=development          # development | production
PORT=5000

# Database
# Use a MongoDB Atlas URI or a local replica set URI
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/smart-inventory?retryWrites=true&w=majority

# Authentication
# Use a long, random string in production — never commit the real value
JWT_SECRET=replace-this-with-a-long-random-secret-string
JWT_EXPIRES_IN=7d

# CORS — set to your frontend URL
CLIENT_URL=http://localhost:5173
```

### Client — `client/.env`
```env
# Must match the server PORT above
VITE_API_URL=http://localhost:5000/api/v1
```

---

## Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/smart-inventory.git
cd smart-inventory
```

### 2. Set up the server
```bash
cd server

# Install dependencies
npm install

# Create your environment file
cp .env.example .env

# Open .env and fill in MONGO_URI and JWT_SECRET
```

### 3. Set up the client
```bash
cd ../client

# Install dependencies
npm install

# Create your environment file
# (default points to http://localhost:5000/api/v1 — change if needed)
cp .env.example .env
```

### 4. Seed the demo user (optional but recommended)

The Demo Login button on the login page uses these credentials. Create the
account by making a single POST request after the server is running:
```bash
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo User","email":"demo@stockcommand.io","password":"demo123456"}'
```

Or use any HTTP client (Postman, Insomnia, Bruno).

---

## Running the Application

### Development (two terminals)

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
# You should see: ✅ MongoDB Connected and 🚀 Server running
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# Client starts on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
# Build the frontend
cd client
npm run build
# Output goes to client/dist/

# Serve the dist/ folder from Express or a CDN (Vercel, Netlify, S3, etc.)
# and set NODE_ENV=production in the server .env

cd ../server
npm start
```

---

## Demo Access

| Field    | Value                     |
|----------|---------------------------|
| Email    | `demo@stockcommand.io`    |
| Password | `demo123456`              |

Click **"⚡ Demo Login — Instant Access"** on the login page to skip typing.

---

## API Reference

All endpoints are prefixed with `/api/v1`. All protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Auth
| Method | Endpoint         | Auth | Description          |
|--------|------------------|------|----------------------|
| POST   | `/auth/signup`   | No   | Create account       |
| POST   | `/auth/login`    | No   | Login, receive token |
| GET    | `/auth/me`       | Yes  | Get current user     |

### Categories
| Method | Endpoint           | Auth | Description                    |
|--------|--------------------|------|--------------------------------|
| GET    | `/categories`      | Yes  | List all (with product counts) |
| POST   | `/categories`      | Yes  | Create                         |
| PATCH  | `/categories/:id`  | Yes  | Update                         |
| DELETE | `/categories/:id`  | Yes  | Delete (guarded)               |

### Products
| Method | Endpoint         | Auth | Description                         |
|--------|------------------|------|-------------------------------------|
| GET    | `/products`      | Yes  | List (filterable by category/status/search) |
| GET    | `/products/:id`  | Yes  | Get single product                  |
| POST   | `/products`      | Yes  | Create                              |
| PATCH  | `/products/:id`  | Yes  | Update (stock field blocked here)   |
| DELETE | `/products/:id`  | Yes  | Delete                              |

### Orders
| Method | Endpoint                | Auth | Description                        |
|--------|-------------------------|------|------------------------------------|
| GET    | `/orders`               | Yes  | List (filterable by status/search) |
| GET    | `/orders/:id`           | Yes  | Get single order (populated)       |
| POST   | `/orders`               | Yes  | Create (atomic stock deduction)    |
| PATCH  | `/orders/:id/status`    | Yes  | Advance status (transition rules)  |
| PATCH  | `/orders/:id/cancel`    | Yes  | Cancel (atomic stock restore)      |

### Inventory
| Method | Endpoint                          | Auth | Description              |
|--------|-----------------------------------|------|--------------------------|
| GET    | `/inventory/restock-queue`        | Yes  | Get low-stock queue      |
| PATCH  | `/inventory/restock/:productId`   | Yes  | Manually restock product |

### Dashboard
| Method | Endpoint              | Auth | Description                        |
|--------|-----------------------|------|------------------------------------|
| GET    | `/dashboard/metrics`  | Yes  | All metrics + activity + summaries |

### Health Check
| Method | Endpoint   | Auth | Description        |
|--------|------------|------|--------------------|
| GET    | `/health`  | No   | Server liveness    |

---

## Architecture Notes

### State Management Strategy

| Concern         | Tool          | Rationale                                           |
|-----------------|---------------|-----------------------------------------------------|
| Server data     | React Query   | Caching, background refetch, optimistic updates     |
| Auth/UI state   | Zustand       | Lightweight, persisted to localStorage via middleware |
| Form state      | React `useState` | Simple controlled components, no over-engineering |
| URL/navigation  | React Router  | Status filters, order IDs live in the URL           |

### Backend Layering (MVC + Services)
```
HTTP Request
    → Route (Express Router)
        → Middleware (JWT auth, rate limit)
            → Controller (thin — input validation, response formatting)
                → Service (business logic: stock deduction, conflict checks)
                    → Model (Mongoose schema + hooks)
                        → MongoDB
```

Controllers never contain business logic. Services never format HTTP responses.
This separation makes logic independently testable.

### Why MongoDB Transactions?

Order creation touches multiple documents atomically:
1. Deduct stock from N product documents
2. Create the order document

If step 2 fails after step 1, stock would be permanently lost without a
transaction. `mongoose.startSession()` + `session.startTransaction()` ensures
all-or-nothing semantics. **This requires a MongoDB replica set.**

---

## Key Business Logic

### Order Creation Flow
```
POST /orders
  │
  ├─ 1. Validate request shape (items array, customer name)
  │
  ├─ 2. validateAndEnrichOrderItems() — read-only pre-flight
  │       ├─ Duplicate product ID check (Set comparison)
  │       ├─ Product existence check (single batched query)
  │       ├─ Status check (must be "Active")
  │       └─ Stock check (quantity ≤ stock)
  │
  ├─ 3. session.startTransaction()
  │
  ├─ 4. deductStockWithSession() — for each item:
  │       ├─ findOneAndUpdate with { stock: { $gte: quantity } }
  │       ├─ Returns null if race condition → throws 409
  │       └─ Sets status: "Out of Stock" if newStock === 0
  │
  ├─ 5. Order.create([{ ... }], { session })
  │
  ├─ 6. session.commitTransaction()
  │
  └─ 7. logActivity() — fire-and-forget, never throws
```

### Order Cancellation Flow
```
PATCH /orders/:id/cancel
  │
  ├─ 1. Validate order exists + status allows cancellation
  │
  ├─ 2. session.startTransaction()
  │
  ├─ 3. restoreStockWithSession() — for each line item:
  │       └─ Aggregation pipeline update:
  │             stock += item.quantity
  │             status = "Active" if was "Out of Stock"
  │
  ├─ 4. order.status = "Cancelled"; order.save({ session })
  │
  └─ 5. session.commitTransaction()
```

### Restock Queue Logic

No separate queue collection. The queue is a live aggregation:
```javascript
Product.aggregate([
  { $match: { $expr: { $lt: ["$stock", "$minStockThreshold"] } } },
  { $addFields: { urgencyRatio: stock / minStockThreshold } },
  { $sort: { urgencyRatio: 1 } }  // 0 = most critical
])
```

This is always perfectly in sync with actual stock — no background jobs,
no sync drift.

---

## License

MIT — free to use, modify, and distribute.