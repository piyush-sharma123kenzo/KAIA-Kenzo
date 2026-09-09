import DeliveryLocation from '../models/DeliveryLocation.js';
import DeliveryCheckLog from '../models/DeliveryCheckLog.js';
import {
  calculateHaversineDistance,
  isValidIndianPincode,
  isValidCoordinates,
  resolvePincodeCoordinates,
} from '../utils/geoUtils.js';

/**
 * Public: Check delivery availability for given coordinates or PIN code
 * POST /api/delivery/check
 */
export const checkDeliveryAvailability = async (req, res) => {
  try {
    const { pincode, latitude, longitude } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
    const userAgent = req.headers['user-agent'] || '';

    const hasCoords = isValidCoordinates(latitude, longitude);
    const hasPin = isValidIndianPincode(pincode);

    if (!hasCoords && !hasPin) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either valid coordinates (latitude & longitude) or a valid 6-digit Indian PIN code.',
      });
    }

    // Fetch all currently active delivery locations configured by Admin
    const activeLocations = await DeliveryLocation.find({ isActive: true });

    if (activeLocations.length === 0) {
      await DeliveryCheckLog.create({
        pincode: pincode ? String(pincode).trim() : '',
        coordinates: hasCoords ? { latitude: Number(latitude), longitude: Number(longitude) } : undefined,
        isServiceable: false,
        ipAddress,
        userAgent,
      });

      return res.json({
        success: true,
        isServiceable: false,
        distance: null,
        deliveryRadius: 10,
        nearestLocation: null,
        message: 'Sorry, KAIA Technologies is currently not delivering to this location. No active delivery centers are currently available.',
      });
    }

    // CASE 1: Exact coordinates provided (Real Haversine Distance Check)
    if (hasCoords) {
      const userLat = Number(latitude);
      const userLng = Number(longitude);

      let nearestLoc = null;
      let minDistance = Infinity;

      for (const loc of activeLocations) {
        const dist = calculateHaversineDistance(
          userLat,
          userLng,
          loc.coordinates.latitude,
          loc.coordinates.longitude
        );

        if (dist < minDistance) {
          minDistance = dist;
          nearestLoc = loc;
        }
      }

      const radius = nearestLoc?.deliveryRadius || 10;
      const isServiceable = minDistance <= radius;

      // Log delivery check for analytics
      await DeliveryCheckLog.create({
        pincode: pincode ? String(pincode).trim() : nearestLoc?.pincode || '',
        coordinates: { latitude: userLat, longitude: userLng },
        isServiceable,
        calculatedDistance: minDistance,
        deliveryRadius: radius,
        nearestLocationId: nearestLoc?._id,
        nearestLocationName: nearestLoc?.locationName || '',
        ipAddress,
        userAgent,
      });

      if (isServiceable) {
        return res.json({
          success: true,
          isServiceable: true,
          distance: minDistance,
          deliveryRadius: radius,
          nearestLocation: nearestLoc.locationName,
          pincode: nearestLoc.pincode,
          message: `Delivery Available (Within ${minDistance} KM of ${nearestLoc.locationName})`,
        });
      } else {
        return res.json({
          success: true,
          isServiceable: false,
          distance: minDistance,
          deliveryRadius: radius,
          nearestLocation: nearestLoc?.locationName,
          message: `Sorry, KAIA Technologies is currently not delivering to this location. Nearest service center (${nearestLoc?.locationName}) is ${minDistance} KM away (Delivery limit: ${radius} KM).`,
        });
      }
    }

    // CASE 2: Only PIN code provided (PIN Match + Geocoded Radius Check)
    const cleanPin = String(pincode).trim();
    const pinMatches = activeLocations.filter((l) => l.pincode === cleanPin);

    if (pinMatches.length > 0) {
      const matchedLoc = pinMatches[0];
      await DeliveryCheckLog.create({
        pincode: cleanPin,
        coordinates: matchedLoc.coordinates,
        isServiceable: true,
        calculatedDistance: 0,
        deliveryRadius: matchedLoc.deliveryRadius,
        nearestLocationId: matchedLoc._id,
        nearestLocationName: matchedLoc.locationName,
        ipAddress,
        userAgent,
      });

      return res.json({
        success: true,
        isServiceable: true,
        distance: 0,
        deliveryRadius: matchedLoc.deliveryRadius,
        nearestLocation: matchedLoc.locationName,
        pincode: cleanPin,
        message: `Delivery Available in ${matchedLoc.locationName} (${cleanPin})`,
      });
    }

    // Try resolving coordinates for the entered PIN code to calculate distance to closest hub
    const resolvedCoords = resolvePincodeCoordinates(cleanPin);
    if (resolvedCoords && isValidCoordinates(resolvedCoords.latitude, resolvedCoords.longitude)) {
      let nearestLoc = null;
      let minDistance = Infinity;

      for (const loc of activeLocations) {
        const dist = calculateHaversineDistance(
          resolvedCoords.latitude,
          resolvedCoords.longitude,
          loc.coordinates.latitude,
          loc.coordinates.longitude
        );

        if (dist < minDistance) {
          minDistance = dist;
          nearestLoc = loc;
        }
      }

      const radius = nearestLoc?.deliveryRadius || 10;
      const isServiceable = minDistance <= radius;

      await DeliveryCheckLog.create({
        pincode: cleanPin,
        coordinates: { latitude: resolvedCoords.latitude, longitude: resolvedCoords.longitude },
        isServiceable,
        calculatedDistance: minDistance,
        deliveryRadius: radius,
        nearestLocationId: nearestLoc?._id,
        nearestLocationName: nearestLoc?.locationName || '',
        ipAddress,
        userAgent,
      });

      if (isServiceable) {
        return res.json({
          success: true,
          isServiceable: true,
          distance: minDistance,
          deliveryRadius: radius,
          nearestLocation: nearestLoc.locationName,
          pincode: cleanPin,
          area: resolvedCoords.area,
          message: `Delivery Available in ${resolvedCoords.area || cleanPin} (Approx. ${minDistance} KM from ${nearestLoc.locationName})`,
        });
      } else {
        return res.json({
          success: true,
          isServiceable: false,
          distance: minDistance,
          deliveryRadius: radius,
          nearestLocation: nearestLoc?.locationName,
          pincode: cleanPin,
          message: `Sorry, PIN ${cleanPin} is outside our delivery radius. Nearest service hub (${nearestLoc?.locationName}) is ${minDistance} KM away (Delivery limit: ${radius} KM).`,
        });
      }
    }

    // PIN not directly listed as a center hub and cannot be resolved
    await DeliveryCheckLog.create({
      pincode: cleanPin,
      isServiceable: false,
      ipAddress,
      userAgent,
    });

    return res.json({
      success: true,
      isServiceable: false,
      distance: null,
      deliveryRadius: 10,
      nearestLocation: activeLocations[0]?.locationName,
      pincode: cleanPin,
      message: `Sorry, KAIA Technologies is currently not delivering to PIN ${cleanPin}. Please use "Current Location" to verify if you fall within the 10 KM service radius.`,
    });
  } catch (error) {
    console.error('[DeliveryController] Check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check delivery availability. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Public: Get active delivery locations list
 * GET /api/delivery/locations
 */
export const getActiveLocations = async (req, res) => {
  try {
    const locations = await DeliveryLocation.find({ isActive: true })
      .select('locationName address pincode coordinates deliveryRadius')
      .sort({ locationName: 1 });

    return res.json({
      success: true,
      locations,
    });
  } catch (error) {
    console.error('[DeliveryController] getActiveLocations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active delivery locations.',
    });
  }
};

/**
 * Internal Helper: Reusable backend validator for Order creation / checkout
 */
export const validateOrderDelivery = async (shippingAddress) => {
  if (!shippingAddress) {
    return {
      isValid: false,
      error: 'Shipping address is required for delivery validation.',
    };
  }

  const activeLocations = await DeliveryLocation.find({ isActive: true });

  if (activeLocations.length === 0) {
    return {
      isValid: false,
      error: 'Sorry, KAIA Technologies currently has no active delivery service centers. Orders cannot be fulfilled at this time.',
    };
  }

  const hasCoords = isValidCoordinates(shippingAddress.latitude, shippingAddress.longitude);

  // If coordinates available on the address, perform exact Haversine calculation
  if (hasCoords) {
    const userLat = Number(shippingAddress.latitude);
    const userLng = Number(shippingAddress.longitude);

    let nearestLoc = null;
    let minDistance = Infinity;

    for (const loc of activeLocations) {
      const dist = calculateHaversineDistance(
        userLat,
        userLng,
        loc.coordinates.latitude,
        loc.coordinates.longitude
      );

      if (dist < minDistance) {
        minDistance = dist;
        nearestLoc = loc;
      }
    }

    const radius = nearestLoc?.deliveryRadius || 10;
    const isServiceable = minDistance <= radius;

    if (!isServiceable) {
      return {
        isValid: false,
        error: `Sorry, delivery is unavailable at this address. Nearest KAIA service center (${nearestLoc?.locationName}) is ${minDistance} KM away (Maximum delivery radius: ${radius} KM).`,
        validationSnapshot: {
          isServiceable: false,
          deliveryLocationId: nearestLoc?._id,
          nearestLocationName: nearestLoc?.locationName || '',
          calculatedDistance: minDistance,
          deliveryRadius: radius,
          validatedAt: new Date(),
          coordinates: { latitude: userLat, longitude: userLng },
        },
      };
    }

    return {
      isValid: true,
      validationSnapshot: {
        isServiceable: true,
        deliveryLocationId: nearestLoc._id,
        nearestLocationName: nearestLoc.locationName,
        calculatedDistance: minDistance,
        deliveryRadius: radius,
        validatedAt: new Date(),
        coordinates: { latitude: userLat, longitude: userLng },
      },
    };
  }

  // Fallback to PIN code validation (PIN match or geocoded circle radius check)
  const postalCode = String(shippingAddress.postalCode || shippingAddress.pincode || '').trim();
  const pinMatch = activeLocations.find((l) => l.pincode === postalCode);

  if (pinMatch) {
    return {
      isValid: true,
      validationSnapshot: {
        isServiceable: true,
        deliveryLocationId: pinMatch._id,
        nearestLocationName: pinMatch.locationName,
        calculatedDistance: 0,
        deliveryRadius: pinMatch.deliveryRadius,
        validatedAt: new Date(),
        coordinates: pinMatch.coordinates,
      },
    };
  }

  const resolvedCoords = resolvePincodeCoordinates(postalCode);
  if (resolvedCoords && isValidCoordinates(resolvedCoords.latitude, resolvedCoords.longitude)) {
    let nearestLoc = null;
    let minDistance = Infinity;

    for (const loc of activeLocations) {
      const dist = calculateHaversineDistance(
        resolvedCoords.latitude,
        resolvedCoords.longitude,
        loc.coordinates.latitude,
        loc.coordinates.longitude
      );

      if (dist < minDistance) {
        minDistance = dist;
        nearestLoc = loc;
      }
    }

    const radius = nearestLoc?.deliveryRadius || 10;
    const isServiceable = minDistance <= radius;

    if (isServiceable) {
      return {
        isValid: true,
        validationSnapshot: {
          isServiceable: true,
          deliveryLocationId: nearestLoc._id,
          nearestLocationName: nearestLoc.locationName,
          calculatedDistance: minDistance,
          deliveryRadius: radius,
          validatedAt: new Date(),
          coordinates: { latitude: resolvedCoords.latitude, longitude: resolvedCoords.longitude },
        },
      };
    }
  }

  return {
    isValid: false,
    error: `Sorry, delivery is currently unavailable for PIN ${postalCode}. We deliver within a 10 KM radius of our authorized hubs.`,
    validationSnapshot: {
      isServiceable: false,
      deliveryLocationId: null,
      nearestLocationName: activeLocations[0]?.locationName || '',
      calculatedDistance: 0,
      deliveryRadius: 10,
      validatedAt: new Date(),
      coordinates: { latitude: null, longitude: null },
    },
  };
};

// ============================================================================
// ADMIN CONTROLLERS
// ============================================================================

/**
 * Admin: Get all delivery locations with pagination & filters
 * GET /api/admin/delivery-locations
 */
export const getAdminDeliveryLocations = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status === 'active') query.isActive = true;
    if (req.query.status === 'inactive') query.isActive = false;
    if (req.query.city && req.query.city !== 'all') query.city = { $regex: req.query.city.trim(), $options: 'i' };

    if (req.query.search) {
      const s = req.query.search.trim();
      query.$or = [
        { locationName: { $regex: s, $options: 'i' } },
        { pincode: { $regex: s, $options: 'i' } },
        { address: { $regex: s, $options: 'i' } },
        { city: { $regex: s, $options: 'i' } },
        { state: { $regex: s, $options: 'i' } },
      ];
    }

    const [locations, total] = await Promise.all([
      DeliveryLocation.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DeliveryLocation.countDocuments(query),
    ]);

    return res.json({
      success: true,
      locations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('[DeliveryController] getAdminDeliveryLocations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery locations.',
      error: error.message,
    });
  }
};

