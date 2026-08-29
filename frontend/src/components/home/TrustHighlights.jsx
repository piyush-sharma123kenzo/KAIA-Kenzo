import React from 'react';
import { ShieldCheck, Landmark, RotateCcw, Truck, Headphones } from 'lucide-react';
import Container from '../ui/Container';

const TrustHighlights = () => {
  const list = [
    { title: 'Authentic Stock', desc: 'Direct from brand warehouses', icon: ShieldCheck },
    { title: 'Trusted Brands', desc: 'Authorized partner listings', icon: Landmark },
    { title: 'Secure Payments', desc: 'Razorpay sandbox validated', icon: RotateCcw },
    { title: 'Fast Delivery', desc: 'Split brand logistics dispatches', icon: Truck },
    { title: 'Warranty Mapped', desc: 'Serial-locked system tracking', icon: Headphones },
  ];

  return (
    <div className="bg-white border-b border-brand-gray-200 py-6 text-left select-none shadow-sm">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x divide-brand-gray-200">
          {list.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${
                  idx > 0 ? 'pt-4 md:pt-0 md:pl-6' : ''
                }`}
              >
                <div className="p-2 bg-brand-light border rounded-sm text-brand-accent shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-xs text-brand-gray-900 uppercase tracking-tight">{item.title}</h4>
                  <p className="text-[10px] text-brand-gray-450 leading-relaxed font-semibold">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
};

export default TrustHighlights;
