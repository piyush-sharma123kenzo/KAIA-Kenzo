import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import axiosInstance from '../api/axiosInstance';
import { reverseGeocodeCoordinates } from '../services/locationService';

export const LocationContext = createContext();

const STORAGE_KEY_LOCATION = 'kaia_selected_location';
const STORAGE_KEY_SAVED_ADDRESSES = 'kaia_saved_addresses';

export const LocationProvider = ({ children }) => {
  const { user } = useContext(AuthContext) || {};

  // Selected delivery location (for Header & Checkout)
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_LOCATION);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      recipientName: 'Customer',
      area: 'Delhi',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '',
      country: 'India',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      latitude: null,
      longitude: null,
      type: 'Home',
      isAutoDetected: false,
    };
  });

  // User's saved addresses
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_SAVED_ADDRESSES);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  });

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Sync saved addresses from backend when user is logged in
  useEffect(() => {
    const fetchUserAddresses = async () => {
      if (!user) return;
      try {
        const res = await axiosInstance.get('/account/addresses');
        if (res.data.success && Array.isArray(res.data.addresses)) {
          const list = res.data.addresses;
          setSavedAddresses(list);
          localStorage.setItem(STORAGE_KEY_SAVED_ADDRESSES, JSON.stringify(list));

          // If no active delivery location or currently default, select default address
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          if (defaultAddr && (!deliveryLocation.addressLine1 || deliveryLocation.isAutoDetected)) {
            const chosen = {
              _id: defaultAddr._id,
              recipientName: defaultAddr.fullName || defaultAddr.name || user.name || 'Customer',
              phone: defaultAddr.phone || user.phone || '',
              addressLine1: defaultAddr.addressLine1 || defaultAddr.street || '',
              addressLine2: defaultAddr.addressLine2 || '',
              landmark: defaultAddr.landmark || '',
              area: defaultAddr.landmark || defaultAddr.city,
              city: defaultAddr.city || 'Delhi',
              state: defaultAddr.state || 'Delhi',
              postalCode: defaultAddr.postalCode || '',
              country: defaultAddr.country || 'India',
              latitude: defaultAddr.latitude || null,
              longitude: defaultAddr.longitude || null,
              type: defaultAddr.type || defaultAddr.label || 'Home',
              isAutoDetected: false,
            };
            setDeliveryLocation(chosen);
            localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(chosen));
          }
        }
      } catch (err) {
        console.error('Failed to sync addresses with server:', err);
      }
    };

    fetchUserAddresses();
  }, [user]);

  // Persist deliveryLocation whenever it changes
  useEffect(() => {
    if (deliveryLocation) {
      localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(deliveryLocation));
    }
  }, [deliveryLocation]);

  /**
   * Detect user's current GPS location using Browser Geolocation API
   */
  const detectCurrentLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your current browser. Please enter your address manually.');
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const geocoded = await reverseGeocodeCoordinates(latitude, longitude);

          const newLocation = {
            recipientName: user?.name || 'Customer',
            phone: user?.phone || '',
            area: geocoded.area,
            city: geocoded.city,
            state: geocoded.state,
            postalCode: geocoded.postalCode,
            country: geocoded.country,
            addressLine1: geocoded.formatted,
            addressLine2: '',
            landmark: '',
            latitude: geocoded.latitude,
            longitude: geocoded.longitude,
            type: 'Home',
            isAutoDetected: true,
          };

          setDeliveryLocation(newLocation);
          setIsLocationModalOpen(false);
        } catch (err) {
          console.error('Reverse geocode failed:', err);
          setLocationError('Unable to resolve readable address from coordinates. Please select or search manually.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission was denied. Please allow location access in your browser or choose an address manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is currently unavailable. Please search or enter an address manually.');
            break;
          case error.TIMEOUT:
            setLocationError('Location detection timed out. Please try again or enter your address manually.');
            break;
          default:
            setLocationError('Failed to detect current location. Please enter your address manually.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  /**
   * Select a saved or searched address
   */
  const selectDeliveryAddress = (addr) => {
    const formatted = {
      _id: addr._id || null,
      recipientName: addr.fullName || addr.name || user?.name || 'Customer',
      phone: addr.phone || user?.phone || '',
      addressLine1: addr.addressLine1 || addr.street || addr.display || '',
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      area: addr.area || addr.city,
      city: addr.city || 'Delhi',
      state: addr.state || 'Delhi',
      postalCode: addr.postalCode || '',
      country: addr.country || 'India',
      latitude: addr.latitude || null,
      longitude: addr.longitude || null,
      type: addr.type || addr.label || 'Home',
      isAutoDetected: false,
    };
    setDeliveryLocation(formatted);
    setIsLocationModalOpen(false);
  };

  /**
   * Save a new address (Server if logged in, local fallback if guest)
   */
  const saveNewAddress = async (addressData) => {
    setLocationError(null);
    const formattedPayload = {
      fullName: addressData.fullName || addressData.name,
      name: addressData.fullName || addressData.name,
      phone: addressData.phone,
      addressLine1: addressData.addressLine1 || addressData.street,
      addressLine2: addressData.addressLine2 || '',
      landmark: addressData.landmark || '',
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode || addressData.pinCode,
      country: addressData.country || 'India',
      latitude: addressData.latitude || null,
      longitude: addressData.longitude || null,
      type: addressData.type || addressData.label || 'Home',
      label: addressData.type || addressData.label || 'Home',
      isDefault: addressData.isDefault || savedAddresses.length === 0,
    };

    if (user) {
      try {
        const res = await axiosInstance.post('/account/addresses', formattedPayload);
        if (res.data.success && Array.isArray(res.data.addresses)) {
          setSavedAddresses(res.data.addresses);
          localStorage.setItem(STORAGE_KEY_SAVED_ADDRESSES, JSON.stringify(res.data.addresses));
          const latest = res.data.addresses[res.data.addresses.length - 1];
          selectDeliveryAddress(latest);
          return { success: true, address: latest };
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to save address to account.';
        setLocationError(msg);
        throw new Error(msg);
      }
    } else {
      // Guest local storage address book
      const localId = `guest_addr_${Date.now()}`;
      const guestAddress = { ...formattedPayload, _id: localId };
      const updated = [...savedAddresses, guestAddress];
      setSavedAddresses(updated);
      localStorage.setItem(STORAGE_KEY_SAVED_ADDRESSES, JSON.stringify(updated));
      selectDeliveryAddress(guestAddress);
      return { success: true, address: guestAddress };
    }
  };

  /**
   * Delete an address
   */
  const deleteSavedAddress = async (id) => {
    if (user) {
      try {
        const res = await axiosInstance.delete(`/account/addresses/${id}`);
        if (res.data.success && Array.isArray(res.data.addresses)) {
          setSavedAddresses(res.data.addresses);
          localStorage.setItem(STORAGE_KEY_SAVED_ADDRESSES, JSON.stringify(res.data.addresses));
        }
      } catch (err) {
        console.error('Error deleting address:', err);
      }
    } else {
      const updated = savedAddresses.filter((a) => a._id !== id);
      setSavedAddresses(updated);
      localStorage.setItem(STORAGE_KEY_SAVED_ADDRESSES, JSON.stringify(updated));
    }
  };

  /**
   * Set an address as default
   */
  const setAddressAsDefault = async (id) => {
    if (user) {
      try {
        const res = await axiosInstance.post(`/account/addresses/${id}/default`);
        if (res.data.success && Array.isArray(res.data.addresses)) {
          setSavedAddresses(res.data.addresses);
          localStorage.setItem(STORAGE_KEY_SAVED_ADDRESSES, JSON.stringify(res.data.addresses));
          const def = res.data.addresses.find((a) => a._id === id);
          if (def) selectDeliveryAddress(def);
        }
      } catch (err) {
        console.error('Error setting default address:', err);
      }
    } else {
      const updated = savedAddresses.map((a) => ({
        ...a,
        isDefault: a._id === id,
      }));
      setSavedAddresses(updated);
      localStorage.setItem(STORAGE_KEY_SAVED_ADDRESSES, JSON.stringify(updated));
      const def = updated.find((a) => a._id === id);
      if (def) selectDeliveryAddress(def);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        deliveryLocation,
        savedAddresses,
        isDetectingLocation,
        locationError,
        setLocationError,
        isLocationModalOpen,
        openLocationModal: () => setIsLocationModalOpen(true),
        closeLocationModal: () => {
          setIsLocationModalOpen(false);
          setLocationError(null);
        },
        detectCurrentLocation,
        selectDeliveryAddress,
        saveNewAddress,
        deleteSavedAddress,
        setAddressAsDefault,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);

export default LocationContext;
