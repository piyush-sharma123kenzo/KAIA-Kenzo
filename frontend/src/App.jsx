import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { LocationProvider } from './context/LocationContext';

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
import PaymentPending from './pages/customer/PaymentPending';
import PaymentFailed from './pages/customer/PaymentFailed';
import Account from './pages/customer/Account';
import CustomerOrders from './pages/customer/Orders';
import CustomerOrderDetails from './pages/customer/OrderDetails';
import OrderTracking from './pages/customer/OrderTracking';
import CustomerReturns from './pages/customer/Returns';
import CustomerReturnDetails from './pages/customer/ReturnDetails';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import ForgotPassword from './pages/customer/ForgotPassword';
import ResetPassword from './pages/customer/ResetPassword';
import VerifyEmail from './pages/customer/VerifyEmail';
import VerifyOtp from './pages/customer/VerifyOtp';
import Wishlist from './pages/customer/Wishlist';
import Warranty from './pages/customer/Warranty';
import Deals from './pages/customer/Deals';
import NewArrivals from './pages/customer/NewArrivals';
import BestSellers from './pages/customer/BestSellers';
import About from './pages/customer/About';
import Contact from './pages/customer/Contact';
import Help from './pages/customer/Help';
import Privacy from './pages/customer/Privacy';
import Terms from './pages/customer/Terms';
import RefundPolicy from './pages/customer/RefundPolicy';
import ShippingPolicy from './pages/customer/ShippingPolicy';
import WarrantyPolicy from './pages/customer/WarrantyPolicy';
import SellerPolicy from './pages/customer/SellerPolicy';
import ProtectedRoute from './routes/ProtectedRoute';

// Brand Seller Pages
import BrandRegister from './pages/brand/BrandRegister';
import SellerDashboard from './pages/brand/Dashboard';
import SellerProducts from './pages/brand/Products';
import SellerAddProduct from './pages/brand/AddProduct';
import SellerOrders from './pages/brand/Orders';
import SellerOrderDetails from './pages/brand/OrderDetails';
import SellerFulfillment from './pages/brand/Fulfillment';
import SellerShipments from './pages/brand/Shipments';
import SellerInventory from './pages/brand/Inventory';
import SellerInvoices from './pages/brand/Invoices';
import SellerReturns from './pages/brand/Returns';
import SellerSales from './pages/brand/Sales';
import SellerEarnings from './pages/brand/Earnings';
import SellerSettlements from './pages/brand/Settlements';
import SellerBrandProfile from './pages/brand/BrandProfile';
import SellerSettings from './pages/brand/Settings';
import SellerAnalytics from './pages/brand/Analytics';
import SellerNotifications from './pages/brand/Notifications';