/**
 * Admin: Create a new delivery location
 * POST /api/admin/delivery-locations
 */
export const createDeliveryLocation = async (req, res) => {
  try {
    const { locationName, address, city, state, pincode, latitude, longitude, deliveryRadius, isActive, notes } = req.body;

    if (!locationName || !address || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Location Name, Address, and PIN Code are required.',
      });
    }

    if (!isValidIndianPincode(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit Indian PIN code.',
      });
    }

    // Auto-resolve latitude and longitude if missing or not valid
    let lat = latitude !== undefined && latitude !== '' ? Number(latitude) : null;
    let lng = longitude !== undefined && longitude !== '' ? Number(longitude) : null;

    if (!isValidCoordinates(lat, lng)) {
      const resolved = resolvePincodeCoordinates(pincode);
      if (resolved && isValidCoordinates(resolved.latitude, resolved.longitude)) {
        lat = resolved.latitude;
        lng = resolved.longitude;
      }
    }

    if (!isValidCoordinates(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: 'Valid geographical coordinates (Latitude: -90 to 90, Longitude: -180 to 180) are required. Please provide valid coordinates or a recognized PIN code.',
      });
    }

    const radius = Number(deliveryRadius) || 10;
    if (radius < 0.5 || radius > 100) {
      return res.status(400).json({
        success: false,
        message: 'Delivery radius must be between 0.5 KM and 100 KM.',
      });
    }

    // Check for duplicate location with exact same name and address
    const duplicate = await DeliveryLocation.findOne({
      locationName: { $regex: `^${locationName.trim()}$`, $options: 'i' },
      address: { $regex: `^${address.trim()}$`, $options: 'i' },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `A delivery location named "${duplicate.locationName}" with address "${duplicate.address}" already exists. You can edit it or use a distinct hub name.`,
      });
    }

    const location = await DeliveryLocation.create({
      locationName: locationName.trim(),
      address: address.trim(),
      city: (city || 'Delhi').trim(),
      state: (state || 'Delhi').trim(),
      pincode: String(pincode).trim(),
      coordinates: {
        latitude: lat,
        longitude: lng,
      },
      deliveryRadius: radius,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      notes: notes ? notes.trim() : '',
      createdBy: req.user?._id,
    });

    return res.status(201).json({
      success: true,
      message: `Delivery location "${location.locationName}" added successfully with a ${location.deliveryRadius} KM delivery radius.`,
      location,
    });
  } catch (error) {
    console.error('[DeliveryController] createDeliveryLocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create delivery location.',
      error: error.message,
    });
  }
};

