import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Search, Plus, Home, Building2, 
  Check, X, AlertCircle, Loader2, Compass, Trash2, Star
} from 'lucide-react';
import { useLocationContext } from '../../context/LocationContext';
import { searchLocations } from '../../services/locationService';

const LocationSelectorModal = () => {
  const {
    deliveryLocation,
    deliveryInfo,
    savedAddresses,
    isDetectingLocation,
    locationError,
    setLocationError,
    isLocationModalOpen,
    closeLocationModal,
    detectCurrentLocation,
    selectDeliveryAddress,
    saveNewAddress,
    deleteSavedAddress,
    setAddressAsDefault,
  } = useLocationContext();

  const [activeTab, setActiveTab] = useState('saved'); // 'saved' | 'search' | 'new'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // New Address Form State
  const [newAddrForm, setNewAddrForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    type: 'Home',
    isDefault: false,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Default to 'new' tab if no saved addresses exist
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0) {
      setActiveTab('saved');
    } else {
      setActiveTab('search');
    }
  }, [savedAddresses]);

  // Debounced real-time locality search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isLocationModalOpen) return null;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await saveNewAddress(newAddrForm);
      setNewAddrForm({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        type: 'Home',
        isDefault: false,
      });
      closeLocationModal();
    } catch (err) {
      // Error handled by context
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] text-left font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight">Choose Delivery Location</h3>
              <p className="text-[11px] text-slate-400">Select an address to see product availability and shipping speed</p>
            </div>
          </div>
          <button
            onClick={closeLocationModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Current Location Button Strip */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <button
            onClick={detectCurrentLocation}
            disabled={isDetectingLocation}
            className="w-full bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-400/80 rounded-xl p-3.5 flex items-center justify-between text-slate-800 transition-all shadow-sm group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                {isDetectingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Navigation className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                )}
              </div>
              <div className="text-left">
                <span className="font-bold text-xs text-slate-900 block group-hover:text-amber-800">
                  {isDetectingLocation ? 'Detecting current GPS location...' : 'Use Current Location'}
                </span>
                <span className="text-[11px] text-slate-500">
                  Detect via GPS satellite & reverse geocoding
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-md">
              Auto Detect
            </span>
          </button>
        </div>

        {/* Error Alert Banner */}
        {locationError && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200/80 rounded-xl text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">{locationError}</span>
              <button 
                onClick={() => setLocationError(null)} 
                className="text-[11px] text-red-800 font-bold underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-4 pt-3 bg-white text-xs font-semibold">
          {savedAddresses.length > 0 && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
                activeTab === 'saved'
                  ? 'border-amber-500 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Saved Addresses ({savedAddresses.length})</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'search'
                ? 'border-amber-500 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Area / PIN</span>
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'new'
                ? 'border-amber-500 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enter Address</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 overflow-y-auto max-h-[50vh] space-y-4">
          
          {/* TAB 1: SAVED ADDRESSES */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              {savedAddresses.map((addr) => {
                const isSelected = deliveryLocation?._id === addr._id || 
                  (deliveryLocation?.addressLine1 === (addr.addressLine1 || addr.street) && !deliveryLocation.isAutoDetected);

                return (
                  <div
                    key={addr._id || addr.id}
                    onClick={() => selectDeliveryAddress(addr)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900">{addr.fullName || addr.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {addr.type || addr.label || 'Home'}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {addr.addressLine1 || addr.street}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                          {addr.landmark ? `, Near ${addr.landmark}` : ''}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {addr.city}, {addr.state} - <span className="font-mono font-bold">{addr.postalCode}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono pt-0.5">Phone: {addr.phone}</p>
                      </div>

                      <div className="flex flex-col items-end space-y-2 shrink-0">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedAddress(addr._id);
                          }}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SEARCH LOCALITY */}
          {activeTab === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search area, locality, city or 6-digit PIN code (e.g. Mayur Vihar)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-900"
                  autoFocus
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin absolute right-3 top-3" />
                )}
              </div>

              {searchResults.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden bg-white">
                  {searchResults.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => selectDeliveryAddress(loc)}
                      className="w-full p-3 text-left hover:bg-amber-50/60 transition-colors flex items-start space-x-2.5 group"
                    >
                      <MapPin className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs text-slate-900 group-hover:text-amber-800">{loc.name}</p>
                        <p className="text-[11px] text-slate-500 leading-snug">{loc.display}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 && !isSearching ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  <Compass className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p>No exact area match for "{searchQuery}".</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Try searching with a city name, district, or PIN code.</p>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 space-y-1">
                  <Search className="w-7 h-7 text-slate-300 mx-auto mb-1" />
                  <p className="font-semibold text-slate-600">Search any Indian locality or PIN code</p>
                  <p className="text-[11px] text-slate-400">e.g. "Mayur Vihar Phase 1", "Connaught Place", "560001"</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ENTER NEW ADDRESS FORM */}
          {activeTab === 'new' && (
            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Piyush Sharma"
                    value={newAddrForm.fullName}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, fullName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={newAddrForm.phone}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Flat / House No. / Building *</label>
                <input
                  type="text"
                  required
                  placeholder="Flat 302, Building A"
                  value={newAddrForm.addressLine1}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, addressLine1: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Street / Area / Locality</label>
                  <input
                    type="text"
                    placeholder="Mayur Vihar Phase 1"
                    value={newAddrForm.addressLine2}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, addressLine2: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Landmark</label>
                  <input
                    type="text"
                    placeholder="Near Unna Enclave"
                    value={newAddrForm.landmark}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, landmark: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Delhi"
                    value={newAddrForm.city}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, city: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="Delhi"
                    value={newAddrForm.state}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, state: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="110091"
                    value={newAddrForm.postalCode}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, postalCode: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Address Type */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Address Type</label>
                <div className="flex space-x-2">
                  {['Home', 'Work', 'Other'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewAddrForm({ ...newAddrForm, type: t })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        newAddrForm.type === t
                          ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Saving Address...</span>
                    </>
                  ) : (
                    <span>Save & Deliver to this Address</span>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info pill with real delivery serviceability status */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5 truncate max-w-[340px]">
            <span className={`w-2 h-2 rounded-full shrink-0 ${deliveryInfo?.isServiceable ? 'bg-emerald-500' : deliveryInfo?.isServiceable === false ? 'bg-rose-500' : 'bg-slate-400'}`} />
            <span className="truncate">
              Currently: <strong>{deliveryLocation.area || deliveryLocation.city || 'Delhi, India'}</strong>
              {deliveryInfo?.distance !== null && deliveryInfo?.distance !== undefined ? ` (${deliveryInfo.distance} KM from hub)` : ''}
            </span>
            {deliveryInfo && deliveryInfo.isServiceable !== null && (
              <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] shrink-0 ${deliveryInfo.isServiceable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {deliveryInfo.isServiceable ? 'Serviceable' : 'Outside 10 KM'}
              </span>
            )}
          </div>
          <button onClick={closeLocationModal} className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer shrink-0 ml-2">
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default LocationSelectorModal;
