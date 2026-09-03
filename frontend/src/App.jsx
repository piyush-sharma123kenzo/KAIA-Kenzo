import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { LocationProvider } from './context/LocationContext';
import { CompareProvider } from './context/CompareContext';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import BrandLayout from './layouts/BrandLayout';
import AdminLayout from './layouts/AdminLayout';

// Feedback
import PageLoader from './components/feedback/PageLoader';

// Customer Pages (Core)
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
import Returns from './pages/customer/Returns';
import ReturnDetails from './pages/customer/ReturnDetails';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import ForgotPassword from './pages/customer/ForgotPassword';
import ResetPassword from './pages/customer/ResetPassword';
import VerifyEmail from './pages/customer/VerifyEmail';
import VerifyOtp from './pages/customer/VerifyOtp';
import Wishlist from './pages/customer/Wishlist';
import Compare from './pages/customer/Compare';
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
import DirectBrandSupply from './pages/customer/DirectBrandSupply';
import CustomerSupport from './pages/customer/CustomerSupport';
import WarrantyVerification from './pages/customer/WarrantyVerification';
import ShippingRates from './pages/customer/ShippingRates';
import GenuineGuarantee from './pages/customer/GenuineGuarantee';
import KenzoInfoSystems from './pages/customer/KenzoInfoSystems';
import ProtectedRoute from './routes/ProtectedRoute';

// Brand Seller Pages (Lazy Loaded)
const BrandRegister = lazy(() => import('./pages/brand/BrandRegister'));
const SellerDashboard = lazy(() => import('./pages/brand/Dashboard'));
const SellerProducts = lazy(() => import('./pages/brand/Products'));
const SellerAddProduct = lazy(() => import('./pages/brand/AddProduct'));
const SellerOrders = lazy(() => import('./pages/brand/Orders'));
const SellerOrderDetails = lazy(() => import('./pages/brand/OrderDetails'));
const SellerFulfillment = lazy(() => import('./pages/brand/Fulfillment'));
const SellerShipments = lazy(() => import('./pages/brand/Shipments'));
const SellerInventory = lazy(() => import('./pages/brand/Inventory'));
const SellerInvoices = lazy(() => import('./pages/brand/Invoices'));
const SellerReturns = lazy(() => import('./pages/brand/Returns'));
const SellerSales = lazy(() => import('./pages/brand/Sales'));
const SellerEarnings = lazy(() => import('./pages/brand/Earnings'));
const SellerSettlements = lazy(() => import('./pages/brand/Settlements'));
const SellerBrandProfile = lazy(() => import('./pages/brand/BrandProfile'));
const SellerSettings = lazy(() => import('./pages/brand/Settings'));
const SellerAnalytics = lazy(() => import('./pages/brand/Analytics'));
const SellerNotifications = lazy(() => import('./pages/brand/Notifications'));

// Admin Central Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminLogistics = lazy(() => import('./pages/admin/Logistics'));
const AdminInventory = lazy(() => import('./pages/admin/Inventory'));
const AdminInvoices = lazy(() => import('./pages/admin/Invoices'));
const AdminReturns = lazy(() => import('./pages/admin/Returns'));
const AdminRevenue = lazy(() => import('./pages/admin/Revenue'));
const AdminSettlements = lazy(() => import('./pages/admin/Settlements'));
const AdminBrands = lazy(() => import('./pages/admin/Brands'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminAddProduct = lazy(() => import('./pages/admin/AddProduct'));
const AdminEditProduct = lazy(() => import('./pages/admin/EditProduct'));
const AdminCommissions = lazy(() => import('./pages/admin/Commissions'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'));
const AdminPromotions = lazy(() => import('./pages/admin/Promotions'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminWebhooks = lazy(() => import('./pages/admin/Webhooks'));
const AdminSystemHealth = lazy(() => import('./pages/admin/SystemHealth'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminRefunds = lazy(() => import('./pages/admin/Refunds'));
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers'));
const AdminEnquiries = lazy(() => import('./pages/admin/Enquiries'));
const AdminSupportTickets = lazy(() => import('./pages/admin/SupportTickets'));
const AdminDeliveryLocations = lazy(() => import('./pages/admin/DeliveryLocations'));

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <ToastProvider>
          <CartProvider>
            <CompareProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
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
                    <Route path="compare" element={<Compare />} />
                    <Route path="orders" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerOrders /></ProtectedRoute>} />
                    <Route path="orders/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerOrderDetails /></ProtectedRoute>} />
                    <Route path="orders/:id/tracking" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderTracking /></ProtectedRoute>} />
                    <Route path="account/orders/:id/tracking" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderTracking /></ProtectedRoute>} />
                    <Route path="order-details/:orderId" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerOrderDetails /></ProtectedRoute>} />
                    <Route path="order-details/:orderId/tracking" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderTracking /></ProtectedRoute>} />
                    <Route path="returns/request/:orderId" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Returns /></ProtectedRoute>} />
                    <Route path="returns/details/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><ReturnDetails /></ProtectedRoute>} />
                    <Route path="warranty" element={<Warranty />} />
                    <Route path="warranty-check" element={<Warranty />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="brand-register" element={<BrandRegister />} />
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
                    <Route path="catalog" element={<Products />} />
                    <Route path="direct-brand-supply" element={<DirectBrandSupply />} />
                    <Route path="kenzo-info-systems" element={<KenzoInfoSystems />} />
                    <Route path="warranty-verification" element={<WarrantyVerification />} />
                    <Route path="serial-check" element={<WarrantyVerification />} />
                    <Route path="support" element={<CustomerSupport />} />
                    <Route path="customer-support" element={<CustomerSupport />} />
                    <Route path="shipping-rates" element={<ShippingRates />} />
                    <Route path="genuine-product-guarantee" element={<GenuineGuarantee />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="help" element={<Help />} />
                    <Route path="privacy" element={<Privacy />} />
                    <Route path="privacy-policy" element={<Privacy />} />
                    <Route path="terms" element={<Terms />} />
                    <Route path="refund-policy" element={<RefundPolicy />} />
                    <Route path="refund-return-policy" element={<RefundPolicy />} />
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
                    <Route path="enquiries" element={<AdminEnquiries />} />
                    <Route path="support-tickets" element={<AdminSupportTickets />} />
                    <Route path="delivery-locations" element={<AdminDeliveryLocations />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>

                </Routes>
              </Suspense>
            </BrowserRouter>
          </CompareProvider>
        </CartProvider>
      </ToastProvider>
    </LocationProvider>
  </AuthProvider>
);
}

export default App;
