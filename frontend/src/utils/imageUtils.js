/**
 * KAIA Technologies — Image & Avatar Utilities
 * 
 * Provides:
 *  - URL normalization for local uploads, external CDNs, and Data URIs
 *  - User initials extraction for clean default circular avatars
 *  - Smart cache busting using updatedAt timestamps
 */

/**
 * Extract 1-2 uppercase initials from a user's full name or email.
 * @param {string} [name=''] - Full name
 * @param {string} [email=''] - Fallback email
 * @returns {string} 1-2 letter initials (e.g. "Piyush Sharma" -> "PS")
 */
export const getInitials = (name = '', email = '') => {
  if (name && typeof name === 'string' && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
    }
  }

  if (email && typeof email === 'string' && email.trim()) {
    const handle = email.split('@')[0].trim();
    if (handle) {
      return handle.substring(0, Math.min(2, handle.length)).toUpperCase();
    }
  }

  return 'K';
};

/**
 * Normalize image and avatar URLs for display across localhost and production CDN.
 * Handles user objects, relative URLs, CDN URLs, and timestamps.
 * @param {string|object} avatarOrUser - URL string or User object
 * @returns {string}
 */
export const getAvatarSrc = (avatarOrUser) => {
  if (!avatarOrUser) return '';

  let rawUrl = '';
  let timestamp = '';

  if (typeof avatarOrUser === 'object') {
    rawUrl = avatarOrUser.profileImage?.url || avatarOrUser.avatar || '';
    if (avatarOrUser.profileImage?.updatedAt) {
      timestamp = new Date(avatarOrUser.profileImage.updatedAt).getTime();
    }
  } else if (typeof avatarOrUser === 'string') {
    rawUrl = avatarOrUser.trim();
  }

  if (!rawUrl) return '';

  let finalUrl = '';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    finalUrl = rawUrl;
  } else {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const serverOrigin = apiUrl.replace(/\/api\/?$/, '');
    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    finalUrl = `${serverOrigin}${cleanPath}`;
  }

  // Append timestamp cache-buster for local or updated files if not a blob/data URI
  if (timestamp && !finalUrl.startsWith('data:') && !finalUrl.startsWith('blob:')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}t=${timestamp}`;
  }

  return finalUrl;
};

export default {
  getInitials,
  getAvatarSrc,
};
