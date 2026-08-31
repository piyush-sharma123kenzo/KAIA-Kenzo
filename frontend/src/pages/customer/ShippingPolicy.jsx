import React from 'react';
import Container from '../../components/ui/Container';

const ShippingPolicy = () => {
  return (
    <div className="bg-white min-h-screen font-sans text-left select-none pb-20">
      <section className="bg-amz-navy text-white py-12 px-4 md:px-8 border-b border-brand-gray-800">
        <Container className="max-w-4xl space-y-2">
          <span className="text-amz-orange font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-[3px] inline-block">
            Logistics & Delivery
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
            Shipping & Delivery Policy
          </h1>
          <p className="text-xs text-brand-gray-300">Fulfilled by KAIA Logistics & Authorized Brand Warehouses</p>
        </Container>
      </section>

      <Container className="max-w-4xl py-10 space-y-8 text-xs text-amz-bodyInk leading-relaxed font-normal">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">1. Delivery Zones & Timelines</h2>
          <p>
            KAIA Technologies coordinates express insured transit across 27,000+ PIN codes in India.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-amz-secText">
            <li><strong>Tier-1 Metro Cities:</strong> 2 to 3 business days</li>
            <li><strong>Tier-2 & Regional Towns:</strong> 4 to 6 business days</li>
            <li><strong>Special Transit Zones:</strong> 5 to 7 business days</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">2. Multi-Brand Split Shipments</h2>
          <p>
            When an order contains products from multiple manufacturers (e.g. ASUS and Sony), items are shipped separately from their respective brand warehouses. You receive distinct AWB tracking numbers for each package with no extra shipping surcharge.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">3. Free Shipping Threshold</h2>
          <p>
            All consumer orders with a cart value of ₹5,000 or above receive 100% Free Express Shipping. Orders below ₹5,000 incur a standard flat logistical fee of ₹150.
          </p>
        </div>
      </Container>
    </div>
  );
};

export default ShippingPolicy;
