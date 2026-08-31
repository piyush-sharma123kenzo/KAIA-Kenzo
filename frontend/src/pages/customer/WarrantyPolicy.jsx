import React from 'react';
import Container from '../../components/ui/Container';

const WarrantyPolicy = () => {
  return (
    <div className="bg-white min-h-screen font-sans text-left select-none pb-20">
      <section className="bg-amz-navy text-white py-12 px-4 md:px-8 border-b border-brand-gray-800">
        <Container className="max-w-4xl space-y-2">
          <span className="text-amz-orange font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-[3px] inline-block">
            Hardware Assurance
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
            Manufacturer Warranty Policy
          </h1>
          <p className="text-xs text-brand-gray-300">Direct Brand Warranty Guaranteed Across India</p>
        </Container>
      </section>

      <Container className="max-w-4xl py-10 space-y-8 text-xs text-amz-bodyInk leading-relaxed font-normal">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">1. Official Brand Manufacturer Warranty</h2>
          <p>
            Every product cataloged on KAIA Technologies is sourced directly from authorized manufacturer inventory and carries official brand warranties (typically 1 to 3 years depending on the hardware category).
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">2. Serial Number Digital Registration</h2>
          <p>
            At the time of packing, your unit's factory Serial Number or IMEI is captured into the KAIA Warranty Registry. You can view, verify, and export your digital warranty certificate anytime under Your Account › Warranties.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">3. Claiming In-Warranty Service</h2>
          <p>
            To claim warranty repairs or technical service, simply present your official KAIA tax invoice and serial certificate at any authorized brand service center nationwide (e.g. ASUS Exclusive Service Centers, Dell Authorized Service Centers, Samsung Care Centers).
          </p>
        </div>
      </Container>
    </div>
  );
};

export default WarrantyPolicy;
