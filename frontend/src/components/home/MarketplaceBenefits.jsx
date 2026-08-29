import React from 'react';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import Container from '../ui/Container';

const MarketplaceBenefits = () => {
  const benefits = [
    'Compare specs dynamically across authorized seller configurations.',
    'Consolidate hardware checkout sessions into a single checkout cart.',
    'Automatic breakdown of split categories and parent orders.',
    'Direct seller serial mapping ensures accurate IMEI registry logs.',
    'Track logistics dispatches from Blue Dart or Shiprocket sandbox feeds.'
  ];

  return (
    <section className="py-16 bg-white border-y border-brand-gray-200 text-left">
      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left message box */}
        <div className="lg:col-span-6 space-y-6">
          <span className="text-[10px] font-bold tracking-wider text-brand-accent uppercase bg-brand-accent/5 px-2.5 py-1 rounded">
            Marketplace Advantage
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-brand-gray-900 tracking-tight leading-snug">
            One Unified Cart.<br />Direct Brand Deliveries.
          </h2>
          <p className="text-xs text-brand-gray-500 leading-relaxed">
            KAIA aggregates product inventory straight from official brand partners. This eliminates retail middle-markups while routing logistics natively from each brand's direct warehouses.
          </p>
        </div>

        {/* Right checklist column */}
        <div className="lg:col-span-6 space-y-4">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex items-start space-x-3 text-xs text-brand-gray-700">
              <CheckCircle2 className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{b}</span>
            </div>
          ))}
        </div>

      </Container>
    </section>
  );
};

export default MarketplaceBenefits;
