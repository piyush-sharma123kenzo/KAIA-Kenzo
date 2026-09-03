/**
 * KAIA Technologies — Modular Map & Location Geocoding Service
 * Supports OpenStreetMap Nominatim (Standard/Free) and easily switchable to Google Maps / Mapbox.
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Reverse geocode latitude/longitude coordinates to a human-readable Indian delivery address.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{ area: string, city: string, state: string, postalCode: string, country: string, formatted: string, latitude: number, longitude: number }>}
 */
export const reverseGeocodeCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en-IN,en;q=0.9',
          'User-Agent': 'KAIATechnologiesMarketplace/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding service returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const addr = data.address || {};

    const locality =
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.commercial ||
      addr.road ||
      addr.village ||
      '';
    const city =
      addr.city ||
      addr.town ||
      addr.city_district ||
      addr.county ||
      addr.state_district ||
      'Delhi';
    const state = addr.state || 'Delhi';
    const postalCode = addr.postcode || '';
    const country = addr.country || 'India';

    const areaCombined = locality ? `${locality}, ${city}` : city;
    const formatted = [areaCombined, state, postalCode].filter(Boolean).join(' - ');

    return {
      area: locality || city,
      city,
      state,
      postalCode,
      country,
      formatted: formatted || data.display_name || 'Detected Location',
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
  } catch (error) {
    console.error('[KAIA Location] Reverse Geocode Error:', error);
    // Graceful fallback coordinates
    return {
      area: 'Current Location',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '',
      country: 'India',
      formatted: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
  }
};

/**
 * Search locations by locality, area, city or PIN code.
 * @param {string} query
 * @returns {Promise<Array<{ id: string, name: string, area: string, city: string, state: string, postalCode: string, latitude: number, longitude: number, display: string }>>}
 */
export const searchLocations = async (query) => {
  if (!query || query.trim().length < 2) return [];

  try {
    const encoded = encodeURIComponent(query.trim());
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encoded}&countrycodes=in&addressdetails=1&limit=6`,
      {
        headers: {
          'Accept-Language': 'en-IN,en;q=0.9',
          'User-Agent': 'KAIATechnologiesMarketplace/1.0',
        },
      }
    );

    if (!response.ok) return [];

    const results = await response.json();

    return results.map((item, idx) => {
      const addr = item.address || {};
      const locality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.road ||
        addr.village ||
        '';
      const city =
        addr.city ||
        addr.town ||
        addr.city_district ||
        addr.county ||
        addr.state_district ||
        '';
      const state = addr.state || '';
      const postalCode = addr.postcode || '';

      const name = item.name || locality || city || query;
      const subtitle = [locality, city, state, postalCode].filter(Boolean).join(', ');

      return {
        id: item.place_id ? String(item.place_id) : `search-loc-${idx}`,
        name,
        area: locality || city || name,
        city: city || 'Delhi',
        state: state || 'Delhi',
        postalCode: postalCode || '',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        display: subtitle || item.display_name,
      };
    });
  } catch (error) {
    console.error('[KAIA Location] Search Error:', error);
    return [];
  }
};

/**
 * Lookup details for a 6-digit Indian PIN code.
 * @param {string} pincode
 * @returns {Promise<{ city: string, state: string, isMetro: boolean, postalCode: string }>}
 */
export const lookupPincode = async (pincode) => {
  const cleanPin = String(pincode).trim();
  if (!cleanPin || cleanPin.length !== 6) return null;

  try {
    const searchResults = await searchLocations(cleanPin);
    if (searchResults && searchResults.length > 0) {
      const match = searchResults[0];
      const metroPrefixes = ['11', '40', '56', '60', '70', '50', '38', '41'];
      const isMetro = metroPrefixes.some((p) => cleanPin.startsWith(p));
      return {
        city: match.city || match.area || 'Verified Hub',
        state: match.state || 'India',
        postalCode: cleanPin,
        isMetro,
      };
    }
  } catch (e) {
    console.error('[Lookup Pincode Error]:', e);
  }

  const metroPrefixes = ['11', '40', '56', '60', '70', '50', '38', '41'];
  const isMetro = metroPrefixes.some((p) => cleanPin.startsWith(p));
  return {
    city: 'Direct Transit Node',
    state: 'India',
    postalCode: cleanPin,
    isMetro,
  };
};

export default {
  reverseGeocodeCoordinates,
  searchLocations,
  lookupPincode,
};
