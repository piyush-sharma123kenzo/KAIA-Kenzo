/**
 * KAIA Technologies — ProfileAvatar Component
 * 
 * Ultra-premium circular avatar component that:
 *  - Displays user profile picture if available (with fallback error protection)
 *  - Generates crisp 1-2 letter uppercase initials for users without custom photo (e.g. "Piyush Sharma" -> "PS")
 *  - Supports multiple sizes, ring accents, role indicators, and custom styling
 *  - Supports integrated Lightbox Zoom Viewer (allowPreview) when an image exists
 */

import React, { useState, useEffect } from 'react';
import { getAvatarSrc, getInitials } from '../../utils/imageUtils';
import { ShieldCheck, Store, User, ZoomIn } from 'lucide-react';
import ProfileImageViewer from './ProfileImageViewer';

const sizeMap = {
  xs: {
    container: 'w-6 h-6 text-[10px]',
    icon: 'w-3 h-3',
    badge: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    badgeIcon: 'w-1.5 h-1.5',
    zoomIcon: 'w-2.5 h-2.5',
  },
  sm: {
    container: 'w-8 h-8 text-xs',
    icon: 'w-4 h-4',
    badge: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
    badgeIcon: 'w-2 h-2',
    zoomIcon: 'w-3 h-3',
  },
  md: {
    container: 'w-10 h-10 text-sm font-bold',
    icon: 'w-5 h-5',
    badge: 'w-4 h-4 -bottom-1 -right-1',
    badgeIcon: 'w-2.5 h-2.5',
    zoomIcon: 'w-3.5 h-3.5',
  },
  lg: {
    container: 'w-14 h-14 text-lg font-black',
    icon: 'w-7 h-7',
    badge: 'w-5 h-5 -bottom-1 -right-1',
    badgeIcon: 'w-3 h-3',
    zoomIcon: 'w-4 h-4',
  },
  xl: {
    container: 'w-18 h-18 text-2xl font-black',
    icon: 'w-9 h-9',
    badge: 'w-6 h-6 bottom-0 right-0',
    badgeIcon: 'w-3.5 h-3.5',
    zoomIcon: 'w-5 h-5',
  },
  '2xl': {
    container: 'w-24 h-24 text-3xl font-black',
    icon: 'w-12 h-12',
    badge: 'w-7 h-7 bottom-0 right-0',
    badgeIcon: 'w-4 h-4',
    zoomIcon: 'w-6 h-6',
  },
  '3xl': {
    container: 'w-32 h-32 text-4xl font-black',
    icon: 'w-16 h-16',
    badge: 'w-8 h-8 bottom-1 right-1',
    badgeIcon: 'w-5 h-5',
    zoomIcon: 'w-8 h-8',
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
  allowPreview = false,
  onClick = null,
  className = '',
  alt = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

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
  const isClickable = Boolean(onClick) || (allowPreview && hasValidImage);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (allowPreview && hasValidImage) {
      e.stopPropagation();
      setViewerOpen(true);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`relative inline-flex items-center justify-center shrink-0 select-none group/avatar ${
          isClickable ? 'cursor-pointer' : ''
        } ${currentSize.container} ${className}`}
        title={
          allowPreview && hasValidImage
            ? `${userName || 'User'} (Click to preview)`
            : userName || userEmail || 'KAIA User'
        }
      >
        <div
          className={`w-full h-full overflow-hidden ${radiusClass} ${ringClass} shadow-xs flex items-center justify-center transition-all duration-200 ${
            allowPreview && hasValidImage ? 'group-hover/avatar:ring-amber-400 group-hover/avatar:scale-105' : ''
          }`}
        >
          {hasValidImage ? (
            <>
              <img
                src={avatarSrc}
                alt={alt || userName || 'User Avatar'}
                onError={() => setImageError(true)}
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  imageLoaded ? 'opacity-100' : 'opacity-80'
                }`}
              />
              {/* Subtle hover overlay icon for clickable preview */}
              {allowPreview && (
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-2xs">
                  <ZoomIn className={`${currentSize.zoomIcon} text-amber-300 drop-shadow`} />
                </div>
              )}
            </>
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

      {/* Lightbox Viewer */}
      {allowPreview && hasValidImage && (
        <ProfileImageViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          imageUrl={avatarSrc}
          user={user}
          userName={userName}
          userRole={userRole}
          alt={alt || userName}
        />
      )}
    </>
  );
};

export default ProfileAvatar;
