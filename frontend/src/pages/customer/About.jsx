import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, Building2, Truck, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';

const About = () => {
  return (
    <div className="bg-white min-h-screen font-sans text-left select-none pb-20">
      
      {/* Hero Header */}
      <section className="bg-amz-navy text-white py-16 px-4 md:px-8 border-b border-brand-gray-800">
        <Container className="max-w-5xl space-y-4">
          <span className="text-amz-orange font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-[3px] inline-block">
            About KAIA Technologies
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Curating India's Premier Multi-Brand Electronics Marketplace.
          </h1>
          <p className="text-sm text-brand-gray-300 max-w-2xl font-normal leading-relaxed">
            KAIA Technologies bridges the gap between authorized hardware manufacturers and technology enthusiasts, enterprises, and everyday consumers with verified inventory, immutable serial tracking, and full GST compliance.
          </p>
        </Container>
      </section>

      {/* Core Mission & Value Pillars */}
      <Container className="max-w-5xl py-12 space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-amz-bgGray/40 border border-amz-borderLight p-6 rounded-sm space-y-3 shadow-amzCard">
            <ShieldCheck className="w-8 h-8 text-amz-orange" />
            <h3 className="font-bold text-base text-amz-bodyInk">100% Authorized Procurement</h3>
            <p className="text-xs text-amz-secText leading-relaxed">
              Every laptop, smartphone, GPU, and audio component is cataloged and fulfilled directly from authorized brand depots with authentic manufacturer warranty cards.
            </p>
          </div>

          <div className="bg-amz-bgGray/40 border border-amz-borderLight p-6 rounded-sm space-y-3 shadow-amzCard">
            <Building2 className="w-8 h-8 text-amz-orange" />
            <h3 className="font-bold text-base text-amz-bodyInk">Enterprise GST Compliance</h3>
            <p className="text-xs text-amz-secText leading-relaxed">
              Seamlessly register corporate GSTIN credentials at checkout to claim 18% to 28% Input Tax Credit with automated multi-seller tax invoice generation.
            </p>
          </div>

          <div className="bg-amz-bgGray/40 border border-amz-borderLight p-6 rounded-sm space-y-3 shadow-amzCard">
            <Cpu className="w-8 h-8 text-amz-orange" />
            <h3 className="font-bold text-base text-amz-bodyInk">Serialized IMEI Tracking</h3>
            <p className="text-xs text-amz-secText leading-relaxed">
              Every dispatched unit is paired with unique factory serial numbers mapped at the packing workbench, safeguarding warranty claims and swift returns.
            </p>
          </div>
        </div>

        {/* Operating Model */}
        <div className="bg-white border border-amz-borderLight p-8 rounded-sm shadow-amzCard space-y-6">
          <h2 className="text-xl font-bold text-amz-bodyInk border-b border-amz-borderLight pb-3">
            How KAIA Multi-Brand Architecture Operates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-amz-secText leading-relaxed">
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-amz-bodyInk flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Single Cart, Multi-Depot Splitting</span>
              </h4>
              <p>
                Add ASUS laptops, Samsung flagships, and Sony headphones to a single customer cart. When you checkout, KAIA automatically coordinates separate seller fulfillments from each brand's regional warehouse.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-amz-bodyInk flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Express Insured Logistics</span>
              </h4>
              <p>
                Partnered with premier express logistics carriers including Blue Dart and Shiprocket, providing end-to-end milestone tracking and SMS delivery updates.
              </p>
            </div>
          </div>
        </div>

        {/* Action CTA */}
        <div className="bg-gradient-to-r from-amz-navy to-amz-navy2 p-8 rounded-sm text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Ready to explore authentic electronics?</h3>
            <p className="text-xs text-brand-gray-300">Browse thousands of products across 16+ verified hardware manufacturers.</p>
          </div>
          <Link to="/products">
            <button className="amz-btn-yellow font-bold text-xs px-6 py-2.5 whitespace-nowrap shadow-md">
              Explore Catalog ›
            </button>
          </Link>
        </div>

      </Container>
    </div>
  );
};

export default About;
