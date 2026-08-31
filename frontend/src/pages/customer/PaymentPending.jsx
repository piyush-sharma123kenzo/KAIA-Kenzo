/**
 * PaymentPending.jsx — Payment Pending / Awaiting Confirmation Page
 *
 * Shown when payment flow is asynchronous (e.g. UPI collect, netbanking redirect).
 * Polls backend for status updates — does NOT trust any frontend state as authoritative.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Clock, RefreshCw, ArrowRight, ShoppingBag, Phone, Loader2 } from 'lucide-react';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import PaymentStatus from '../../components/payment/PaymentStatus';
import { getPaymentStatus } from '../../services/paymentService';

const PaymentPending = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId || new URLSearchParams(location.search).get('orderId');

  const [pollingActive, setPollingActive] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [lastChecked, setLastChecked] = useState(null);
  const [manualChecking, setManualChecking] = useState(false);
  const timerRef = useRef(null);

  const MAX_POLLS = 12; // 12 × 5s = 60s auto-polling
  const POLL_INTERVAL = 5000;
  const TERMINAL = ['paid', 'failed', 'cancelled'];

  const checkStatus = async (isManual = false) => {
    if (!orderId) return;
    if (isManual) setManualChecking(true);

    try {
      const data = await getPaymentStatus(orderId);
      const newStatus = (data.paymentStatus || 'pending').toLowerCase();
      setPaymentStatus(newStatus);
      setLastChecked(new Date());

      if (newStatus === 'paid') {
        setPollingActive(false);
        clearInterval(timerRef.current);
        // Redirect to order success after a brief delay
        setTimeout(() => navigate(`/order-success`, { state: { orderId, paymentStatus: 'paid' } }), 1500);
      } else if (newStatus === 'failed' || newStatus === 'cancelled') {
        setPollingActive(false);
        clearInterval(timerRef.current);
        setTimeout(() => navigate(`/payment-failed`, { state: { orderId } }), 1500);
      }
    } catch {
      // Non-fatal — keep polling
    } finally {
      if (isManual) setManualChecking(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    checkStatus();
    timerRef.current = setInterval(() => {
      setPollCount((c) => {
        const newCount = c + 1;
        if (newCount >= MAX_POLLS) {
          clearInterval(timerRef.current);
          setPollingActive(false);
          return newCount;
        }
        checkStatus();
        return newCount;
      });
    }, POLL_INTERVAL);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <Container className="py-16 max-w-xl mx-auto">
      <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">

        {/* Header */}
        <div className="bg-brand-dark px-8 py-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-4">
            {pollingActive ? (
              <Loader2 className="w-7 h-7 text-yellow-400 animate-spin" />
            ) : (
              <Clock className="w-7 h-7 text-yellow-400" />
            )}
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">
            Payment Pending
          </h1>
          <p className="text-xs text-brand-gray-400 mt-1 font-semibold">
            Your payment is being confirmed with the gateway
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Order Reference */}
          {orderId && (
            <div className="bg-brand-light border border-brand-gray-200 rounded px-4 py-3 text-xs font-semibold text-brand-gray-650">
              <span className="text-brand-gray-400 uppercase tracking-wider text-[9px] block mb-1">Order Reference</span>
              <span className="font-mono font-extrabold text-brand-gray-900 text-sm">{orderId}</span>
            </div>
          )}

          {/* Status Display */}
          <PaymentStatus
            orderId={orderId}
            initialStatus="pending"
            autoPolling={false} // We handle our own polling above
          />

          {/* Polling Info */}
          {pollingActive && (
            <div className="flex items-center space-x-2 text-[10px] text-brand-gray-450 font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>
                Auto-checking status every 5 seconds...
                {lastChecked && ` Last checked: ${lastChecked.toLocaleTimeString()}`}
              </span>
            </div>
          )}

          {!pollingActive && pollCount >= MAX_POLLS && (
            <div className="bg-yellow-50 border border-yellow-200 rounded px-4 py-3 text-xs font-semibold text-yellow-800">
              Auto-checking has stopped after 60 seconds. Please check manually or visit your orders.
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2 border-t border-brand-gray-100">
            <Button
              variant="secondary"
              onClick={() => checkStatus(true)}
              disabled={manualChecking}
              className="w-full text-xs uppercase font-bold tracking-wider flex items-center justify-center space-x-2"
              id="check-status-manually-btn"
            >
              {manualChecking ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Checking...</span></>
              ) : (
                <><RefreshCw className="w-4 h-4" /><span>Check Status Now</span></>
              )}
            </Button>

            <Link to={`/checkout/payment/retry/${orderId}`}>
              <Button variant="outline" className="w-full text-xs uppercase font-bold tracking-wider">
                Try a Different Payment Method
              </Button>
            </Link>

            <Link to="/account?tab=orders" className="block text-center text-xs font-bold text-brand-accent hover:underline uppercase tracking-wider pt-1">
              View My Orders
            </Link>
          </div>

          {/* Help Note */}
          <div className="text-[9px] text-brand-gray-400 font-medium leading-relaxed border-t border-brand-gray-100 pt-4">
            If your payment was debited but not confirmed, please wait up to 30 minutes for
            automatic resolution. Contact KAIA support with your order ID if the issue persists.
          </div>
        </div>

      </div>
    </Container>
  );
};

export default PaymentPending;