// Admin Central Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminLogistics from './pages/admin/Logistics';
import AdminInventory from './pages/admin/Inventory';
import AdminInvoices from './pages/admin/Invoices';
import AdminReturns from './pages/admin/Returns';
import AdminRevenue from './pages/admin/Revenue';
import AdminSettlements from './pages/admin/Settlements';
import AdminBrands from './pages/admin/Brands';
import AdminProducts from './pages/admin/Products';
import AdminAddProduct from './pages/admin/AddProduct';
import AdminEditProduct from './pages/admin/EditProduct';
import AdminCommissions from './pages/admin/Commissions';
import AdminUsers from './pages/admin/Users';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminAnalytics from './pages/admin/Analytics';
import AdminCategories from './pages/admin/Categories';
import AdminPayments from './pages/admin/Payments';
import AdminCoupons from './pages/admin/Coupons';
import AdminPromotions from './pages/admin/Promotions';
import AdminReports from './pages/admin/Reports';
import AdminWebhooks from './pages/admin/Webhooks';
import AdminSystemHealth from './pages/admin/SystemHealth';
import AdminReviews from './pages/admin/Reviews';
import AdminSettings from './pages/admin/Settings';
import AdminRefunds from './pages/admin/Refunds';
import AdminNotifications from './pages/admin/Notifications';
import AdminCustomers from './pages/admin/Customers';

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
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
                <Route path="payment-pending" element={<PaymentPending />} />
                <Route path="payment-failed" element={<PaymentFailed />} />
                <Route path="account" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Account /></ProtectedRoute>} />
                <Route path="account/orders" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerOrders /></ProtectedRoute>} />
                <Route path="account/wishlist" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Wishlist /></ProtectedRoute>} />
                <Route path="wishlist" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Wishlist /></ProtectedRoute>} />
                <Route path="orders" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerOrders /></ProtectedRoute>} />
                <Route path="orders/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerOrderDetails /></ProtectedRoute>} />
                <Route path="orders/:id/tracking" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderTracking /></ProtectedRoute>} />
                <Route path="account/orders/:id/tracking" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderTracking /></ProtectedRoute>} />
                <Route path="order-details/:orderId" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerOrderDetails /></ProtectedRoute>} />
                <Route path="order-details/:orderId/tracking" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderTracking /></ProtectedRoute>} />
                <Route path="account/returns" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerReturns /></ProtectedRoute>} />
                <Route path="account/returns/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerReturnDetails /></ProtectedRoute>} />
                <Route path="warranty" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Warranty /></ProtectedRoute>} />
                <Route path="warranties" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Warranty /></ProtectedRoute>} />
                <Route path="account/warranties" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Warranty /></ProtectedRoute>} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="brand/register" element={<BrandRegister />} />
                <Route path="categories" element={<Categories />} />
                <Route path="category/:slug" element={<CategoryDetails />} />
                <Route path="categories/:slug" element={<CategoryDetails />} />
                <Route path="brands" element={<Brands />} />
                <Route path="brand/:slug" element={<BrandDetails />} />
                <Route path="brands/:slug" element={<BrandDetails />} />
                <Route path="deals" element={<Deals />} />
                <Route path="new-arrivals" element={<NewArrivals />} />
                <Route path="best-sellers" element={<BestSellers />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="verify-email" element={<VerifyEmail />} />
                <Route path="verify-otp" element={<VerifyOtp />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="help" element={<Help />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
                <Route path="refund-policy" element={<RefundPolicy />} />
                <Route path="return-policy" element={<RefundPolicy />} />
                <Route path="shipping-policy" element={<ShippingPolicy />} />
                <Route path="warranty-policy" element={<WarrantyPolicy />} />
                <Route path="seller-policy" element={<SellerPolicy />} />
                
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
                <Route path="orders/:id" element={<SellerOrderDetails />} />
                <Route path="fulfillment" element={<SellerFulfillment />} />
                <Route path="shipments" element={<SellerShipments />} />
                <Route path="inventory" element={<SellerInventory />} />
                <Route path="invoices" element={<SellerInvoices />} />
                <Route path="returns" element={<SellerReturns />} />
                <Route path="sales" element={<SellerEarnings />} />
                <Route path="earnings" element={<SellerEarnings />} />
                <Route path="settlements" element={<SellerSettlements />} />
                <Route path="analytics" element={<SellerAnalytics />} />
                <Route path="notifications" element={<SellerNotifications />} />
                <Route path="profile" element={<SellerBrandProfile />} />
                <Route path="settings" element={<SellerSettings />} />
              </Route>

              {/* ADMIN APP FLOW */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrders />} />
                <Route path="shipments" element={<AdminLogistics />} />
                <Route path="logistics" element={<AdminLogistics />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="serials" element={<AdminInventory />} />
                <Route path="invoices" element={<AdminInvoices />} />
                <Route path="returns" element={<AdminReturns />} />
                <Route path="revenue" element={<AdminRevenue />} />
                <Route path="settlements" element={<AdminSettlements />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/add" element={<AdminAddProduct />} />
                <Route path="products/edit/:id" element={<AdminEditProduct />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="commissions" element={<AdminCommissions />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="promotions" element={<AdminPromotions />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="refunds" element={<AdminRefunds />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="webhooks" element={<AdminWebhooks />} />
                <Route path="system-health" element={<AdminSystemHealth />} />
                <Route path="system" element={<AdminSystemHealth />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </LocationProvider>
  </AuthProvider>
);
}

export default App;
