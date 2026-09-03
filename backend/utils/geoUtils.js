/**
 * geoUtils.js
 * High-precision geographical calculations and location utility helpers.
 */

// Earth radius in Kilometers
export const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of first coordinate
 * @param {number} lon1 - Longitude of first coordinate
 * @param {number} lat2 - Latitude of second coordinate
 * @param {number} lon2 - Longitude of second coordinate
 * @returns {number} Distance in kilometers rounded to 2 decimal places
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (angle) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100;
};

/**
 * Validates whether a value is a valid 6-digit Indian Postal PIN code.
 *
 * @param {string|number} pincode
 * @returns {boolean}
 */
export const isValidIndianPincode = (pincode) => {
  if (!pincode) return false;
  const str = String(pincode).trim();
  return /^[1-9][0-9]{5}$/.test(str);
};

/**
 * Validates geographical coordinate ranges.
 *
 * @param {number} latitude - Must be between -90 and 90
 * @param {number} longitude - Must be between -180 and 180
 * @returns {boolean}
 */
export const isValidCoordinates = (latitude, longitude) => {
  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    return false;
  }
  const lat = Number(latitude);
  const lng = Number(longitude);
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * High-accuracy PIN code coordinates dictionary for major Indian metropolitan hubs.
 */
const PINCODE_COORDINATES_MAP = {
  // --- DELHI NCR ---
  '110091': { lat: 28.6056, lng: 77.2917, area: 'Mayur Vihar Phase 1, Delhi' },
  '110092': { lat: 28.6180, lng: 77.3015, area: 'Mayur Vihar Phase 2 / Patparganj, Delhi' },
  '110096': { lat: 28.6012, lng: 77.3245, area: 'Mayur Vihar Phase 3 / Kondli, Delhi' },
  '110001': { lat: 28.6315, lng: 77.2167, area: 'Connaught Place, New Delhi' },
  '110002': { lat: 28.6369, lng: 77.2410, area: 'Daryaganj, Delhi' },
  '110003': { lat: 28.5983, lng: 77.2283, area: 'Pandara Road / Lodhi Estate, Delhi' },
  '110005': { lat: 28.6517, lng: 77.1906, area: 'Karol Bagh, New Delhi' },
  '110006': { lat: 28.6562, lng: 77.2410, area: 'Chandni Chowk, Delhi' },
  '110011': { lat: 28.6067, lng: 77.2090, area: 'South Avenue / President Estate, Delhi' },
  '110016': { lat: 28.5494, lng: 77.1994, area: 'Hauz Khas, New Delhi' },
  '110017': { lat: 28.5300, lng: 77.2177, area: 'Malviya Nagar / Saket, Delhi' },
  '110019': { lat: 28.5416, lng: 77.2588, area: 'Kalkaji / Nehru Place, Delhi' },
  '110020': { lat: 28.5355, lng: 77.2732, area: 'Okhla Industrial Area, Delhi' },
  '110024': { lat: 28.5700, lng: 77.2400, area: 'Lajpat Nagar, New Delhi' },
  '110025': { lat: 28.5611, lng: 77.2842, area: 'Jamia Nagar / New Friends Colony, Delhi' },
  '110085': { lat: 28.7041, lng: 77.1025, area: 'Rohini Sector 3, Delhi' },
  '110088': { lat: 28.7180, lng: 77.1520, area: 'Prashant Vihar / Pitampura, Delhi' },

  // --- NOIDA & GREATER NOIDA ---
  '201301': { lat: 28.5700, lng: 77.3200, area: 'Noida Sector 1 to 20, UP' },
  '201303': { lat: 28.5650, lng: 77.3400, area: 'Noida Sector 27 / Atta Market, UP' },
  '201304': { lat: 28.5350, lng: 77.3600, area: 'Noida Sector 93 / Express Highway, UP' },
  '201309': { lat: 28.6280, lng: 77.3649, area: 'Noida Sector 62 / Electronic City, UP' },
  '201307': { lat: 28.6010, lng: 77.3450, area: 'Noida Sector 55 / 56, UP' },
  '201308': { lat: 28.6150, lng: 77.3800, area: 'Noida Sector 71 / 72, UP' },
  '201010': { lat: 28.6410, lng: 77.3710, area: 'Indirapuram, Ghaziabad, UP' },
  '201012': { lat: 28.6500, lng: 77.3400, area: 'Vaishali, Ghaziabad, UP' },

  // --- BANGALORE ---
  '560038': { lat: 12.9784, lng: 77.6408, area: 'Indiranagar, Bengaluru' },
  '560008': { lat: 12.9720, lng: 77.6250, area: 'Halasuru / Ulsoor, Bengaluru' },
  '560001': { lat: 12.9716, lng: 77.5946, area: 'MG Road / Shivaji Nagar, Bengaluru' },
  '560025': { lat: 12.9634, lng: 77.6080, area: 'Richmond Town / Victoria Layout, Bengaluru' },
  '560034': { lat: 12.9279, lng: 77.6271, area: 'Koramangala, Bengaluru' },
  '560095': { lat: 12.9352, lng: 77.6245, area: 'Koramangala 4th Block, Bengaluru' },
  '560102': { lat: 12.9116, lng: 77.6389, area: 'HSR Layout, Bengaluru' },
  '560100': { lat: 12.8399, lng: 77.6770, area: 'Electronic City Phase 1, Bengaluru' },
  '560105': { lat: 12.8250, lng: 77.6850, area: 'Electronic City Phase 2, Bengaluru' },
  '560099': { lat: 12.8180, lng: 77.6950, area: 'Bommasandra Industrial Area, Bengaluru' },
  '560066': { lat: 12.9698, lng: 77.7499, area: 'Whitefield, Bengaluru' },
  '560037': { lat: 12.9560, lng: 77.7010, area: 'Marathahalli, Bengaluru' },
  '560076': { lat: 12.8900, lng: 77.6000, area: 'Bannerghatta Road / BTM Layout, Bengaluru' },
  '560068': { lat: 12.8950, lng: 77.6450, area: 'Madiwala / Kudlu Gate, Bengaluru' },

  // --- MUMBAI & PUNE ---
  '400001': { lat: 18.9322, lng: 72.8335, area: 'Fort / Nariman Point, Mumbai' },
  '400051': { lat: 19.0600, lng: 72.8650, area: 'Bandra Kurla Complex (BKC), Mumbai' },
  '400076': { lat: 19.1170, lng: 72.9050, area: 'Powai, Mumbai' },
  '411001': { lat: 18.5204, lng: 73.8567, area: 'Pune Station / Camp, Pune' },
  '411057': { lat: 18.5913, lng: 73.7389, area: 'Hinjawadi IT Park, Pune' },

  // --- HYDERABAD ---
  '500081': { lat: 17.4435, lng: 78.3772, area: 'HITEC City / Madhapur, Hyderabad' },
  '500032': { lat: 17.4380, lng: 78.3580, area: 'Gachibowli, Hyderabad' },
};

