import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

// Paths to verify/create
const dirs = [
  'frontend/src/pages/customer',
  'frontend/src/pages/brand',
  'frontend/src/pages/admin',
  'frontend/src/components/ui',
  'frontend/src/components/common',
  'frontend/src/components/navigation',
  'frontend/src/components/product',
  'frontend/src/components/cart',
  'frontend/src/components/checkout',
  'frontend/src/components/forms',
  'frontend/src/components/feedback',
  'frontend/src/components/dashboard',
  'frontend/src/features/auth',
  'frontend/src/features/products',
  'frontend/src/features/cart',
  'frontend/src/features/wishlist',
  'frontend/src/features/checkout',
  'frontend/src/features/orders',
  'frontend/src/features/payments',
  'frontend/src/features/inventory',
  'frontend/src/features/shipping',
  'frontend/src/features/notifications',
  'frontend/src/hooks',
  'frontend/src/context',
  'frontend/src/services',
  'frontend/src/api',
  'frontend/src/routes',
  'frontend/src/utils',
  'frontend/src/constants',
  'frontend/src/config',
  'frontend/src/styles',
  'backend/models',
  'backend/controllers',
  'backend/routes',
  'backend/middleware',
  'backend/services/payment',
  'backend/services/shipping',
  'backend/services/storage',
  'backend/services/notification',
  'backend/validators',
  'backend/utils',
  'backend/webhooks',
  'backend/jobs'
];

// Reusable React Page Placeholder Template
const getReactPageTemplate = (name) => `import React from 'react';

const ${name} = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-gray-900 tracking-tight uppercase">${name.replace(/([A-Z])/g, ' $1').trim()}</h1>
      <p className="text-xs text-brand-gray-500">KAIA Technologies Platform placeholder screen.</p>
    </div>
  );
};

export default ${name};
`;

// Reusable React UI Component Template
const getReactComponentTemplate = (name) => `import React from 'react';

const ${name} = ({ className = '', children, ...props }) => {
  return (
    <div className={\`p-4 border rounded-sm bg-white \${className}\`} {...props}>
      <span className="text-xs font-bold text-brand-gray-400 uppercase tracking-wider">${name} Component</span>
      {children}
    </div>
  );
};

export default ${name};
`;

// Reusable Service JS Template
const getJsServiceTemplate = (name) => `// KAIA Technologies Service logic
export const ${name} = {
  get: async (params) => {
    console.log('Fetching via ${name}...', params);
    return { success: true, data: [] };
  },
  save: async (payload) => {
    console.log('Saving via ${name}...', payload);
    return { success: true };
  }
};
export default ${name};
`;

// Reusable Context JS Template
const getContextTemplate = (name) => `import React, { createContext, useContext, useState } from 'react';

const ${name}Context = createContext(null);

export const use${name.replace('Context', '')} = () => useContext(${name}Context);

export const ${name}Provider = ({ children }) => {
  const [data, setData] = useState([]);
  return (
    <${name}Context.Provider value={{ data, setData }}>
      {children}
    </${name}Context.Provider>
  );
};
`;

// Reusable Hook JS Template
const getHookTemplate = (name) => `import { useState, useEffect } from 'react';

export const ${name} = () => {
  const [state, setState] = useState(null);
  return state;
};
export default ${name};
`;

// Reusable Util Template
const getUtilTemplate = (name) => `// KAIA Technologies Utility Helper
export const ${name} = (...args) => {
  return args;
};
export default ${name};
`;

// Reusable Mongoose Model Template
const getModelTemplate = (name) => `import mongoose from 'mongoose';

const ${name}Schema = new mongoose.Schema({
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ${name} = mongoose.models.${name} || mongoose.model('${name}', ${nameSchemaName(name)});
export default ${name};
`;

function nameSchemaName(name) {
  return name.charAt(0).toLowerCase() + name.slice(1) + 'Schema';
}

