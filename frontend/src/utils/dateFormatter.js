/**
 * KAIA Technologies — Client-side Date & Time Formatter (IST, 12-Hour)
 * Standardizes all frontend UI dates to Indian Standard Time (Asia/Kolkata).
 */

export const formatDateIST = (date, options = {}) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options,
  });
};

export const formatDateOnlyIST = (date, options = {}) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
};

export const formatTimeOnlyIST = (date, options = {}) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options,
  });
};

export const formatDateTimeIST = (date, options = {}) => {
  return formatDateIST(date, options);
};

export default {
  formatDateIST,
  formatDateOnlyIST,
  formatTimeOnlyIST,
  formatDateTimeIST,
};

