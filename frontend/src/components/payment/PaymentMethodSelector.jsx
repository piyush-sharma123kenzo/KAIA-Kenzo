/**
 * PaymentMethodSelector.jsx — Payment Method Selection Component
 *
 * Security:
 * - This component does NOT handle payment credentials.
 * - UPI/Card/NetBanking authentication is handled ENTIRELY by the Razorpay gateway.
 * - KAIA never collects: UPI PIN, card CVV, net banking passwords, OTPs.
 * - The provider's secure checkout UI handles all sensitive input.
 */

import React from 'react';
import { Smartphone, CreditCard, Landmark, Wallet, Package } from 'lucide-react';

const PAYMENT_METHODS = [
  {
    id: 'UPI',
    label: 'UPI',
    icon: Smartphone,
    description: 'Pay with any UPI app — Google Pay, PhonePe, BHIM, Paytm & more',
    badge: 'Recommended',
    badgeColor: 'bg-green-600',
    gatewayNote: 'UPI authentication handled by your app/gateway',
  },
  {
    id: 'Net Banking',
    label: 'Net Banking',
    icon: Landmark,
    description: 'Select your bank and complete payment on the bank portal',
    badge: null,
    gatewayNote: 'Banking credentials handled by your bank portal',
  },
  {
    id: 'Card',
    label: 'Credit / Debit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, RuPay and more — secured by gateway',
    badge: null,
    gatewayNote: 'Card details handled by Razorpay secure checkout',
  },
  {
    id: 'COD',
    label: 'Cash on Delivery',
    icon: Package,
    description: 'Pay in cash when your order arrives',
    badge: 'Limited',
    badgeColor: 'bg-brand-gray-600',
    gatewayNote: 'No online payment required',
  },
];

const PaymentMethodSelector = ({ selectedMethod, onMethodChange, disabled = false }) => {
  return (
    <div className="space-y-3" role="radiogroup" aria-label="Payment method selection">
      {PAYMENT_METHODS.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;

        return (
          <label
            key={method.id}
            htmlFor={`payment-method-${method.id}`}
            className={`flex items-start space-x-3 p-4 border rounded-sm cursor-pointer transition-all select-none ${
              isSelected
                ? 'border-brand-accent bg-brand-accent/5 shadow-sm'
                : 'border-brand-gray-250 hover:border-brand-gray-400 hover:bg-brand-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              id={`payment-method-${method.id}`}
              name="payment_method"
              value={method.id}
              checked={isSelected}
              onChange={() => !disabled && onMethodChange(method.id)}
              className="text-brand-accent focus:ring-brand-accent mt-0.5 w-4 h-4 shrink-0"
              disabled={disabled}
              aria-label={method.label}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand-accent' : 'text-brand-gray-500'}`} />
                <span className="text-xs font-extrabold text-brand-gray-900 uppercase tracking-wide">
                  {method.label}
                </span>
                {method.badge && (
                  <span className={`text-[8px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded ${method.badgeColor}`}>
                    {method.badge}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-brand-gray-500 font-semibold leading-relaxed">
                {method.description}
              </p>
              {isSelected && (
                <p className="text-[9px] text-brand-gray-400 font-medium mt-1 italic">
                  🔒 {method.gatewayNote}
                </p>
              )}
            </div>
          </label>
        );
      })}

      {/* Security disclosure */}
      <div className="text-[9px] text-brand-gray-400 font-medium leading-relaxed pt-2 border-t border-brand-gray-100">
        KAIA Technologies does not store payment credentials. Card details, UPI PINs, and banking
        passwords are handled exclusively by the payment gateway (Razorpay) in a PCI-DSS compliant environment.
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
