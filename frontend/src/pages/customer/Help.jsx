import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, Package, RefreshCw, ShieldCheck, FileText, 
  ChevronDown, ChevronUp, Search, MessageSquare, ArrowRight 
} from 'lucide-react';
import Container from '../../components/ui/Container';

const FAQ_ITEMS = [
  {
    category: 'Orders & Tracking',
    icon: Package,
    questions: [
      {
        q: 'How do I track my multi-brand shipment?',
        a: 'When you place an order containing multiple brands (e.g. ASUS and Samsung), KAIA automatically splits the master order into separate child seller orders. You can track each shipment independently under "Your Account › Orders › Tracking" with real-time milestone events from Blue Dart or Shiprocket.',
      },
      {
        q: 'Can I cancel an order after placing it?',
        a: 'Yes, orders can be cancelled directly from your account page before the brand seller marks the package as "Shipped" or assigns courier logistics. Once dispatched, you can initiate a return within 7 days of delivery.',
      },
    ],
  },
  {
    category: 'GST & Corporate Billing',
    icon: FileText,
    questions: [
      {
        q: 'How do I get a GST input tax credit invoice for business purchases?',
        a: 'During checkout, check the "Buying for a business?" option and enter your company GSTIN and trade name. Once payment is confirmed, an official GST tax invoice with HSN codes and CGST/SGST/IGST breakdown is generated automatically and downloadable as a PDF.',
      },
      {
        q: 'Why are invoices split per brand?',
        a: 'Under Indian GST rules for marketplace e-commerce operators, each authorized brand entity issues an independent tax invoice for goods dispatched from its warehouse depot.',
      },
    ],
  },
  {
    category: 'Returns & Replacements',
    icon: RefreshCw,
    questions: [
      {
        q: 'What is the KAIA return policy for electronics?',
        a: 'We offer a 7-day transit replacement and return policy for defective, damaged, or mismatched items. Return requests are validated against the unique factory Serial/IMEI barcode assigned at packing.',
      },
      {
        q: 'How quickly is my refund processed?',
        a: 'Once the returned hardware is received and verified at the brand depot, refunds are credited back to your original payment method (Razorpay/UPI/Card) within 3 to 5 business days.',
      },
    ],
  },
  {
    category: 'Manufacturer Warranties',
    icon: ShieldCheck,
    questions: [
      {
        q: 'Are products covered by official manufacturer warranties?',
        a: 'Yes, 100% of products sold on KAIA come with standard manufacturer brand warranties (typically 1 to 3 years). Your digitally generated invoice and serialized warranty certificate are accepted at all authorized service centers across India.',
      },
    ],
  },
];

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState({});

  const toggleQuestion = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenIndex((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white min-h-screen font-sans text-left select-none pb-20">
      
      {/* Hero Header with Search */}
      <section className="bg-amz-navy text-white py-14 px-4 md:px-8 border-b border-brand-gray-800">
        <Container className="max-w-4xl space-y-4 text-center">
          <span className="text-amz-orange font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-[3px] inline-block">
            KAIA Support Center
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
            How can we assist you today?
          </h1>
          
          <div className="max-w-xl mx-auto pt-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search help topics (e.g. tracking, GST invoice, return window)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-[3px] bg-white text-amz-bodyInk text-xs font-normal focus:outline-none focus:ring-2 focus:ring-amz-orange"
              />
              <Search className="w-4 h-4 text-amz-secText absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>
        </Container>
      </section>

      {/* Quick Action Navigation */}
      <Container className="max-w-5xl -mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link to="/orders" className="bg-white border border-amz-borderLight p-4 rounded-sm shadow-amzCard hover:border-amz-orange transition-all flex items-center space-x-3 group">
            <Package className="w-5 h-5 text-amz-orange shrink-0" />
            <div>
              <p className="font-bold text-xs text-amz-bodyInk group-hover:text-amz-orange">Your Orders</p>
              <p className="text-[10px] text-amz-secText">Track or cancel</p>
            </div>
          </Link>

          <Link to="/account/returns" className="bg-white border border-amz-borderLight p-4 rounded-sm shadow-amzCard hover:border-amz-orange transition-all flex items-center space-x-3 group">
            <RefreshCw className="w-5 h-5 text-amz-orange shrink-0" />
            <div>
              <p className="font-bold text-xs text-amz-bodyInk group-hover:text-amz-orange">Returns & Refunds</p>
              <p className="text-[10px] text-amz-secText">7-day replacement</p>
            </div>
          </Link>

          <Link to="/account?tab=warranties" className="bg-white border border-amz-borderLight p-4 rounded-sm shadow-amzCard hover:border-amz-orange transition-all flex items-center space-x-3 group">
            <ShieldCheck className="w-5 h-5 text-amz-orange shrink-0" />
            <div>
              <p className="font-bold text-xs text-amz-bodyInk group-hover:text-amz-orange">Warranty Center</p>
              <p className="text-[10px] text-amz-secText">Serial verification</p>
            </div>
          </Link>

          <Link to="/contact" className="bg-white border border-amz-borderLight p-4 rounded-sm shadow-amzCard hover:border-amz-orange transition-all flex items-center space-x-3 group">
            <MessageSquare className="w-5 h-5 text-amz-orange shrink-0" />
            <div>
              <p className="font-bold text-xs text-amz-bodyInk group-hover:text-amz-orange">Contact Support</p>
              <p className="text-[10px] text-amz-secText">Email or helpline</p>
            </div>
          </Link>
        </div>
      </Container>

      {/* Categorized FAQs Accordion */}
      <Container className="max-w-4xl py-12 space-y-8">
        <h2 className="text-xl font-bold text-amz-bodyInk border-b border-amz-borderLight pb-3">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          {FAQ_ITEMS.map((cat, catIdx) => {
            const Icon = cat.icon;
            return (
              <div key={catIdx} className="bg-white border border-amz-borderLight rounded-sm shadow-amzCard overflow-hidden">
                <div className="bg-amz-bgGray/40 px-5 py-3 border-b border-amz-borderLight flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 text-amz-orange" />
                  <h3 className="font-bold text-xs text-amz-bodyInk uppercase tracking-wide">
                    {cat.category}
                  </h3>
                </div>

                <div className="divide-y divide-amz-borderLight">
                  {cat.questions.map((item, qIdx) => {
                    const key = `${catIdx}-${qIdx}`;
                    const isOpen = openIndex[key];
                    return (
                      <div key={qIdx} className="text-xs">
                        <button
                          onClick={() => toggleQuestion(catIdx, qIdx)}
                          className="w-full p-4 flex justify-between items-center text-left hover:bg-amz-bgGray/20 transition-colors font-bold text-amz-bodyInk"
                        >
                          <span>{item.q}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-amz-secText shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-amz-secText shrink-0 ml-2" />}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-amz-secText leading-relaxed bg-brand-light/30">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Container>

    </div>
  );
};

export default Help;
