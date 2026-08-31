import React from 'react';
import Container from '../../components/ui/Container';

const Terms = () => {
  return (
    <div className="bg-white min-h-screen font-sans text-left select-none pb-20">
      <section className="bg-amz-navy text-white py-12 px-4 md:px-8 border-b border-brand-gray-800">
        <Container className="max-w-4xl space-y-2">
          <span className="text-amz-orange font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-[3px] inline-block">
            Legal & Terms
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
            Conditions of Use & Sale
          </h1>
          <p className="text-xs text-brand-gray-300">Effective Date: August 2026</p>
        </Container>
      </section>

      <Container className="max-w-4xl py-10 space-y-8 text-xs text-amz-bodyInk leading-relaxed font-normal">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">1. The Marketplace Platform</h2>
          <p>
            KAIA Technologies operates a multi-brand e-commerce marketplace facilitating transactions between authorized electronics brand manufacturers ("Brand Sellers") and end-consumer or enterprise purchasers ("Buyers").
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">2. Authoritative Pricing & Stock Availability</h2>
          <p>
            Prices, MRPs, and inventory levels are set authoritatively by authorized brand partners and validated server-side during checkout. In the rare event of a system mispricing or inventory exhaustion, KAIA reserves the right to cancel unfulfilled orders with a prompt 100% refund.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">3. Master Orders and Split Child Orders</h2>
          <p>
            When a single cart purchase contains items from multiple brand partners, the master order is split into individual seller child orders. Each seller is independently responsible for packaging, serial tracking assignment, and courier handover of their items.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">4. Warranties and Brand Service Centers</h2>
          <p>
            All hardware devices sold on KAIA carry genuine brand manufacturer warranties. Claims can be serviced at authorized manufacturer repair centers across India using the official KAIA tax invoice and serial registration document.
          </p>
        </div>
      </Container>
    </div>
  );
};

export default Terms;
