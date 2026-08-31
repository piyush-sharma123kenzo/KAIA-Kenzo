import React from 'react';
import Container from '../../components/ui/Container';

const SellerPolicy = () => {
  return (
    <div className="bg-white min-h-screen font-sans text-left select-none pb-20">
      <section className="bg-amz-navy text-white py-12 px-4 md:px-8 border-b border-brand-gray-800">
        <Container className="max-w-4xl space-y-2">
          <span className="text-amz-orange font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-[3px] inline-block">
            Marketplace Guidelines
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
            Brand Seller & Merchant Policy
          </h1>
          <p className="text-xs text-brand-gray-300">Standards and SLA Obligations for KAIA Marketplace Partners</p>
        </Container>
      </section>

      <Container className="max-w-4xl py-10 space-y-8 text-xs text-amz-bodyInk leading-relaxed font-normal">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">1. Authorized Brand Verification</h2>
          <p>
            Only legally incorporated brand manufacturers and officially authorized national distributors are permitted to list products on KAIA. All partner profiles are subjected to manual admin compliance verification before publication.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">2. Serial/IMEI Scanning SLA</h2>
          <p>
            Brand fulfillment teams are required to scan and register genuine factory Serial Numbers / IMEIs for 100% of outbound order units during the packing workbench process prior to courier handover.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">3. Marketplace Settlement Cycle</h2>
          <p>
            Seller payables are calculated net of agreed marketplace commission rates and disbursed automatically to registered bank accounts following the completion of the 7-day customer return window.
          </p>
        </div>
      </Container>
    </div>
  );
};

export default SellerPolicy;
