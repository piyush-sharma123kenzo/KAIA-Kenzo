import DeliveryLocation from '../models/DeliveryLocation.js';
import DeliveryCheckLog from '../models/DeliveryCheckLog.js';
import { calculateHaversineDistance, isValidIndianPincode, isValidCoordinates } from '../utils/geoUtils.js';

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

    // CASE 2: Only PIN code provided (PIN Match Verification)
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

    // PIN not directly listed as a center hub
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

  // Fallback to PIN code validation
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

    if (!isValidCoordinates(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Valid geographical coordinates (Latitude: -90 to 90, Longitude: -180 to 180) are required.',
      });
    }

    const radius = Number(deliveryRadius) || 10;
    if (radius < 0.5 || radius > 100) {
      return res.status(400).json({
        success: false,
        message: 'Delivery radius must be between 0.5 KM and 100 KM.',
      });
    }

    // Check for duplicate active location with identical coordinates
    const duplicate = await DeliveryLocation.findOne({
      'coordinates.latitude': Number(latitude),
      'coordinates.longitude': Number(longitude),
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `A delivery location (${duplicate.locationName}) with these exact coordinates already exists.`,
      });
    }

    const location = await DeliveryLocation.create({
      locationName: locationName.trim(),
      address: address.trim(),
      city: (city || 'Delhi').trim(),
      state: (state || 'Delhi').trim(),
      pincode: String(pincode).trim(),
      coordinates: {
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
      deliveryRadius: radius,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      notes: notes ? notes.trim() : '',
      createdBy: req.user?._id,
    });

    return res.status(201).json({
      success: true,
      message: `Service location "${location.locationName}" created successfully with a ${location.deliveryRadius} KM delivery radius.`,
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
