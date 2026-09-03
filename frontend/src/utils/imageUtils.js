/**
 * Normalize image and avatar URLs for display across localhost and production CDN
 * @param {string} avatar
 * @returns {string}
 */
export const getAvatarSrc = (avatar) => {
  if (!avatar || typeof avatar !== 'string') return '';
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
    return avatar;
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const serverOrigin = apiUrl.replace(/\/api\/?$/, '');
  const cleanPath = avatar.startsWith('/') ? avatar : `/${avatar}`;
  return `${serverOrigin}${cleanPath}`;
};

export default {
  getAvatarSrc,
};
