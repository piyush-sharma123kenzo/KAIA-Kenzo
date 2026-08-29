import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, PackageOpen, LayoutDashboard, Landmark, Users2, ShieldAlert, LogOut, FileText, Settings, ShieldCheck
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { name: 'Console Home', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Brand Approvals', path: '/admin/brands', icon: Building2 },
    { name: 'Product Listings', path: '/admin/products', icon: PackageOpen },
    { name: 'Commissions Ledger', path: '/admin/commissions', icon: Landmark },
    { name: 'Accounts Directory', path: '/admin/users', icon: Users2 },
    { name: 'Audit Event Logs', path: '/admin/audit-logs', icon: FileText },
  ];

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-premium border border-brand-gray-200 text-center">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-brand-gray-900 mb-2">Access Unauthorized</h2>
          <p className="text-sm text-brand-gray-600 mb-6">
            Only central marketplace administrators can access the enterprise control console. If you are a platform administrator, please log in with administrative permissions.
          </p>
          <div className="space-y-3">
            <Link to="/login" className="block w-full bg-brand-dark text-white py-2 px-4 text-sm font-semibold rounded-sm hover:bg-brand-gray-800">
              Sign In to Console
            </Link>
            <Link to="/" className="block text-sm text-brand-accent font-medium hover:underline">
              Back to Customer Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-gray-100 font-sans overflow-hidden">
      
      {/* Sidebar Control Panel */}
      <aside className="w-64 bg-brand-dark text-brand-gray-300 flex flex-col justify-between border-r border-brand-gray-850">
        <div>
          {/* Logo Header */}
          <div className="p-6 border-b border-brand-gray-850 flex items-center space-x-3">
            <ShieldCheck className="w-6 h-6 text-brand-accent shrink-0" />
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-tight leading-none">KAIA Central</h2>
              <span className="text-[9px] text-brand-gray-500 font-bold uppercase tracking-wider block mt-1">
                Enterprise Console
              </span>
            </div>
          </div>

          {/* Nav Menu */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-sm text-xs font-semibold tracking-wide uppercase transition-all ${
                    isActive(item.path)
                      ? 'bg-brand-accent text-white font-bold'
                      : 'hover:bg-brand-gray-850 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-brand-gray-850 space-y-2">
          <Link
            to="/"
            className="flex items-center space-x-3 px-4 py-2 rounded-sm text-xs font-semibold hover:bg-brand-gray-850 text-brand-gray-400"
          >
            <span>Exit to Site</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-sm text-xs font-semibold hover:bg-brand-gray-850 text-red-400"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Frame */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-brand-gray-200 px-8 flex justify-between items-center z-10 shrink-0">
          <div>
            <h1 className="text-sm font-extrabold uppercase tracking-wider text-brand-gray-800">
              {menuItems.find(m => isActive(m.path))?.name || 'Central Console'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-800 rounded uppercase tracking-wider">
              System Admin
            </span>
            <div className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center font-bold text-white text-xs">
              A
            </div>
          </div>
        </header>

        {/* Scrolling Viewport */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;