/**
 * Admin: Bulk create or import multiple delivery locations
 * POST /api/delivery/admin/bulk-locations
 */
export const bulkCreateDeliveryLocations = async (req, res) => {
  try {
    const { locations } = req.body;
    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of delivery locations to create.',
      });
    }

    const createdList = [];
    const skippedList = [];

    for (const item of locations) {
      const { locationName, address, city, state, pincode, latitude, longitude, deliveryRadius, isActive, notes } = item;
      if (!locationName || !address || !pincode) {
        skippedList.push({ item, reason: 'Missing locationName, address, or pincode' });
        continue;
      }

      if (!isValidIndianPincode(pincode)) {
        skippedList.push({ item, reason: `Invalid PIN code: ${pincode}` });
        continue;
      }

      let lat = latitude !== undefined && latitude !== '' ? Number(latitude) : null;
      let lng = longitude !== undefined && longitude !== '' ? Number(longitude) : null;

      if (!isValidCoordinates(lat, lng)) {
        const resolved = resolvePincodeCoordinates(pincode);
        if (resolved && isValidCoordinates(resolved.latitude, resolved.longitude)) {
          lat = resolved.latitude;
          lng = resolved.longitude;
        }
      }

      if (!isValidCoordinates(lat, lng)) {
        skippedList.push({ item, reason: 'Coordinates could not be resolved' });
        continue;
      }

      const existing = await DeliveryLocation.findOne({
        locationName: { $regex: `^${locationName.trim()}$`, $options: 'i' },
        pincode: String(pincode).trim(),
      });

      if (existing) {
        // Update existing
        existing.address = address.trim();
        existing.city = (city || existing.city || 'Delhi').trim();
        existing.state = (state || existing.state || 'Delhi').trim();
        existing.coordinates = { latitude: lat, longitude: lng };
        existing.deliveryRadius = Number(deliveryRadius) || existing.deliveryRadius || 10;
        if (isActive !== undefined) existing.isActive = Boolean(isActive);
        await existing.save();
        createdList.push(existing);
      } else {
        const created = await DeliveryLocation.create({
          locationName: locationName.trim(),
          address: address.trim(),
          city: (city || 'Delhi').trim(),
          state: (state || 'Delhi').trim(),
          pincode: String(pincode).trim(),
          coordinates: { latitude: lat, longitude: lng },
          deliveryRadius: Number(deliveryRadius) || 10,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          notes: notes ? String(notes).trim() : '',
          createdBy: req.user?._id,
        });
        createdList.push(created);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Successfully processed ${createdList.length} delivery locations.`,
      createdCount: createdList.length,
      skippedCount: skippedList.length,
      locations: createdList,
      skipped: skippedList,
    });
  } catch (error) {
    console.error('[DeliveryController] bulkCreateDeliveryLocations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to bulk create delivery locations.',
      error: error.message,
    });
  }
};

/**
 * Admin: Seed default major metro delivery hubs across India
 * POST /api/delivery/admin/seed-defaults
 */
export const seedDefaultDeliveryLocations = async (req, res) => {
  try {
    const DEFAULT_HUBS = [
      {
        locationName: 'Delhi - Mayur Vihar Phase 1 Hub',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110091',
        latitude: 28.6056,
        longitude: 77.2917,
        deliveryRadius: 10,
        address: 'KAIA Technologies Pvt. Ltd., Mayur Vihar Phase 1, Near Unna Enclave, Delhi',
        notes: 'Primary Delhi NCR fulfillment hub with 10 KM delivery coverage',
      },
      {
        locationName: 'Delhi - Connaught Place Hub',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        latitude: 28.6315,
        longitude: 77.2167,
        deliveryRadius: 10,
        address: 'Barakhamba Road, Connaught Place, Central Delhi',
        notes: 'Central Delhi fast dispatch center',
      },
      {
        locationName: 'Noida - Sector 62 Tech Hub',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201309',
        latitude: 28.6280,
        longitude: 77.3649,
        deliveryRadius: 10,
        address: 'Electronic City, Sector 62, Noida, Uttar Pradesh',
        notes: 'Noida & East NCR delivery center',
      },
      {
        locationName: 'Gurgaon - Cyber City Hub',
        city: 'Gurgaon',
        state: 'Haryana',
        pincode: '122002',
        latitude: 28.4950,
        longitude: 77.0895,
        deliveryRadius: 10,
        address: 'DLF Cyber City, Phase 2, Gurugram, Haryana',
        notes: 'South NCR & Gurgaon corporate delivery center',
      },
      {
        locationName: 'Bangalore - Indiranagar Hub',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        latitude: 12.9784,
        longitude: 77.6408,
        deliveryRadius: 10,
        address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka',
        notes: 'East Bengaluru & Central tech corridor hub',
      },
      {
        locationName: 'Bangalore - Electronic City Hub',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560100',
        latitude: 12.8399,
        longitude: 77.6770,
        deliveryRadius: 10,
        address: 'Phase 1, Hosur Road, Electronic City, Bengaluru, Karnataka',
        notes: 'South Bengaluru fulfillment center',
      },
      {
        locationName: 'Mumbai - BKC Business Hub',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        latitude: 19.0657,
        longitude: 72.8687,
        deliveryRadius: 10,
        address: 'Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra',
        notes: 'Mumbai metro express hub',
      },
      {
        locationName: 'Hyderabad - HITEC City Hub',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        latitude: 17.4435,
        longitude: 78.3772,
        deliveryRadius: 10,
        address: 'Madhapur Main Road, HITEC City, Hyderabad, Telangana',
        notes: 'Hyderabad tech zone distribution center',
      },
    ];

    const results = [];
    for (const hub of DEFAULT_HUBS) {
      let record = await DeliveryLocation.findOne({
        $or: [
          { locationName: hub.locationName },
          { pincode: hub.pincode, city: hub.city },
        ],
      });

      if (record) {
        record.address = hub.address;
        record.city = hub.city;
        record.state = hub.state;
        record.pincode = hub.pincode;
        record.coordinates = { latitude: hub.latitude, longitude: hub.longitude };
        record.deliveryRadius = hub.deliveryRadius;
        record.isActive = true;
        record.notes = hub.notes;
        await record.save();
        results.push(record);
      } else {
        const created = await DeliveryLocation.create({
          ...hub,
          coordinates: { latitude: hub.latitude, longitude: hub.longitude },
          isActive: true,
          createdBy: req.user?._id,
        });
        results.push(created);
      }
    }

    return res.json({
      success: true,
      message: `Successfully configured ${results.length} multi-city delivery hubs across India.`,
      locations: results,
    });
  } catch (error) {
    console.error('[DeliveryController] seedDefaultDeliveryLocations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to seed default delivery locations.',
      error: error.message,
    });
  }
};

/**
 * Admin: Update an existing delivery location
 * PUT /api/admin/delivery-locations/:id
 */
export const updateDeliveryLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { locationName, address, city, state, pincode, latitude, longitude, deliveryRadius, isActive, notes } = req.body;

    const location = await DeliveryLocation.findById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Delivery location not found.',
      });
    }

    if (pincode && !isValidIndianPincode(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit Indian PIN code.',
      });
    }

    if (latitude !== undefined && longitude !== undefined) {
      if (!isValidCoordinates(latitude, longitude)) {
        return res.status(400).json({
          success: false,
          message: 'Valid geographical coordinates (Latitude: -90 to 90, Longitude: -180 to 180) are required.',
        });
      }
      location.coordinates = {
        latitude: Number(latitude),
        longitude: Number(longitude),
      };
    }

    if (locationName) location.locationName = locationName.trim();
    if (address) location.address = address.trim();
    if (city) location.city = city.trim();
    if (state) location.state = state.trim();
    if (pincode) location.pincode = String(pincode).trim();
    if (deliveryRadius !== undefined) location.deliveryRadius = Number(deliveryRadius) || 10;
    if (isActive !== undefined) location.isActive = Boolean(isActive);
    if (notes !== undefined) location.notes = notes.trim();

    await location.save();

    return res.json({
      success: true,
      message: `Delivery location "${location.locationName}" updated successfully.`,
      location,
    });
  } catch (error) {
    console.error('[DeliveryController] updateDeliveryLocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update delivery location.',
      error: error.message,
    });
  }
};

/**
 * Admin: Toggle active status
 * PATCH /api/admin/delivery-locations/:id/status
 */
export const toggleDeliveryLocationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await DeliveryLocation.findById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Delivery location not found.',
      });
    }

    location.isActive = !location.isActive;
    await location.save();

    return res.json({
      success: true,
      message: `Location "${location.locationName}" is now ${location.isActive ? 'Active' : 'Inactive'}.`,
      isActive: location.isActive,
    });
  } catch (error) {
    console.error('[DeliveryController] toggleDeliveryLocationStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle location status.',
      error: error.message,
    });
  }
};

/**
 * Admin: Delete a delivery location
 * DELETE /api/admin/delivery-locations/:id
 */
export const deleteDeliveryLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await DeliveryLocation.findByIdAndDelete(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Delivery location not found.',
      });
    }

    return res.json({
      success: true,
      message: `Delivery location "${location.locationName}" has been removed.`,
    });
  } catch (error) {
    console.error('[DeliveryController] deleteDeliveryLocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete delivery location.',
      error: error.message,
    });
  }
};

/**
 * Admin: Get delivery analytics metrics
 * GET /api/admin/delivery-locations/analytics
 */
export const getDeliveryAnalytics = async (req, res) => {
  try {
    const [totalLocations, activeLocations, totalChecks, serviceableChecks] = await Promise.all([
      DeliveryLocation.countDocuments(),
      DeliveryLocation.countDocuments({ isActive: true }),
      DeliveryCheckLog.countDocuments(),
      DeliveryCheckLog.countDocuments({ isServiceable: true }),
    ]);

    const unavailableChecks = totalChecks - serviceableChecks;
    const successRate = totalChecks > 0 ? Math.round((serviceableChecks / totalChecks) * 100) : 0;

    // Recent 10 check logs
    const recentLogs = await DeliveryCheckLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('pincode isServiceable calculatedDistance nearestLocationName createdAt');

    return res.json({
      success: true,
      analytics: {
        totalLocations,
        activeLocations,
        inactiveLocations: totalLocations - activeLocations,
        totalChecks,
        serviceableChecks,
        unavailableChecks,
        successRate,
        recentLogs,
      },
    });
  } catch (error) {
    console.error('[DeliveryController] getDeliveryAnalytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery analytics.',
      error: error.message,
    });
  }
};
