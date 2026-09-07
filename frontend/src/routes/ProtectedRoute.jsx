import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
        <div className="animate-spin h-8 w-8 text-brand-accent border-4 border-t-brand-accent border-brand-gray-200 rounded-full" />
      </div>
    );
  }

  if (!user) {
    // Redirect toward sign-in, caching original destination
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  // Role permissions checks (case-insensitive for robust role verification)
  const userRole = (user.role || '').toUpperCase();
  const normalizedAllowedRoles = allowedRoles ? allowedRoles.map((r) => r.toUpperCase()) : null;

  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(userRole)) {
    if (userRole === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 'BRAND') {
      return <Navigate to="/brand/dashboard" replace />;
    } else {
      return <Navigate to="/account" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
