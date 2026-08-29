import React from 'react';
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import Container from '../ui/Container';

const WhyKaia = () => {
  const cards = [
    {
      title: 'Genuine Escrows',
      desc: 'Platform commissions and seller payouts are automatically mapped on Express transaction ledgers.',
      icon: ShieldCheck
    },
    {
      title: 'Split Order Checkout',
      desc: 'Purchase Apple and ASUS items together. We automatically split child orders for separate brand fulfillment.',
      icon: Truck
    },
    {
      title: 'Serial Warranties',
      desc: 'Warehouse unit serial barcodes mapped during packing are bound directly to active customer warranty claims.',
      icon: RotateCcw
    }
  ];

  return (
    <section className="py-16 bg-brand-light text-left">
      <Container className="space-y-12">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-brand-gray-900 tracking-tight">The KAIA Technologies Guarantee</h2>
          <p className="text-xs text-brand-gray-500">Constructing compliance, transparency, and trust in electronics commerce.</p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white border border-brand-gray-200 p-8 rounded-sm shadow-premium text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-brand-accent/5 flex items-center justify-center mx-auto text-brand-accent">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm text-brand-gray-900 uppercase tracking-tight">{item.title}</h3>
                <p className="text-xs text-brand-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </Container>
    </section>
  );
};

export default WhyKaia;
