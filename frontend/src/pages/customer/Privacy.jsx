import React from 'react';
import Container from '../../components/ui/Container';

const Privacy = () => {
  return (
    <div className="bg-white min-h-screen font-sans text-left select-none pb-20">
      <section className="bg-amz-navy text-white py-12 px-4 md:px-8 border-b border-brand-gray-800">
        <Container className="max-w-4xl space-y-2">
          <span className="text-amz-orange font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-[3px] inline-block">
            Legal & Compliance
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
            Privacy Notice
          </h1>
          <p className="text-xs text-brand-gray-300">Last updated: August 2026</p>
        </Container>
      </section>

      <Container className="max-w-4xl py-10 space-y-8 text-xs text-amz-bodyInk leading-relaxed font-normal">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">1. Information We Collect</h2>
          <p>
            KAIA Technologies collects information to process your hardware orders, calculate location-specific GST input credits, coordinate courier logistics, and fulfill manufacturer warranty registrations. This includes your name, delivery address, phone number, email address, corporate GSTIN (for business accounts), and encrypted transaction tokens via Razorpay.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">2. Multi-Brand Seller Information Sharing</h2>
          <p>
            When you purchase products from multiple authorized manufacturer depots (e.g. ASUS, Samsung, Sony), your delivery address and contact phone number are shared solely with the relevant brand seller and logistics carriers (Blue Dart, Shiprocket) strictly for package packing, serial assignment, and door-to-door delivery.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">3. Payment & Financial Data Security</h2>
          <p>
            KAIA does NOT store or process raw credit card numbers or UPI PINs. All financial payments are securely processed by RBI-licensed payment gateways (Razorpay) over TLS 1.3 encryption and verified using cryptographic HMAC-SHA256 signatures.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">4. Your Privacy Rights</h2>
          <p>
            You can access, update, or remove your saved addresses, view active warranties, and download your tax invoices at any time under Your Account. For data deletion inquiries, contact <a href="mailto:privacy@kaia.tech" className="text-amz-linkBlue hover:underline">privacy@kaia.tech</a>.
          </p>
        </div>
      </Container>
    </div>
  );
};

export default Privacy;
