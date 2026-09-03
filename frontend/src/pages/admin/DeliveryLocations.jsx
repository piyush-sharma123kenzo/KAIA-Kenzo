import React, { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, 
  RefreshCw, TrendingUp, Navigation, ShieldCheck, AlertTriangle, 
  Layers, Globe, Check, X, Loader2, Building, Sparkles
} from 'lucide-react';
import deliveryService from '../../services/deliveryService';
import { useToast } from '../../context/ToastContext';

// Quick Presets for fast onboarding of multi-city hubs
const CITY_PRESETS = [
  {
    name: 'Custom Location / Area',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    radius: 10,
  },
  {
    name: 'Delhi - Mayur Vihar Phase 1 Hub',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110091',
    latitude: 28.6056,
    longitude: 77.2917,
    radius: 10,
    address: 'KAIA Technologies Pvt. Ltd., Mayur Vihar Phase 1, Near Unna Enclave, Delhi',
  },
  {
    name: 'Delhi - Connaught Place Hub',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6315,
    longitude: 77.2167,
    radius: 10,
    address: 'Barakhamba Road, Connaught Place, New Delhi',
  },
  {
    name: 'Noida - Sector 62 Tech Hub',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201309',
    latitude: 28.6280,
    longitude: 77.3649,
    radius: 10,
    address: 'Electronic City, Sector 62, Noida, Uttar Pradesh',
  },
  {
    name: 'Bangalore - Indiranagar Hub',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    latitude: 12.9784,
    longitude: 77.6408,
    radius: 10,
    address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka',
  },
  {
    name: 'Bangalore - Electronic City Hub',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    latitude: 12.8399,
    longitude: 77.6770,
    radius: 10,
    address: 'Phase 1, Hosur Road, Electronic City, Bengaluru, Karnataka',
  },
  {
    name: 'Mumbai - BKC Business Hub',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    latitude: 19.0657,
    longitude: 72.8687,
    radius: 10,
    address: 'Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra',
  },
  {
    name: 'Gurgaon - Cyber City Hub',
    city: 'Gurgaon',
    state: 'Haryana',
    pincode: '122002',
    latitude: 28.4950,
    longitude: 77.0895,
    radius: 10,
    address: 'DLF Cyber City, Phase 2, Gurugram, Haryana',
  },
];

