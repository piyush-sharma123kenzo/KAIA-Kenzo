/**
 * KAIA Technologies — Client-side Date & Time Formatter (IST, 12-Hour)
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

export const formatDateOnlyIST = (date) => {
  return formatDateIST(date, { hour: undefined, minute: undefined, hour12: undefined });
};

export const formatTimeOnlyIST = (date) => {
  return formatDateIST(date, { day: undefined, month: undefined, year: undefined });
};

export default {
  formatDateIST,
  formatDateOnlyIST,
  formatTimeOnlyIST,
};
