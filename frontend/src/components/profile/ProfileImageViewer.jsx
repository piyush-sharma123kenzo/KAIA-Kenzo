/**
 * KAIA Technologies — ProfileImageViewer Component
 * 
 * Ultra-premium Lightbox / Image Zoom Viewer featuring:
 *  - 100% to 300% smooth zoom controls ([+], [-], [Reset])
 *  - Mouse wheel zoom on desktop
 *  - Pan / Drag support when zoomed above 100% with boundary clamping
 *  - Touch pinch and drag support on mobile
 *  - ESC key and backdrop click close
 *  - Loading spinner and error handling
 *  - Full event listener cleanup to prevent memory leaks
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, ZoomIn, ZoomOut, RotateCcw, Loader2, AlertCircle, 
  Download, User, ShieldCheck, Store 
} from 'lucide-react';
import { getAvatarSrc } from '../../utils/imageUtils';

export const ProfileImageViewer = ({
  isOpen = false,
  onClose = () => {},
  imageUrl = '',
  user = null,
  userName = '',
  userRole = '',
  alt = 'Profile Picture Preview',
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Resolve actual image URL
  const resolvedSrc = getAvatarSrc(imageUrl || user?.profileImage?.url || user?.avatar || '');
  const displayName = userName || user?.name || 'User Profile';
  const role = userRole || user?.role || 'CUSTOMER';

  // Reset zoom and pan states
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Handle Close
  const handleClose = useCallback(() => {
    resetZoom();
    onClose();
  }, [resetZoom, onClose]);

  // Reset states whenever modal opens or image changes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setLoading(true);
      setLoadError(false);
    }
  }, [isOpen, resolvedSrc]);

  // Keyboard shortcut listener (ESC to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === '+' || e.key === '=') {
        setScale((prev) => Math.min(3, +(prev + 0.25).toFixed(2)));
      } else if (e.key === '-' || e.key === '_') {
        setScale((prev) => {
          const nextScale = Math.max(1, +(prev - 0.25).toFixed(2));
          if (nextScale === 1) setPosition({ x: 0, y: 0 });
          return nextScale;
        });
      } else if (e.key === '0' || e.key === 'r') {
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, resetZoom]);

  // Prevent background scrolling while modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setScale((prevScale) => {
      const newScale = Math.min(Math.max(1, +(prevScale + delta).toFixed(2)), 3);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  // Zoom button handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(3, +(prev + 0.5).toFixed(2)));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(1, +(prev - 0.5).toFixed(2));
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  // Mouse Drag / Pan handlers
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    const maxBound = (scale - 1) * 200; // Constrain boundaries
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    setPosition({
      x: Math.max(-maxBound, Math.min(maxBound, newX)),
      y: Math.max(-maxBound, Math.min(maxBound, newY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const touchStartRef = useRef({ x: 0, y: 0, dist: 0 });

  const handleTouchStart = (e) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      touchStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
        dist: 0,
      };
    } else if (e.touches.length === 2) {
      // Pinch to zoom start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging && scale > 1) {
      const maxBound = (scale - 1) * 200;
      const newX = e.touches[0].clientX - touchStartRef.current.x;
      const newY = e.touches[0].clientY - touchStartRef.current.y;
      setPosition({
        x: Math.max(-maxBound, Math.min(maxBound, newX)),
        y: Math.max(-maxBound, Math.min(maxBound, newY)),
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchStartRef.current.dist;
      setScale((prev) => Math.min(Math.max(1, +(prev * factor).toFixed(2)), 3));
      touchStartRef.current.dist = currentDist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current.dist = 0;
  };

  if (!isOpen || !resolvedSrc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Profile Picture Viewer"
    >
      {/* Lightbox Container Card */}
      <div
        className="relative bg-slate-900 border border-slate-800/90 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] w-full max-w-lg overflow-hidden flex flex-col items-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop close when clicking card
      >
        {/* Top Header Bar */}
        <div className="w-full px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60 backdrop-blur-xs z-10">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs shrink-0 border border-amber-500/30">
              {role === 'ADMIN' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              ) : role === 'BRAND' ? (
                <Store className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <User className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white tracking-tight truncate">
                {displayName}
              </h3>
              <p className="text-[10px] text-slate-400 uppercase font-mono">
                {role} Profile Photo
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close image viewer"
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Image Viewport Canvas */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative w-full h-[360px] sm:h-[420px] bg-slate-950 flex items-center justify-center overflow-hidden ${
            scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Loading Indicator */}
          {loading && !loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 text-slate-400 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span className="text-xs font-bold">Loading photo...</span>
            </div>
          )}

          {/* Error State */}
          {loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 text-red-400 p-6 text-center z-10">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <span className="text-xs font-bold text-slate-200">Unable to load profile image.</span>
              <p className="text-[11px] text-slate-500">Please check your network connection or re-upload the photo.</p>
            </div>
          )}

          {/* High-Resolution Profile Image */}
          {!loadError && (
            <div
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? 'none' : 'transform 0.18s ease-out',
              }}
              className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden ring-4 ring-amber-400/30 shadow-2xl shrink-0 select-none"
            >
              <img
                ref={imageRef}
                src={resolvedSrc}
                alt={alt || displayName}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setLoadError(true);
                }}
                draggable={false}
                className={`w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300 ${
                  loading ? 'opacity-0' : 'opacity-100'
                }`}
              />
            </div>
          )}
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="w-full px-5 py-3.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between z-10 text-xs">
          
          {/* Current Zoom Percentage Tag */}
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 font-mono text-[11px] font-bold border border-slate-700/60">
              {Math.round(scale * 100)}%
            </span>
            {scale > 1 && (
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Drag to inspect
              </span>
            )}
          </div>

          {/* Interactive Zoom Buttons */}
          <div className="flex items-center space-x-1.5 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/60">
            {/* Zoom Out */}
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 1 || loadError}
              aria-label="Zoom Out"
              className="p-1.5 rounded-xl hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={resetZoom}
              disabled={scale === 1 && position.x === 0 && position.y === 0}
              aria-label="Reset Zoom"
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer flex items-center space-x-1"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Reset</span>
            </button>

            {/* Zoom In */}
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3 || loadError}
              aria-label="Zoom In"
              className="p-1.5 rounded-xl hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileImageViewer;