const DeliveryLocations = () => {
  const toast = useToast();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    locationName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    deliveryRadius: 10,
    isActive: true,
    notes: '',
  });

  // Fetch Delivery Locations
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await deliveryService.getAdminLocations({
        page,
        limit: 10,
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        city: cityFilter !== 'all' ? cityFilter : undefined,
      });

      if (res.success) {
        setLocations(res.locations || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching admin delivery locations:', err);
      toast?.error?.('Failed to load delivery locations.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Delivery Analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await deliveryService.getDeliveryAnalytics();
      if (res.success) {
        setAnalytics(res.analytics);
      }
    } catch (err) {
      console.error('Error fetching delivery analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [page, search, statusFilter, cityFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormError('');
    setForm({
      locationName: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      latitude: '',
      longitude: '',
      deliveryRadius: 10,
      isActive: true,
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (loc) => {
    setEditingId(loc._id);
    setFormError('');
    setForm({
      locationName: loc.locationName || '',
      address: loc.address || '',
      city: loc.city || '',
      state: loc.state || '',
      pincode: loc.pincode || '',
      latitude: loc.coordinates?.latitude ?? '',
      longitude: loc.coordinates?.longitude ?? '',
      deliveryRadius: loc.deliveryRadius || 10,
      isActive: loc.isActive !== undefined ? loc.isActive : true,
      notes: loc.notes || '',
    });
    setModalOpen(true);
  };

  const handleSelectPreset = (preset) => {
    if (!preset.city && !preset.latitude) return;
    setForm((prev) => ({
      ...prev,
      locationName: preset.name,
      address: preset.address || prev.address,
      city: preset.city,
      state: preset.state,
      pincode: preset.pincode,
      latitude: preset.latitude,
      longitude: preset.longitude,
      deliveryRadius: preset.radius || 10,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.locationName.trim() || !form.address.trim() || !form.pincode.trim()) {
      setFormError('Location Name, Address, and PIN Code are required.');
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(form.pincode.trim())) {
      setFormError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    const lat = Number(form.latitude);
    const lng = Number(form.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      setFormError('Please provide valid Latitude (-90 to 90) and Longitude (-180 to 180) coordinates.');
      return;
    }

    const radius = Number(form.deliveryRadius);
    if (isNaN(radius) || radius < 0.5 || radius > 100) {
      setFormError('Delivery Radius must be between 0.5 KM and 100 KM.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await deliveryService.updateLocation(editingId, {
          ...form,
          latitude: lat,
          longitude: lng,
          deliveryRadius: radius,
        });
        if (res.success) {
          toast?.success?.(res.message || 'Delivery location updated successfully');
          setModalOpen(false);
          fetchLocations();
          fetchAnalytics();
        }
      } else {
        const res = await deliveryService.createLocation({
          ...form,
          latitude: lat,
          longitude: lng,
          deliveryRadius: radius,
        });
        if (res.success) {
          toast?.success?.(res.message || 'Delivery location created successfully');
          setModalOpen(false);
          fetchLocations();
          fetchAnalytics();
        }
      }
    } catch (err) {
      console.error('Error saving delivery location:', err);
      setFormError(err.response?.data?.message || 'Failed to save delivery location.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await deliveryService.toggleStatus(id);
      if (res.success) {
        toast?.success?.(res.message);
        setLocations((prev) =>
          prev.map((loc) => (loc._id === id ? { ...loc, isActive: res.isActive } : loc))
        );
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Error toggling location status:', err);
      toast?.error?.('Failed to toggle status.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      return;
    }

    try {
      const res = await deliveryService.deleteLocation(id);
      if (res.success) {
        toast?.success?.(res.message || 'Location removed successfully.');
        fetchLocations();
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Error deleting location:', err);
      toast?.error?.('Failed to delete location.');
    }
  };

  // Helper to fetch current browser GPS coords into form
  const handleDetectGPSInForm = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
      },
      (err) => {
        setFormError('Could not get GPS position: ' + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  // Compute unique cities for filter dropdown
  const uniqueCities = Array.from(new Set(locations.map((l) => l.city).filter(Boolean)));

  return (
    <div className="py-8 text-left space-y-8 max-w-7xl mx-auto font-sans px-4 sm:px-6 lg:px-8">
      
      {/* 1. Header with Title & Add Location CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
            <span>Admin Control Panel</span>
            <span>/</span>
            <span className="text-slate-900">Delivery Management</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-amber-500" />
            <span>Serviceable Delivery Hubs & Locations</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Add multiple fulfillment centers across Delhi, Noida, Bangalore, or any city. Delivery is calculated within a 10 KM radius of each configured center.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Service Location</span>
        </button>
      </div>

      {/* 2. Delivery Availability Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Service Hubs</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {analytics ? analytics.totalLocations : '...'}
          </div>
          <p className="text-[11px] text-slate-500">Configured delivery centers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Centers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {analytics ? analytics.activeLocations : '...'}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold">Live for customer orders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Delivery Checks</span>
            <Navigation className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {analytics ? analytics.totalChecks : '...'}
          </div>
          <p className="text-[11px] text-slate-500">Customer location verifications</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Serviceability Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {analytics ? `${analytics.successRate}%` : '...'}
          </div>
          <p className="text-[11px] text-slate-500">
            {analytics ? `${analytics.serviceableChecks} eligible / ${analytics.unavailableChecks} outside radius` : 'Calculating...'}
          </p>
        </div>
      </div>

      {/* 3. Search & Multi-City Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by city, area, address, or PIN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex items-center space-x-2.5 self-end sm:self-auto text-xs">
          <span className="text-slate-500 font-bold">City:</span>
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Cities</option>
            {uniqueCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <span className="text-slate-500 font-bold ml-2">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button
            onClick={() => {
              fetchLocations();
              fetchAnalytics();
            }}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Locations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
            <p className="text-xs font-medium">Loading serviceable locations...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="p-16 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl mx-auto flex items-center justify-center border border-amber-200/80">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900">No Serviceable Locations Added Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add multiple locations across Bangalore, Delhi, Noida, or any city. Delivery will automatically be available within a 10 KM radius of each active center.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer inline-flex items-center space-x-2"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add First Location</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80 text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Location Name</th>
                  <th className="py-3.5 px-4">City / State</th>
                  <th className="py-3.5 px-4">PIN Code</th>
                  <th className="py-3.5 px-4">Full Address</th>
                  <th className="py-3.5 px-4">Coordinates (Lat, Lng)</th>
                  <th className="py-3.5 px-4">Delivery Radius</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {locations.map((loc) => (
                  <tr key={loc._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate max-w-[180px]" title={loc.locationName}>{loc.locationName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-md font-bold text-[11px]">
                        {loc.city || 'Delhi'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      {loc.pincode}
                    </td>
                    <td className="py-4 px-4 text-slate-500 max-w-[200px] truncate" title={loc.address}>
                      {loc.address}
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-500">
                      {loc.coordinates?.latitude?.toFixed(4)}, {loc.coordinates?.longitude?.toFixed(4)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                        {loc.deliveryRadius || 10} KM
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(loc._id, loc.isActive)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all ${
                          loc.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle active status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${loc.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{loc.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(loc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
                          title="Edit Location"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(loc._id, loc.locationName)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200/80 transition-colors cursor-pointer"
                          title="Delete Location"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing page {page} of {totalPages} ({total} total locations)</span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Add / Edit Location Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200/90 space-y-5 text-left relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingId ? 'Edit Serviceable Location' : 'Add New Serviceable Location'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Configure city, area coordinates & custom delivery radius</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3 rounded-xl">
                {formError}
              </div>
            )}

            {/* Quick City Presets Dropdown */}
            {!editingId && (
              <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-2xl space-y-1.5 text-xs">
                <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Quick Autofill from Major City Presets:</span>
                </div>
                <select
                  onChange={(e) => {
                    const preset = CITY_PRESETS.find((p) => p.name === e.target.value);
                    if (preset) handleSelectPreset(preset);
                  }}
                  className="w-full bg-white border border-amber-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {CITY_PRESETS.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Location / Hub Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore - Indiranagar Tech Hub"
                  value={form.locationName}
                  onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru / Delhi / Noida"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Karnataka / Delhi / UP"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Street Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 100 Feet Road, Indiranagar, Bengaluru, Karnataka"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 560038"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl font-mono focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Delivery Radius (KM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="100"
                    placeholder="10"
                    value={form.deliveryRadius}
                    onChange={(e) => setForm({ ...form, deliveryRadius: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl font-mono focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    Geographical Coordinates <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGPSInForm}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-bold hover:underline inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3 text-amber-600" />
                    <span>Auto-detect My GPS</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude (e.g. 12.9784)"
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl font-mono text-[11px] focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude (e.g. 77.6408)"
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl font-mono text-[11px] focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="loc-active-check"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="loc-active-check" className="font-bold text-slate-800 cursor-pointer">
                  Activate this location immediately for live customer orders
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-black px-6 py-2 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Location' : 'Add Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryLocations;
