import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BODY_LIMIT = '5mb';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role', 'x-user-email']
}));

app.use(morgan('combined'));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' }
});

app.use(globalLimiter);
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// JWT Authentication Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.headers['x-user-id'] = decoded.id;
    req.headers['x-user-role'] = decoded.role;
    req.headers['x-user-email'] = decoded.email;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// Role-based access control
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required.' });
};

// Custom proxy function using axios
const forwardRequest = async (req, res, targetUrl) => {
  try {
    console.log(`[PROXY] ${req.method} ${req.path} -> ${targetUrl}`);
    console.log(`[PROXY] Request body:`, req.body);
    
    const headers = {
      ...req.headers,
      'Content-Type': 'application/json'
    };
    
    // Add user context headers if available
    if (req.user) {
      headers['x-user-id'] = req.user.id || '';
      headers['x-user-role'] = req.user.role || '';
      headers['x-user-email'] = req.user.email || '';
    }
    
    // Remove host header to avoid conflicts
    delete headers['host'];
    
    const config = {
      method: req.method,
      url: targetUrl,
      headers: headers,
      params: req.query, // Forward query parameters
      validateStatus: () => true, // Don't throw on any status code
      responseType: 'json' // Parse response as JSON
    };
    
    // Add body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      config.data = req.body;
    }
    
    console.log(`[PROXY] Making request to ${targetUrl} with method ${req.method}`);
    const response = await axios(config);
    
    console.log(`[PROXY] Response status: ${response.status}`, `Response data:`, response.data);
    
    // Forward response status and body directly
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error(`[PROXY ERROR] Forwarding to ${targetUrl}:`, err.message, err.stack);
    res.status(502).json({ error: 'Service temporarily unavailable', details: err.message });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'API Gateway',
    timestamp: new Date().toISOString(),
    services: {
      auth: process.env.AUTH_SERVICE_URL,
      product: process.env.PRODUCT_SERVICE_URL,
      inventory: process.env.INVENTORY_SERVICE_URL,
      supplier: process.env.SUPPLIER_SERVICE_URL
    }
  });
});

// ── AUTH ROUTES ──────────────────────────────────────────────────────────────
// Protected auth routes (users management)
app.all('/api/auth/users*', authenticate, (req, res) => {
  const path = req.path.replace('/api/auth', '');
  forwardRequest(req, res, `${process.env.AUTH_SERVICE_URL}/api/auth${path}`);
});

// Public auth routes (login, register)
app.all('/api/auth/*', authLimiter, (req, res) => {
  const path = req.path.replace('/api/auth', '');
  forwardRequest(req, res, `${process.env.AUTH_SERVICE_URL}/api/auth${path}`);
});

// ── PRODUCT ROUTES (protected) ────────────────────────────────────────────────
app.all('/api/products/*', authenticate, (req, res) => {
  const path = req.path.replace('/api/products', '');
  forwardRequest(req, res, `${process.env.PRODUCT_SERVICE_URL}/api/products${path}`);
});

app.all('/api/categories/*', authenticate, (req, res) => {
  const path = req.path.replace('/api/categories', '');
  forwardRequest(req, res, `${process.env.PRODUCT_SERVICE_URL}/api/categories${path}`);
});

// Handle root /api/categories and /api/products without trailing path
app.all('/api/products', authenticate, (req, res) => {
  forwardRequest(req, res, `${process.env.PRODUCT_SERVICE_URL}/api/products`);
});

app.all('/api/categories', authenticate, (req, res) => {
  forwardRequest(req, res, `${process.env.PRODUCT_SERVICE_URL}/api/categories`);
});

// ── INVENTORY ROUTES (protected) ─────────────────────────────────────────────
app.all('/api/inventory/*', authenticate, (req, res) => {
  const path = req.path.replace('/api/inventory', '');
  forwardRequest(req, res, `${process.env.INVENTORY_SERVICE_URL}/api/inventory${path}`);
});

app.all('/api/inventory', authenticate, (req, res) => {
  forwardRequest(req, res, `${process.env.INVENTORY_SERVICE_URL}/api/inventory`);
});

app.all('/api/transactions/*', authenticate, (req, res) => {
  const path = req.path.replace('/api/transactions', '');
  forwardRequest(req, res, `${process.env.INVENTORY_SERVICE_URL}/api/transactions${path}`);
});

app.all('/api/transactions', authenticate, (req, res) => {
  forwardRequest(req, res, `${process.env.INVENTORY_SERVICE_URL}/api/transactions`);
});

// ── SUPPLIER ROUTES (protected) ───────────────────────────────────────────────
app.all('/api/suppliers/*', authenticate, (req, res) => {
  const path = req.path.replace('/api/suppliers', '');
  forwardRequest(req, res, `${process.env.SUPPLIER_SERVICE_URL}/api/suppliers${path}`);
});

app.all('/api/suppliers', authenticate, (req, res) => {
  forwardRequest(req, res, `${process.env.SUPPLIER_SERVICE_URL}/api/suppliers`);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(500).json({ error: 'Internal gateway error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`   Auth     → ${process.env.AUTH_SERVICE_URL}`);
  console.log(`   Products → ${process.env.PRODUCT_SERVICE_URL}`);
  console.log(`   Inventory→ ${process.env.INVENTORY_SERVICE_URL}`);
  console.log(`   Supplier → ${process.env.SUPPLIER_SERVICE_URL}\n`);
});

export default app;