/**
 * Resolves coordinates for any 6-digit Indian PIN code.
 *
 * @param {string|number} pincode
 * @returns {{ latitude: number, longitude: number, area?: string } | null}
 */
export const resolvePincodeCoordinates = (pincode) => {
  if (!pincode) return null;
  const pin = String(pincode).trim();

  // 1. Direct dictionary match
  if (PINCODE_COORDINATES_MAP[pin]) {
    const item = PINCODE_COORDINATES_MAP[pin];
    return { latitude: item.lat, longitude: item.lng, area: item.area };
  }

  // 2. Circle prefix estimation for common hubs
  if (pin.startsWith('1100')) {
    // Delhi circle general approximation
    return { latitude: 28.6139, longitude: 77.2090, area: `Delhi Region (${pin})` };
  }
  if (pin.startsWith('2013')) {
    // Noida circle general approximation
    return { latitude: 28.5800, longitude: 77.3300, area: `Noida Region (${pin})` };
  }
  if (pin.startsWith('5600') || pin.startsWith('5601')) {
    // Bangalore circle general approximation
    return { latitude: 12.9716, longitude: 77.5946, area: `Bengaluru Region (${pin})` };
  }
  if (pin.startsWith('4000')) {
    // Mumbai circle general approximation
    return { latitude: 19.0760, longitude: 72.8777, area: `Mumbai Region (${pin})` };
  }
  if (pin.startsWith('5000')) {
    // Hyderabad circle general approximation
    return { latitude: 17.3850, longitude: 78.4867, area: `Hyderabad Region (${pin})` };
  }

  return null;
};
