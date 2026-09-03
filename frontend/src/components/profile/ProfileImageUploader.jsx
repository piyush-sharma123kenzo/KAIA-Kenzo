/**
 * KAIA Technologies — ProfileImageUploader Component
 * 
 * Production-ready Profile Picture Manager featuring:
 *  - Current Avatar view with initials fallback
 *  - Interactive File Picker with client-side format & size validation (Max 5MB, JPG/PNG/WEBP)
 *  - Crop & Zoom Preview Modal before committing upload
 *  - Save & Cancel controls (no unexpected auto-uploads)
 *  - Safe removal with confirmation
 *  - Live synchronization with AuthContext and global UI
 */

import React, { useState, useRef, useContext } from 'react';
import { 
  Camera, Trash2, Upload, ZoomIn, ZoomOut, RotateCw, Check, 
  X, AlertCircle, Sparkles, Loader2, Image as ImageIcon 
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import userApi from '../../services/userApi';
import ProfileAvatar from './ProfileAvatar';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ProfileImageUploader = ({
  size = 'xl',
  shape = 'circle', // 'circle' | 'rounded'
  variant = 'card', // 'card' | 'inline' | 'compact'
  onUploadSuccess = null,
  onRemoveSuccess = null,
  className = '',
}) => {
  const { user, updateProfile } = useContext(AuthContext);
  const toast = useToast();

  const fileInputRef = useRef(null);

  // Modal & Preview state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Loading & Error states
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const hasCustomImage = Boolean(user?.profileImage?.url || user?.avatar);

  // Trigger file dialog
  const handleOpenFileDialog = () => {
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handle file selection and client-side validation
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');

    // 1. File Size Validation (Max 5MB)
    if (file.size > MAX_SIZE_BYTES) {
      const errorText = 'Profile image must be smaller than 5 MB.';
      setErrorMessage(errorText);
      toast?.error?.(errorText);
      return;
    }

    // 2. File Format / Extension Validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    const mime = file.type?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(mime)) {
      const errorText = 'Only JPG, JPEG, PNG, and WEBP image formats are supported.';
      setErrorMessage(errorText);
      toast?.error?.(errorText);
      return;
    }

    // 3. Create local preview URL and open crop modal
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setZoomLevel(1);
    setRotation(0);
    setCropModalOpen(true);
  };

  // Close crop modal and clean up object URL
  const handleCloseModal = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setCropModalOpen(false);
    setZoomLevel(1);
    setRotation(0);
  };

  // Execute upload to backend
  const handleSavePhoto = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setErrorMessage('');

    try {
      // If user zoomed or rotated, render to canvas for optimized 1:1 image
      let fileToUpload = selectedFile;
      if (zoomLevel !== 1 || rotation !== 0) {
        try {
          fileToUpload = await processCroppedImage(previewUrl, zoomLevel, rotation, selectedFile.type);
        } catch (cropErr) {
          console.warn('[ProfileImageUploader] Canvas crop fallback to original:', cropErr);
          fileToUpload = selectedFile;
        }
      }

      const formData = new FormData();
      formData.append('profileImage', fileToUpload, selectedFile.name);

      const response = await userApi.uploadProfileImage(formData);

      if (response.success && response.user) {
        // Immediately synchronize with AuthContext
        if (updateProfile) {
          await updateProfile(response.user);
        }

        toast?.success?.(response.message || 'Profile picture updated successfully.');
        if (onUploadSuccess) onUploadSuccess(response.user);
        handleCloseModal();
      } else {
        throw new Error(response.message || 'Failed to update profile picture.');
      }
    } catch (err) {
      console.error('[ProfileImageUploader] Upload failed:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Error uploading profile image.';
      setErrorMessage(serverMsg);
      toast?.error?.(serverMsg);
    } finally {
      setUploading(false);
    }
  };

  // Helper to generate cropped canvas blob
  const processCroppedImage = (src, zoom, rot, mimeType) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        const outputDim = Math.min(size, 800); // Max 800x800 for high-density avatar
        canvas.width = outputDim;
        canvas.height = outputDim;

        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(outputDim / 2, outputDim / 2);
        if (rot) ctx.rotate((rot * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, -outputDim / 2, -outputDim / 2, outputDim, outputDim);
        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const croppedFile = new File([blob], 'avatar.webp', { type: 'image/webp' });
              resolve(croppedFile);
            } else {
              reject(new Error('Canvas toBlob failed.'));
            }
          },
          'image/webp',
          0.92
        );
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  // Handle profile image removal
  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo? Default initials avatar will be shown.')) {
      return;
    }

    setRemoving(true);
    setErrorMessage('');

    try {
      const response = await userApi.removeProfileImage();

      if (response.success && response.user) {
        if (updateProfile) {
          await updateProfile(response.user);
        }
        toast?.success?.('Profile photo removed.');
        if (onRemoveSuccess) onRemoveSuccess(response.user);
      } else {
        throw new Error(response.message || 'Failed to remove photo.');
      }
    } catch (err) {
      console.error('[ProfileImageUploader] Remove failed:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Failed to remove profile photo.';
      setErrorMessage(serverMsg);
      toast?.error?.(serverMsg);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className={`space-y-3 text-left ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading || removing}
      />

      {/* Card Variant */}
      {variant === 'card' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-slate-50/90 border border-slate-200/90 rounded-2xl relative overflow-hidden">
          
          {/* Avatar View */}
          <div className="relative group/avatar shrink-0">
            <ProfileAvatar
              user={user}
              size={size}
              shape={shape}
              ring={true}
              ringColor="ring-amber-400/30"
              className="shadow-sm"
            />
            <button
              type="button"
              onClick={handleOpenFileDialog}
              disabled={uploading || removing}
              className="absolute inset-0 bg-slate-950/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold backdrop-blur-2xs"
              title="Change Profile Photo"
            >
              <Camera className="w-4 h-4 text-amber-400 mb-0.5" />
              <span>Change</span>
            </button>
          </div>

          {/* Details & Action Controls */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-black text-sm text-slate-900 tracking-tight">Profile Picture</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100/80 text-amber-900 border border-amber-200/60">
                1:1 Square Ratio
              </span>
            </div>
            
            <p className="text-xs text-slate-500">
              Upload a clear JPG, PNG, or WEBP photo. Maximum allowed size is 5 MB.
            </p>

            {errorMessage && (
              <div className="flex items-center space-x-1.5 text-xs text-red-600 font-bold pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {/* Change / Upload Button */}
              <button
                type="button"
                onClick={handleOpenFileDialog}
                disabled={uploading || removing}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{hasCustomImage ? 'Change Photo' : 'Upload Photo'}</span>
              </button>

              {/* Remove Button (Only visible if user has an uploaded image) */}
              {hasCustomImage && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploading || removing}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {removing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact / Inline Variant */}
      {variant !== 'card' && (
        <div className="flex items-center space-x-3">
          <div className="relative group/compact shrink-0">
            <ProfileAvatar user={user} size={size} shape={shape} />
            <button
              type="button"
              onClick={handleOpenFileDialog}
              disabled={uploading || removing}
              className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover/compact:opacity-100 transition-opacity cursor-pointer"
              title="Change Photo"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleOpenFileDialog}
              disabled={uploading || removing}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
            >
              {hasCustomImage ? 'Change' : 'Upload'}
            </button>
            {hasCustomImage && (
              <>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploading || removing}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PREVIEW & CROP MODAL                                                  */}
      {/* ===================================================================== */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Adjust & Confirm Profile Photo
                </h3>
                <p className="text-xs text-slate-500">
                  Preview your square avatar before uploading
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={uploading}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Circular Crop Preview Canvas */}
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-amber-400/40 shadow-inner bg-slate-900 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Avatar Preview"
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                        transition: 'transform 0.15s ease-out',
                      }}
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-600" />
                  )}
                  {/* Subtle Circular Highlight Mask */}
                  <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none" />
                </div>
              </div>

              {/* Zoom & Rotation Controls */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center space-x-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
                    <span>Zoom</span>
                  </span>
                  <span className="font-mono text-slate-500">{Math.round(zoomLevel * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.05"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />

                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-amber-500" />
                    <span>Rotate 90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setZoomLevel(1); setRotation(0); }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                  >
                    Reset Zoom
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Modal Footer: Cancel & Save Buttons */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={uploading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={uploading}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Photo...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save Photo</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileImageUploader;
