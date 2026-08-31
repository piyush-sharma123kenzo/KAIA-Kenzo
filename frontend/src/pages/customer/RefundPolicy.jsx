import React from 'react';
import Container from '../../components/ui/Container';

const RefundPolicy = () => {
  return (
    <div className="bg-white min-h-screen font-sans text-left select-none pb-20">
      <section className="bg-amz-navy text-white py-12 px-4 md:px-8 border-b border-brand-gray-800">
        <Container className="max-w-4xl space-y-2">
          <span className="text-amz-orange font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-[3px] inline-block">
            Customer Protection
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
            Return & Refund Policy
          </h1>
          <p className="text-xs text-brand-gray-300">Policy effective across all 16+ authorized brand depots</p>
        </Container>
      </section>

      <Container className="max-w-4xl py-10 space-y-8 text-xs text-amz-bodyInk leading-relaxed font-normal">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">1. 7-Day Replacement & Return Window</h2>
          <p>
            You may request a return or replacement for electronic hardware items within 7 calendar days of delivery in the event of:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-amz-secText">
            <li>Dead on Arrival (DOA) or hardware manufacturing defect</li>
            <li>Physical damage sustained during courier transit</li>
            <li>Specification mismatch or incorrect model received</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">2. Serial Number & Barcode Verification</h2>
          <p>
            To prevent fraud and protect customer warranty validity, returned products are inspected at the depot testing bench to verify that the factory Serial Number / IMEI matches the unit registered on your original dispatch label.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-amz-bodyInk border-b pb-2">3. Refund Timeline & Processing</h2>
          <p>
            Once the returned hardware is received and passes diagnostic inspection, the refund is automatically initiated to your source payment method (UPI / Bank Account / Card) via Razorpay within 3 to 5 business days.
          </p>
        </div>
      </Container>
    </div>
  );
};

export default RefundPolicy;
