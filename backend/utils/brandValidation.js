/**
 * KAIA Technologies — Prohibited Brands Policy Enforcement
 * 
 * In accordance with marketplace operational policy:
 * "Apple" and "Sony" brands & products are strictly prohibited from being added, registered, or sold.
 */

export const PROHIBITED_BRANDS = ['apple', 'sony'];

/**
 * Check if a brand name, slug, or product title contains prohibited brand trademarks.
 * @param {string} text - Brand name, product title, or slug
 * @returns {boolean}
 */
export const isProhibitedBrand = (text) => {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase().trim();
  
  return PROHIBITED_BRANDS.some((prohibited) => {
    // Exact match or word boundary match
    const wordBoundary = new RegExp(`(^|[^a-z0-9])${prohibited}([^a-z0-9]|$)`, 'i');
    return wordBoundary.test(lower) || lower === prohibited;
  });
};

export default {
  PROHIBITED_BRANDS,
  isProhibitedBrand,
};
