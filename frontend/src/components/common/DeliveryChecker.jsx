import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import deliveryService from '../../services/deliveryService';
import { useLocationContext } from '../../context/LocationContext';

const DeliveryChecker = ({
  onChecked,
  className = '',
  compact = false,
  showTitle = true,
}) => {
  const { selectDeliveryAddress } = useLocationContext() || {};
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Check by 6-digit PIN Code
  const handlePinCheck = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    const cleanPin = pincode.trim();

    if (!cleanPin) {
      setErrorMsg('Please enter a 6-digit PIN code.');
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code (e.g., 110091).');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await deliveryService.checkDelivery({ pincode: cleanPin });
      setResult(res);
      if (onChecked) onChecked(res);
    } catch (err) {
      console.error('PIN Delivery check error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to verify delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Check using Browser Geolocation (with explicit user permission)
  const handleCurrentLocationCheck = () => {
    setErrorMsg('');
    setResult(null);

    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser. Please enter your PIN code manually.');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await deliveryService.checkDelivery({ latitude, longitude });
          setResult(res);
          if (onChecked) onChecked(res);
        } catch (err) {
          console.error('Geo Delivery check error:', err);
          setErrorMsg(err.response?.data?.message || 'Failed to check delivery for current location.');
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setLoading(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setErrorMsg('Location permission was denied. Please enter your 6-digit PIN code above.');
            break;
          case geoError.POSITION_UNAVAILABLE:
            setErrorMsg('Location information is unavailable. Please enter your PIN code manually.');
            break;
          case geoError.TIMEOUT:
            setErrorMsg('Location detection timed out. Please enter your PIN code manually.');
            break;
          default:
            setErrorMsg('Could not detect location. Please enter your PIN code manually.');
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

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 p-4 md:p-5 text-left space-y-3.5 shadow-xs ${className}`}>
      {showTitle && (
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Delivery Availability Checker
          </h4>
        </div>
      )}

      {/* Input row & Action buttons */}
      <div className="space-y-2.5">
        <form onSubmit={handlePinCheck} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit PIN code (e.g. 110091)"
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value.replace(/\D/g, ''));
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full bg-slate-50 border border-slate-200 pl-3.5 pr-10 py-2 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !pincode.trim()}
            className="bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 disabled:bg-slate-200 disabled:text-slate-400 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check'}
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>Or verify using GPS coordinates:</span>
          <button
            type="button"
            onClick={handleCurrentLocationCheck}
            disabled={loading}
            className="text-amber-700 hover:text-amber-900 font-bold inline-flex items-center space-x-1 hover:underline cursor-pointer disabled:opacity-50"
          >
            <Navigation className="w-3 h-3 text-amber-600" />
            <span>Use Current Location</span>
          </button>
        </div>
      </div>

      {/* Validation Error Message */}
      {errorMsg && (
        <div className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Loading state indicator */}
      {loading && (
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-600 font-medium animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Checking delivery availability & nearest service center...</span>
        </div>
      )}

      {/* Result Card: Serviceable */}
      {!loading && result && result.isServiceable && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-1 text-xs">
          <div className="flex items-center space-x-2 text-emerald-800 font-black">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>✓ Delivery Available to your location</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium pl-6 leading-relaxed">
            {result.distance !== null && result.distance !== undefined ? (
              <>
                Nearest KAIA Service Center:{' '}
                <strong className="text-emerald-900">{result.nearestLocation || 'Authorized Hub'}</strong>{' '}
                ({result.distance} KM away • Within {result.deliveryRadius || 10} KM limit).
              </>
            ) : (
              <>Eligible for direct dispatch from our nearest authorized service center.</>
            )}
          </p>
          <div className="pl-6 pt-1 text-[10px] font-bold text-emerald-800">
            Estimated Delivery: 24 - 48 Hours with Free Standard Shipping
          </div>
        </div>
      )}

      {/* Result Card: Not Serviceable */}
      {!loading && result && !result.isServiceable && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3.5 space-y-1 text-xs">
          <div className="flex items-center space-x-2 text-rose-800 font-black">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>✕ Delivery Not Available in your area yet</span>
          </div>
          <p className="text-[11px] text-rose-700 font-medium pl-6 leading-relaxed">
            {result.nearestLocation ? (
              <>
                Nearest Service Area: <strong className="text-rose-900">{result.nearestLocation}</strong>
                {result.distance ? ` (${result.distance} KM away)` : ''}.
              </>
            ) : null}{' '}
            We currently deliver strictly within a {result.deliveryRadius || 10} KM radius of our service centers.
          </p>
        </div>
      )}
    </div>
  );
};

export default DeliveryChecker;
