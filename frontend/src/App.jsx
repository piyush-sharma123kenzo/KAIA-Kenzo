import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import BrandLayout from './layouts/BrandLayout';
import AdminLayout from './layouts/AdminLayout';

// Customer Pages
import Home from './pages/customer/Home';
import Products from './pages/customer/Products';
import ProductDetails from './pages/customer/ProductDetails';
import Categories from './pages/customer/Categories';
import CategoryDetails from './pages/customer/CategoryDetails';
import Brands from './pages/customer/Brands';
import BrandDetails from './pages/customer/BrandDetails';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderSuccess from './pages/customer/OrderSuccess';
import Account from './pages/customer/Account';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import ForgotPassword from './pages/customer/ForgotPassword';
import ResetPassword from './pages/customer/ResetPassword';
import VerifyEmail from './pages/customer/VerifyEmail';
import ProtectedRoute from './routes/ProtectedRoute';

// Brand Seller Pages
import BrandRegister from './pages/brand/BrandRegister';
import SellerDashboard from './pages/brand/Dashboard';
import SellerProducts from './pages/brand/Products';
import SellerAddProduct from './pages/brand/AddProduct';
import SellerOrders from './pages/brand/Orders';
import SellerInventory from './pages/brand/Inventory';
import SellerSales from './pages/brand/Sales';
import SellerSettings from './pages/brand/Settings';

// Admin Central Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminBrands from './pages/admin/Brands';
import AdminProducts from './pages/admin/Products';
import AdminCommissions from './pages/admin/Commissions';
import AdminUsers from './pages/admin/Users';
import AdminAuditLogs from './pages/admin/AuditLogs';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              
              {/* BUYER / CUSTOMER APP FLOW */}
              <Route path="/" element={<CustomerLayout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="product/:slug" element={<ProductDetails />} />
                <Route path="products/:slug" element={<ProductDetails />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="order-success" element={<OrderSuccess />} />
                <Route path="account" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Account /></ProtectedRoute>} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="brand/register" element={<BrandRegister />} />
                <Route path="categories" element={<Categories />} />
                <Route path="categories/:slug" element={<CategoryDetails />} />
                <Route path="brands" element={<Brands />} />
                <Route path="brands/:slug" element={<BrandDetails />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="verify-email" element={<VerifyEmail />} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>

              {/* BRAND SELLER APP FLOW */}
              <Route path="/brand" element={<ProtectedRoute allowedRoles={['BRAND']}><BrandLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/brand/dashboard" replace />} />
                <Route path="dashboard" element={<SellerDashboard />} />
                <Route path="products" element={<SellerProducts />} />
                <Route path="products/new" element={<SellerAddProduct />} />
                <Route path="products/edit/:id" element={<SellerAddProduct />} />
                <Route path="orders" element={<SellerOrders />} />
                <Route path="inventory" element={<SellerInventory />} />
                <Route path="sales" element={<SellerSales />} />
                <Route path="settings" element={<SellerSettings />} />
              </Route>

              {/* ADMIN APP FLOW */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="commissions" element={<AdminCommissions />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
              </Route>

            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
