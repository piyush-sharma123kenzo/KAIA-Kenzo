/**
 * KAIA Technologies — ProfileAvatar Component
 * 
 * Ultra-premium circular avatar component that:
 *  - Displays user profile picture if available (with fallback error protection)
 *  - Generates crisp 1-2 letter uppercase initials for users without custom photo (e.g. "Piyush Sharma" -> "PS")
 *  - Supports multiple sizes, ring accents, role indicators, and custom styling
 */

import React, { useState, useEffect } from 'react';
import { getAvatarSrc, getInitials } from '../../utils/imageUtils';
import { ShieldCheck, Store, User } from 'lucide-react';

const sizeMap = {
  xs: {
    container: 'w-6 h-6 text-[10px]',
    icon: 'w-3 h-3',
    badge: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    badgeIcon: 'w-1.5 h-1.5',
  },
  sm: {
    container: 'w-8 h-8 text-xs',
    icon: 'w-4 h-4',
    badge: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
    badgeIcon: 'w-2 h-2',
  },
  md: {
    container: 'w-10 h-10 text-sm font-bold',
    icon: 'w-5 h-5',
    badge: 'w-4 h-4 -bottom-1 -right-1',
    badgeIcon: 'w-2.5 h-2.5',
  },
  lg: {
    container: 'w-14 h-14 text-lg font-black',
    icon: 'w-7 h-7',
    badge: 'w-5 h-5 -bottom-1 -right-1',
    badgeIcon: 'w-3 h-3',
  },
  xl: {
    container: 'w-18 h-18 text-2xl font-black',
    icon: 'w-9 h-9',
    badge: 'w-6 h-6 bottom-0 right-0',
    badgeIcon: 'w-3.5 h-3.5',
  },
  '2xl': {
    container: 'w-24 h-24 text-3xl font-black',
    icon: 'w-12 h-12',
    badge: 'w-7 h-7 bottom-0 right-0',
    badgeIcon: 'w-4 h-4',
  },
  '3xl': {
    container: 'w-32 h-32 text-4xl font-black',
    icon: 'w-16 h-16',
    badge: 'w-8 h-8 bottom-1 right-1',
    badgeIcon: 'w-5 h-5',
  },
};

export const ProfileAvatar = ({
  user = null,
  src = '',
  name = '',
  email = '',
  size = 'md',
  shape = 'circle', // 'circle' | 'rounded'
  ring = true,
  ringColor = 'ring-amber-400/30',
  showRoleBadge = false,
  className = '',
  alt = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Extract properties from user object if provided
  const userName = name || user?.name || '';
  const userEmail = email || user?.email || '';
  const userRole = user?.role || 'CUSTOMER';
  const rawAvatarUrl = src || user?.profileImage?.url || user?.avatar || '';

  const avatarSrc = getAvatarSrc(user || rawAvatarUrl);
  const initials = getInitials(userName, userEmail);

  // Reset image error state whenever avatar URL changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [avatarSrc]);

  const currentSize = sizeMap[size] || sizeMap.md;
  const radiusClass = shape === 'rounded' ? 'rounded-2xl' : 'rounded-full';
  const ringClass = ring ? `ring-2 ${ringColor}` : '';

  const hasValidImage = Boolean(avatarSrc) && !imageError;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${currentSize.container} ${className}`}
      title={userName || userEmail || 'KAIA User'}
    >
      <div
        className={`w-full h-full overflow-hidden ${radiusClass} ${ringClass} shadow-xs flex items-center justify-center transition-transform`}
      >
        {hasValidImage ? (
          <img
            src={avatarSrc}
            alt={alt || userName || 'User Avatar'}
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-80'
            }`}
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-tr from-[#F59E0B] via-[#F5B400] to-[#FFD043] text-slate-950 flex items-center justify-center font-black tracking-tight`}
          >
            <span>{initials}</span>
          </div>
        )}
      </div>

      {/* Role Badge if requested */}
      {showRoleBadge && (
        <div
          className={`absolute ${currentSize.badge} rounded-full flex items-center justify-center shadow-xs border-2 border-white ${
            userRole === 'ADMIN'
              ? 'bg-purple-600 text-white'
              : userRole === 'BRAND'
              ? 'bg-blue-600 text-white'
              : 'bg-emerald-500 text-white'
          }`}
          title={`Role: ${userRole}`}
        >
          {userRole === 'ADMIN' ? (
            <ShieldCheck className={currentSize.badgeIcon} />
          ) : userRole === 'BRAND' ? (
            <Store className={currentSize.badgeIcon} />
          ) : (
            <User className={currentSize.badgeIcon} />
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;
