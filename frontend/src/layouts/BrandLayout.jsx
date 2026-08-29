import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingBag, ClipboardList, TrendingUp, Users, Settings, Bell, LogOut, ShieldAlert
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const BrandLayout = () => {
  const { user, brand, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { name: 'Dashboard', path: '/brand/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/brand/products', icon: Package },
    { name: 'Incoming Orders', path: '/brand/orders', icon: ShoppingBag },
    { name: 'Inventory & Serials', path: '/brand/inventory', icon: ClipboardList },
    { name: 'Sales & Ledger', path: '/brand/sales', icon: TrendingUp },
    { name: 'Settings', path: '/brand/settings', icon: Settings },
  ];

  if (!user || user.role !== 'BRAND') {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-premium border border-brand-gray-200 text-center">
          <ShieldAlert className="w-12 h-12 text-brand-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-brand-gray-900 mb-2">Partner Access Denied</h2>
          <p className="text-sm text-brand-gray-600 mb-6">
            Only authorized KAIA brand seller accounts can view this dashboard. Please sign in with brand operator credentials.
          </p>
          <div className="space-y-3">
            <Link to="/brand/login" className="block w-full bg-brand-dark text-white py-2 px-4 text-sm font-semibold rounded-sm hover:bg-brand-gray-800">
              Sign In to Brand Hub
            </Link>
            <Link to="/" className="block text-sm text-brand-accent font-medium hover:underline">
              Back to Marketplace Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle brand approval pending state
  if (brand && brand.status !== 'Approved') {
    return (
      <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-brand-surface p-8 rounded-sm border border-brand-gray-850 text-center space-y-6">
          <div className="inline-block p-4 rounded-full bg-brand-accent/10 border border-brand-accent/20">
            <ShieldAlert className="w-10 h-10 text-brand-accent" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Brand Status: {brand.status}</h2>
            <p className="text-sm text-brand-gray-400 max-w-md mx-auto">
              Your registration for <span className="font-semibold text-white">{brand.name}</span> is currently {brand.status.toLowerCase()}.
              Our platform administrators will review your tax details and documentation before granting dashboard permissions.
            </p>
          </div>
          {brand.status === 'Rejected' && (
            <div className="p-4 bg-red-950/20 border border-red-900/50 rounded text-left text-sm text-red-300">
              <span className="font-semibold block mb-1">Rejection Reason:</span>
              {brand.rejectionReason || 'Tax/Bank credentials mismatch. Please contact support@kaia.tech.'}
            </div>
          )}
          <div className="pt-4 border-t border-brand-gray-850 flex justify-between items-center text-sm">
            <button onClick={logout} className="text-brand-gray-400 hover:text-white transition-colors">
              Sign Out
            </button>
            <Link to="/" className="text-brand-accent hover:underline font-medium">
              Return to Customer Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-gray-50 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-brand-dark text-brand-gray-300 flex flex-col justify-between border-r border-brand-gray-850">
        <div>
          {/* Sidebar Brand Header */}
          <div className="p-6 border-b border-brand-gray-850 flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-brand-accent flex items-center justify-center text-white font-bold text-lg">
              K
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight leading-none">Brand Hub</h2>
              <span className="text-[10px] text-brand-accent tracking-wider font-semibold uppercase mt-1 block">
                {brand?.name || 'Selly Operator'}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1.5 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-sm text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-brand-accent text-white font-semibold'
                      : 'hover:bg-brand-gray-850 hover:text-white'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-brand-gray-850 space-y-2">
          <Link
            to="/"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-sm text-xs font-semibold hover:bg-brand-gray-850 hover:text-white text-brand-gray-400"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Go to Customer Site</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-sm text-xs font-semibold hover:bg-brand-gray-850 text-red-400"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Partner</span>
          </button>
        </div>
      </aside>

      {/* Main Content Dashboard Frame */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-brand-gray-200 px-8 flex justify-between items-center z-10 shrink-0">
          <div>
            <h1 className="text-lg font-bold text-brand-gray-800">
              {menuItems.find(m => isActive(m.path))?.name || 'Portal'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Notification Dropdown toggler */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-full hover:bg-brand-gray-100 text-brand-gray-600 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
              </button>
            </div>

            {/* Operator info details */}
            <div className="flex items-center space-x-3 border-l border-brand-gray-200 pl-6">
              <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center font-bold text-brand-accent text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-brand-gray-800 leading-none">{user.name}</p>
                <p className="text-[10px] text-brand-gray-500 mt-1">Brand Admin</p>
              </div>
            </div>

          </div>
        </header>

        {/* Dashboard Content scrolling wrapper */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default BrandLayout;