// Reusable Express Controller Template
const getControllerTemplate = (name) => `// KAIA Controller
export const get${name} = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Controller placeholder loaded' });
  } catch (err) {
    next(err);
  }
};
`;

// Reusable Express Route Template
const getRouteTemplate = (name) => `import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Router placeholder loaded' });
});

export default router;
`;

// Files array configuration
const filesToCreate = [
  // Customer pages
  { path: 'frontend/src/pages/customer/Categories.jsx', content: getReactPageTemplate('Categories') },
  { path: 'frontend/src/pages/customer/Brands.jsx', content: getReactPageTemplate('Brands') },
  { path: 'frontend/src/pages/customer/BrandDetails.jsx', content: getReactPageTemplate('BrandDetails') },
  { path: 'frontend/src/pages/customer/Deals.jsx', content: getReactPageTemplate('Deals') },
  { path: 'frontend/src/pages/customer/NewArrivals.jsx', content: getReactPageTemplate('NewArrivals') },
  { path: 'frontend/src/pages/customer/BestSellers.jsx', content: getReactPageTemplate('BestSellers') },
  { path: 'frontend/src/pages/customer/SearchResults.jsx', content: getReactPageTemplate('SearchResults') },
  { path: 'frontend/src/pages/customer/OrderSuccess.jsx', content: getReactPageTemplate('OrderSuccess') },
  { path: 'frontend/src/pages/customer/Orders.jsx', content: getReactPageTemplate('Orders') },
  { path: 'frontend/src/pages/customer/OrderDetails.jsx', content: getReactPageTemplate('OrderDetails') },
  { path: 'frontend/src/pages/customer/OrderTracking.jsx', content: getReactPageTemplate('OrderTracking') },
  { path: 'frontend/src/pages/customer/Wishlist.jsx', content: getReactPageTemplate('Wishlist') },
  { path: 'frontend/src/pages/customer/ForgotPassword.jsx', content: getReactPageTemplate('ForgotPassword') },
  { path: 'frontend/src/pages/customer/Contact.jsx', content: getReactPageTemplate('Contact') },
  { path: 'frontend/src/pages/customer/Help.jsx', content: getReactPageTemplate('Help') },
  { path: 'frontend/src/pages/customer/Privacy.jsx', content: getReactPageTemplate('Privacy') },
  { path: 'frontend/src/pages/customer/Terms.jsx', content: getReactPageTemplate('Terms') },
  { path: 'frontend/src/pages/customer/RefundPolicy.jsx', content: getReactPageTemplate('RefundPolicy') },
  { path: 'frontend/src/pages/customer/SellerPolicy.jsx', content: getReactPageTemplate('SellerPolicy') },

  // Brand pages
  { path: 'frontend/src/pages/brand/EditProduct.jsx', content: getReactPageTemplate('EditProduct') },
  { path: 'frontend/src/pages/brand/OrderDetails.jsx', content: getReactPageTemplate('OrderDetails') },
  { path: 'frontend/src/pages/brand/Analytics.jsx', content: getReactPageTemplate('Analytics') },
  { path: 'frontend/src/pages/brand/Payouts.jsx', content: getReactPageTemplate('Payouts') },
  { path: 'frontend/src/pages/brand/Notifications.jsx', content: getReactPageTemplate('Notifications') },
  { path: 'frontend/src/pages/brand/BrandProfile.jsx', content: getReactPageTemplate('BrandProfile') },

  // Admin pages
  { path: 'frontend/src/pages/admin/Customers.jsx', content: getReactPageTemplate('Customers') },
  { path: 'frontend/src/pages/admin/BrandApproval.jsx', content: getReactPageTemplate('BrandApproval') },
  { path: 'frontend/src/pages/admin/ProductApproval.jsx', content: getReactPageTemplate('ProductApproval') },
  { path: 'frontend/src/pages/admin/Categories.jsx', content: getReactPageTemplate('Categories') },
  { path: 'frontend/src/pages/admin/Orders.jsx', content: getReactPageTemplate('Orders') },
  { path: 'frontend/src/pages/admin/Payments.jsx', content: getReactPageTemplate('Payments') },
  { path: 'frontend/src/pages/admin/Refunds.jsx', content: getReactPageTemplate('Refunds') },
  { path: 'frontend/src/pages/admin/Payouts.jsx', content: getReactPageTemplate('Payouts') },
  { path: 'frontend/src/pages/admin/Inventory.jsx', content: getReactPageTemplate('Inventory') },
  { path: 'frontend/src/pages/admin/Logistics.jsx', content: getReactPageTemplate('Logistics') },
  { path: 'frontend/src/pages/admin/Coupons.jsx', content: getReactPageTemplate('Coupons') },
  { path: 'frontend/src/pages/admin/Reviews.jsx', content: getReactPageTemplate('Reviews') },
  { path: 'frontend/src/pages/admin/Reports.jsx', content: getReactPageTemplate('Reports') },
  { path: 'frontend/src/pages/admin/Analytics.jsx', content: getReactPageTemplate('Analytics') },
  { path: 'frontend/src/pages/admin/Notifications.jsx', content: getReactPageTemplate('Notifications') },
  { path: 'frontend/src/pages/admin/Settings.jsx', content: getReactPageTemplate('Settings') },

  // Components
  { path: 'frontend/src/components/navigation/MobileNavigation.jsx', content: getReactComponentTemplate('MobileNavigation') },
  { path: 'frontend/src/components/product/ProductGallery.jsx', content: getReactComponentTemplate('ProductGallery') },
  { path: 'frontend/src/components/product/ProductPrice.jsx', content: getReactComponentTemplate('ProductPrice') },
  { path: 'frontend/src/components/product/ProductRating.jsx', content: getReactComponentTemplate('ProductRating') },
  { path: 'frontend/src/components/product/ProductBadge.jsx', content: getReactComponentTemplate('ProductBadge') },
  { path: 'frontend/src/components/product/ProductSpecifications.jsx', content: getReactComponentTemplate('ProductSpecifications') },
  { path: 'frontend/src/components/product/RelatedProducts.jsx', content: getReactComponentTemplate('RelatedProducts') },
  
  { path: 'frontend/src/components/cart/CartItem.jsx', content: getReactComponentTemplate('CartItem') },
  { path: 'frontend/src/components/cart/CartSummary.jsx', content: getReactComponentTemplate('CartSummary') },
  { path: 'frontend/src/components/cart/MiniCart.jsx', content: getReactComponentTemplate('MiniCart') },

  { path: 'frontend/src/components/checkout/CheckoutSteps.jsx', content: getReactComponentTemplate('CheckoutSteps') },
  { path: 'frontend/src/components/checkout/AddressForm.jsx', content: getReactComponentTemplate('AddressForm') },
  { path: 'frontend/src/components/checkout/GSTForm.jsx', content: getReactComponentTemplate('GSTForm') },
  { path: 'frontend/src/components/checkout/OrderSummary.jsx', content: getReactComponentTemplate('OrderSummary') },
  { path: 'frontend/src/components/checkout/PaymentMethods.jsx', content: getReactComponentTemplate('PaymentMethods') },

  { path: 'frontend/src/components/forms/SearchInput.jsx', content: getReactComponentTemplate('SearchInput') },

  { path: 'frontend/src/components/feedback/LoadingSpinner.jsx', content: getReactComponentTemplate('LoadingSpinner') },

  { path: 'frontend/src/components/ui/Card.jsx', content: getReactComponentTemplate('Card') },
  { path: 'frontend/src/components/ui/Dropdown.jsx', content: getReactComponentTemplate('Dropdown') },
  { path: 'frontend/src/components/ui/Tabs.jsx', content: getReactComponentTemplate('Tabs') },
  { path: 'frontend/src/components/ui/SectionHeading.jsx', content: getReactComponentTemplate('SectionHeading') },
  { path: 'frontend/src/components/ui/DataTable.jsx', content: getReactComponentTemplate('DataTable') },
  { path: 'frontend/src/components/ui/Pagination.jsx', content: getReactComponentTemplate('Pagination') },

  // Services
  { path: 'frontend/src/services/authService.js', content: getJsServiceTemplate('authService') },
  { path: 'frontend/src/services/productService.js', content: getJsServiceTemplate('productService') },
  { path: 'frontend/src/services/cartService.js', content: getJsServiceTemplate('cartService') },
  { path: 'frontend/src/services/orderService.js', content: getJsServiceTemplate('orderService') },
  { path: 'frontend/src/services/paymentService.js', content: getJsServiceTemplate('paymentService') },
  { path: 'frontend/src/services/shippingService.js', content: getJsServiceTemplate('shippingService') },
  { path: 'frontend/src/services/brandService.js', content: getJsServiceTemplate('brandService') },
  { path: 'frontend/src/services/adminService.js', content: getJsServiceTemplate('adminService') },
  { path: 'frontend/src/services/notificationService.js', content: getJsServiceTemplate('notificationService') },

  // API Client
  { path: 'frontend/src/api/apiClient.js', content: `import axios from 'axios';
const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true
});
export default apiClient;
` },

  // Wishlist Context
  { path: 'frontend/src/context/WishlistContext.jsx', content: getContextTemplate('Wishlist') },

  // Hooks
  { path: 'frontend/src/hooks/useAuth.js', content: getHookTemplate('useAuth') },
  { path: 'frontend/src/hooks/useCart.js', content: getHookTemplate('useCart') },
  { path: 'frontend/src/hooks/useWishlist.js', content: getHookTemplate('useWishlist') },
  { path: 'frontend/src/hooks/useDebounce.js', content: getHookTemplate('useDebounce') },
  { path: 'frontend/src/hooks/useFetch.js', content: getHookTemplate('useFetch') },
  { path: 'frontend/src/hooks/useLocalStorage.js', content: getHookTemplate('useLocalStorage') },

  // Utils
  { path: 'frontend/src/utils/formatCurrency.js', content: getUtilTemplate('formatCurrency') },
  { path: 'frontend/src/utils/formatDate.js', content: getUtilTemplate('formatDate') },
  { path: 'frontend/src/utils/validation.js', content: getUtilTemplate('validation') },
  { path: 'frontend/src/utils/slugify.js', content: getUtilTemplate('slugify') },
  { path: 'frontend/src/utils/storage.js', content: getUtilTemplate('storage') },
  { path: 'frontend/src/utils/constants.js', content: `export const CONSTANTS = { PLATFORM_NAME: 'KAIA Technologies' };` },

  // Routing elements
  { path: 'frontend/src/routes/AppRoutes.jsx', content: getReactComponentTemplate('AppRoutes') },
  { path: 'frontend/src/routes/CustomerRoutes.jsx', content: getReactComponentTemplate('CustomerRoutes') },
  { path: 'frontend/src/routes/BrandRoutes.jsx', content: getReactComponentTemplate('BrandRoutes') },
  { path: 'frontend/src/routes/AdminRoutes.jsx', content: getReactComponentTemplate('AdminRoutes') },
  { path: 'frontend/src/routes/ProtectedRoute.jsx', content: `import React from 'react';
import { Navigate } from 'react-router-dom';
export const ProtectedRoute = ({ children }) => children;
export default ProtectedRoute;
` },

  // Env files
  { path: 'frontend/.env.example', content: `VITE_API_URL=http://localhost:5000/api` },
  { path: 'backend/.env.example', content: `MONGO_URI=mongodb://127.0.0.1:27017/kaia-tech
PORT=5000
JWT_SECRET=supersecretsecret
JWT_REFRESH_SECRET=supersecretrefresh
RAZORPAY_KEY_ID=mock_id
RAZORPAY_KEY_SECRET=mock_secret
RAZORPAY_WEBHOOK_SECRET=mock_webhook
AWS_ACCESS_KEY_ID=mock_aws_id
AWS_SECRET_ACCESS_KEY=mock_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=kaia-payouts
SHIPPING_API_KEY=mock_ship_key
SHIPPING_API_SECRET=mock_ship_secret
` },

  // Backend missing Models
  { path: 'backend/models/Inventory.js', content: getModelTemplate('Inventory') },
  { path: 'backend/models/Wishlist.js', content: getModelTemplate('Wishlist') },
  { path: 'backend/models/Address.js', content: getModelTemplate('Address') },
  { path: 'backend/models/OrderItem.js', content: getModelTemplate('OrderItem') },
  { path: 'backend/models/Payment.js', content: getModelTemplate('Payment') },
  { path: 'backend/models/Commission.js', content: getModelTemplate('Commission') },
  { path: 'backend/models/Payout.js', content: getModelTemplate('Payout') },
  { path: 'backend/models/Shipment.js', content: getModelTemplate('Shipment') },
  { path: 'backend/models/Invoice.js', content: getModelTemplate('Invoice') },

  // Backend missing controllers
  { path: 'backend/controllers/user.controller.js', content: getControllerTemplate('User') },
  { path: 'backend/controllers/wishlist.controller.js', content: getControllerTemplate('Wishlist') },
  { path: 'backend/controllers/shipping.controller.js', content: getControllerTemplate('Shipping') },

  // Backend missing routes
  { path: 'backend/routes/user.routes.js', content: getRouteTemplate('user') },
  { path: 'backend/routes/wishlist.routes.js', content: getRouteTemplate('wishlist') },
  { path: 'backend/routes/shipping.routes.js', content: getRouteTemplate('shipping') },
  { path: 'backend/routes/webhook.routes.js', content: getRouteTemplate('webhook') },

  // Backend missing middleware
  { path: 'backend/middleware/auth.middleware.js', content: `export const authMiddleware = (req, res, next) => next();` },
  { path: 'backend/middleware/role.middleware.js', content: `export const roleMiddleware = (role) => (req, res, next) => next();` },
  { path: 'backend/middleware/error.middleware.js', content: `export const errorMiddleware = (err, req, res, next) => res.status(500).json({ success: false, error: err.message });` },
  { path: 'backend/middleware/notFound.middleware.js', content: `export const notFoundMiddleware = (req, res) => res.status(404).json({ success: false, message: 'Route Not Found' });` },
  { path: 'backend/middleware/validation.middleware.js', content: `export const validationMiddleware = (schema) => (req, res, next) => next();` },

  // Backend services
  { path: 'backend/services/payment/payment.service.js', content: `export const paymentService = {};` },
  { path: 'backend/services/payment/razorpay.service.js', content: `export const razorpayService = {};` },
  { path: 'backend/services/payment/cashfree.service.js', content: `export const cashfreeService = {};` },
  { path: 'backend/services/shipping/shipping.service.js', content: `export const shippingService = {};` },
  { path: 'backend/services/storage/storage.service.js', content: `export const storageService = {};` },
  { path: 'backend/services/storage/s3.service.js', content: `export const s3Service = {};` },
  { path: 'backend/services/notification/notification.service.js', content: `export const notificationService = {};` }
];

console.log('Initializing directory layout...');

// Create directories first
dirs.forEach((dir) => {
  const fullPath = path.join(ROOT_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log('Created folder:', dir);
  }
});

// Create files
filesToCreate.forEach((file) => {
  const fullPath = path.join(ROOT_DIR, file.path);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, file.content, 'utf-8');
    console.log('Created file:', file.path);
  } else {
    console.log('Skipped (already exists):', file.path);
  }
});

console.log('Placeholder assets successfully verified & generated!');
