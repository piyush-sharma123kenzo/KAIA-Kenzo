import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import connectDB from './config/db.js';
import { rawBodyPreserver } from './middleware/webhookMiddleware.js';

// Load route definitions
import authRoutes from './routes/authRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import warrantyRoutes from './routes/warrantyRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import brandSellerRoutes from './routes/brandSellerRoutes.js';
import shippingRoutes from './routes/shipping.routes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';

// Load dotenv pointing to parent directory if .env is at root
dotenv.config({ path: '../.env' });
dotenv.config(); // Fallback for local backend .env

// Connect to MongoDB database
connectDB();

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow local images to load in frontend
}));

const allowedOrigins = [
  'https://kaia-kenzo.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight options requests

// Parse JSON and preserve raw body for webhook signature verification
// The rawBodyPreserver captures the raw Buffer before parsing, required by Razorpay webhook verification.
app.use(express.json({
  verify: rawBodyPreserver,
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static directories setup
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Route Middleware mapping
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/warranties', warrantyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/brand', brandSellerRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/delivery', deliveryRoutes);

// Health check endpoints for monitoring and container orchestrators
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'KAIA Technologies Marketplace API',
    uptime: process.uptime(),
  });
});

app.get('/health/db', (req, res) => {
  const isConnected = connectDB.isConnected ? connectDB.isConnected() : true;
  res.status(200).json({
    status: 'healthy',
    database: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Root route welcome message
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the KAIA Technologies Marketplace REST API Server.',
    status: 'online',
    version: '1.0.0',
  });
});

// Error handling middleware for 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Looks like this technology went offline. API endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Global Error:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'KAIA is having trouble connecting. Please try again.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`KAIA API Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown
const handleShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
