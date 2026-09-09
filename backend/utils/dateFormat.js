/**
 * KAIA Technologies — Production Timezone & Date Formatter Utility
 * 
 * Standardizes all server and client date formatting to Indian Standard Time (IST - Asia/Kolkata, UTC+05:30)
 * while preserving native BSON/ISO UTC timestamps for queries and indexing.
 */

/**
 * Format any Date or ISO string into human-readable IST Date & Time.
 * Example: "09 Sep 2026, 04:52 PM"
 */
export const formatIST = (date = new Date(), options = {}) => {
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

/**
 * Format Date only in IST.
 * Example: "09 Sep 2026"
 */
export const formatISTDate = (date = new Date()) => {
  return formatIST(date, { hour: undefined, minute: undefined, hour12: undefined });
};

/**
 * Format Time only in IST.
 * Example: "04:52 PM"
 */
export const formatISTTime = (date = new Date()) => {
  return formatIST(date, { day: undefined, month: undefined, year: undefined });
};

export default {
  formatIST,
  formatISTDate,
  formatISTTime,
};
