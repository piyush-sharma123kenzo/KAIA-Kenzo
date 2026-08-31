/**
 * PaymentStatus.jsx — Payment Status Display Component
 * Shows payment status with appropriate visual indicators.
 */

import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { getPaymentStatus } from '../../services/paymentService';

const STATUS_CONFIG = {
  paid: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Payment Confirmed',
    description: 'Your payment has been successfully verified.',
  },
  authorized: {
    icon: CheckCircle2,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Payment Authorized',
    description: 'Your payment has been authorized and is being captured.',
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Payment Pending',
    description: 'Your payment is being processed. Please wait.',
  },
  created: {
    icon: Clock,
    color: 'text-brand-gray-500',
    bg: 'bg-brand-light',
    border: 'border-brand-gray-200',
    label: 'Payment Initiated',
    description: 'Payment has been initiated.',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Payment Failed',
    description: 'Your payment could not be completed.',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
    label: 'Payment Cancelled',
    description: 'The payment was cancelled.',
  },
  unknown: {
    icon: AlertCircle,
    color: 'text-brand-gray-500',
    bg: 'bg-brand-light',
    border: 'border-brand-gray-200',
    label: 'Status Unknown',
    description: 'Payment status is being checked.',
  },
};

const PaymentStatus = ({
  orderId,
  initialStatus = 'unknown',
  autoPolling = false,   // Enable polling for pending payments
  pollInterval = 5000,   // Poll every 5 seconds
  maxPolls = 12,         // Stop after ~60 seconds
  onStatusChange,        // callback(newStatus)
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const pollCountRef = useRef(0);
  const timerRef = useRef(null);

  const TERMINAL_STATUSES = ['paid', 'failed', 'cancelled', 'refunded'];

  const fetchStatus = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await getPaymentStatus(orderId);
      const newStatus = (data.paymentStatus || 'unknown').toLowerCase();
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
      return newStatus;
    } catch (err) {
      console.error('Payment status check failed:', err.message);
      return status;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoPolling || !orderId) return;

    const poll = async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current > maxPolls) {
        clearInterval(timerRef.current);
        return;
      }

      const currentStatus = await fetchStatus();

      // Stop polling when terminal status is reached
      if (TERMINAL_STATUSES.includes(currentStatus)) {
        clearInterval(timerRef.current);
      }
    };

    // Initial fetch immediately
    poll();
    timerRef.current = setInterval(poll, pollInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, autoPolling]);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const StatusIcon = config.icon;

  return (
    <div
      className={`flex items-start space-x-3 border rounded px-4 py-3 ${config.bg} ${config.border}`}
      id={`payment-status-${orderId}`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 text-brand-gray-500 animate-spin shrink-0 mt-0.5" />
      ) : (
        <StatusIcon className={`w-5 h-5 ${config.color} shrink-0 mt-0.5`} />
      )}
      <div className="space-y-0.5">
        <p className={`text-xs font-extrabold uppercase tracking-wide ${config.color}`}>
          {config.label}
        </p>
        <p className="text-[10px] font-semibold text-brand-gray-550">
          {config.description}
        </p>
        {autoPolling && !TERMINAL_STATUSES.includes(status) && (
          <p className="text-[9px] text-brand-gray-400 font-medium mt-1">
            Auto-checking status... ({pollCountRef.current}/{maxPolls})
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
