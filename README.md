# <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='40' height='40' style='display:inline-block;vertical-align:middle;margin-right:10px'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300D9FF;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%2300FF88;stop-opacity:1'/%3E%3C/linearGradient%3E%3Cfilter id='shadow'%3E%3CfeDropShadow dx='0' dy='2' stdDeviation='3' flood-opacity='0.3'/%3E%3C/filter%3E%3C/defs%3E%3Crect x='40' y='40' width='50' height='50' fill='url(%23grad)' rx='6' filter='url(%23shadow)' opacity='0.9'/%3E%3Crect x='100' y='40' width='50' height='50' fill='url(%23grad)' rx='6' filter='url(%23shadow)' opacity='0.7'/%3E%3Crect x='40' y='100' width='50' height='50' fill='url(%23grad)' rx='6' filter='url(%23shadow)' opacity='0.7'/%3E%3Crect x='100' y='100' width='50' height='50' fill='url(%23grad)' rx='6' filter='url(%23shadow)' opacity='0.9'/%3E%3Ctext x='100' y='110' font-size='40' font-weight='bold' fill='%23fff' text-anchor='middle' dominant-baseline='middle' opacity='0.15'%3E✓%3C/text%3E%3C/svg%3E" alt="InvenTrack Logo" /> InvenTrack

**Microservices Inventory Management System**

Enterprise-grade inventory tracking with real-time analytics, CSV exports, and interactive dashboards.

## Architecture

```
inventrack/
├── api-gateway/        → Port 3000 (Entry point, JWT auth, proxying)
├── auth-service/       → Port 3001 (Register, Login, JWT)
├── product-service/    → Port 3002 (Products, Categories, Cache)
├── inventory-service/  → Port 3003 (Stock, Transactions, Alerts, Cache)
├── supplier-service/   → Port 3004 (Supplier CRUD)
├── frontend/           → Port 5173 (React + Vite)
├── seed.js             → Database seeder
└── package.json        → Root runner
```

## Quick Start

### 1. Install all dependencies

```bash
cd inventrack
npm install          # installs concurrently for root
npm run install:all  # installs deps for all 6 services
```

### 2. Seed the database

```bash
npm run seed
```

This creates:
- 2 users (admin + staff)
- 5 categories
- 10 products
- 10 stock records
- 5 suppliers

### 3. Start all services

```bash
npm run dev
```

All 6 services start simultaneously with colour-coded logs.

### 4. Open the app

Visit → **http://localhost:5173**

## Login Credentials

| Role  | Email                      | Password  |
|-------|---------------------------|-----------|
| Admin | admin@inventrack.com       | admin123  |
| Staff | staff@inventrack.com       | staff123  |

## Features

| Module       | Features |
|-------------|----------|
| Auth        | Register, Login, JWT, bcrypt, Role-based access |
| Products    | CRUD, categories, search, pagination, caching |
| Inventory   | Stock tracking, 5 transaction types, low-stock alerts, caching |
| Suppliers   | CRUD, search, ratings, address |
| Transactions| Full history, type filter, pagination |
| Dashboard   | Live stats, low-stock panel, recent transactions |

## API Endpoints (via Gateway on :3000)

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/auth/users          (admin)
PUT    /api/auth/users/:id/role (admin)

GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id        (admin)
GET    /api/categories
POST   /api/categories

GET    /api/inventory
GET    /api/inventory/alerts/low-stock
GET    /api/inventory/dashboard/summary
POST   /api/inventory
POST   /api/inventory/:productId/adjust
PUT    /api/inventory/:productId

GET    /api/transactions

GET    /api/suppliers
POST   /api/suppliers
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id       (admin)
```

## Caching

- Product list: 5 min TTL, invalidated on write
- Inventory/stock: 2 min TTL, invalidated on every adjustment
- Low stock alerts: 60 sec TTL

## Security

- JWT tokens (7 day expiry)
- bcrypt password hashing (salt rounds: 12)
- Helmet HTTP headers on all services
- CORS configured
- Rate limiting: 500 req/15min global, 20 req/15min on auth
- Role-based access: Admin vs Staff
