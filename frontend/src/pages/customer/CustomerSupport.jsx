import React, { useState } from 'react';
import { 
  Headphones, MessageSquare, Mail, Phone, Clock, 
  HelpCircle, ShieldCheck, ChevronDown, CheckCircle2, 
  Send, AlertCircle, Sparkles, FileText, ArrowRight 
} from 'lucide-react';
import Container from '../../components/ui/Container';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { KAIA_OFFICE_LOCATION } from '../../constants/companyInfo';

const FAQS = [
  {
    category: 'Orders',
    q: 'How do I track my hardware shipment in real time?',
    a: 'Once your order is processed and dispatched by the brand fulfillment node, you can track it via "Your Account > Orders" or the dedicated Order Tracking page with your Master Tracking Number.',
  },
  {
    category: 'Warranty',
    q: 'How does serial number warranty verification work on KAIA?',
    a: 'Every serialized component purchased on KAIA is registered in our OEM database at dispatch. You can enter your hardware serial number in our Warranty Verification tool to inspect coverage dates and status.',
  },
  {
    category: 'Payments',
    q: 'Can I receive a business GST invoice for input tax credit?',
    a: 'Yes. During checkout, provide your 15-digit GSTIN and company trade name. Computer-generated tax invoices with compliant HSN codes and breakdown of CGST/SGST/IGST are available immediately upon dispatch.',
  },
  {
    category: 'Returns',
    q: 'What is the return and replacement window for defective hardware?',
    a: 'KAIA provides a 7-day direct replacement window for items received in physically damaged, dead-on-arrival (DOA), or materially defective conditions verified via serial number inspection.',
  },
  {
    category: 'Delivery',
    q: 'What locations are covered under insured express delivery?',
    a: 'We deliver to over 27,000 postal PIN codes across India through Tier-1 insured courier partners (BlueDart, Delhivery, DTDC, XpressBees).',
  },
];

const CustomerSupport = () => {
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const [ticketForm, setTicketForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'General',
    orderId: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [ticketResult, setTicketResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/support/tickets', ticketForm);
      setTicketResult(res.data?.ticket || { ticketId: 'TKT-PROCESSED' });
      toast?.success?.('Support ticket registered successfully!');
    } catch (err) {
      console.error('[Ticket Error]:', err);
      const msg = err.response?.data?.message || 'Failed to submit support ticket.';
      setErrorMsg(msg);
      toast?.error?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaqs = selectedCategory === 'ALL'
    ? FAQS
    : FAQS.filter(f => f.category === selectedCategory);

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-left select-none pb-24 text-slate-800">
      
      {/* 1. HERO HEADER */}
      <section className="bg-slate-950 text-white py-16 px-4 md:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <Container className="max-w-6xl relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <Headphones className="w-3.5 h-3.5" />
            <span>Customer Care & Resolution Desk</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            How can we assist you today?
          </h1>

          <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
            Get rapid resolution for order inquiries, warranty claims, GST billing, return requests, and technical hardware specifications.
          </p>
        </Container>
      </section>

      {/* 2. DIRECT CHANNELS STRIP */}
      <Container className="max-w-6xl -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold uppercase">Direct Support Email</div>
              <a href={`mailto:${KAIA_OFFICE_LOCATION.supportEmail}`} className="text-xs font-black text-slate-900 hover:text-amber-600 hover:underline">
                {KAIA_OFFICE_LOCATION.supportEmail}
              </a>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold uppercase">Customer Helpline</div>
              <div className="text-xs font-black text-slate-900 font-mono">
                {KAIA_OFFICE_LOCATION.supportPhone}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold uppercase">Operating Hours</div>
              <div className="text-xs font-black text-slate-900">
                Mon – Sat: 9:00 AM – 7:00 PM IST
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* 3. SUPPORT TICKET FORM & FAQ ACCORDION */}
      <Container className="max-w-6xl py-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Raise Support Ticket Form */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <span>Create Support Ticket</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill out the ticket form below. A ticket ID will be generated for status tracking.
              </p>
            </div>

            {ticketResult ? (
              <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-black text-emerald-950">Ticket Registered!</h3>
                <div className="bg-white px-4 py-2 rounded-xl inline-block border border-emerald-200 text-xs font-mono font-black text-emerald-900">
                  Ticket ID: {ticketResult.ticketId}
                </div>
                <p className="text-xs text-emerald-800 max-w-sm mx-auto leading-relaxed">
                  Our customer care specialist has received your inquiry and will respond to <strong>{ticketResult.email}</strong> within 1 business day.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setTicketResult(null);
                      setTicketForm({
                        name: '',
                        email: '',
                        subject: '',
                        category: 'General',
                        orderId: '',
                        message: '',
                      });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors"
                  >
                    Open Another Ticket
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs font-semibold text-slate-800">
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700">Inquiry Category *</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                    >
                      <option value="General">General Inquiries</option>
                      <option value="Orders">Order Tracking & Fulfillment</option>
                      <option value="Payments">Payments & GST Invoices</option>
                      <option value="Delivery">Shipping & Logistics</option>
                      <option value="Returns">Returns & RMA Claims</option>
                      <option value="Warranty">Serial Warranty Claims</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700">Order ID / Serial Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. KAIA-ORD-2026-00101"
                      value={ticketForm.orderId}
                      onChange={(e) => setTicketForm({ ...ticketForm, orderId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of your inquiry"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700">Message / Issue Details *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your inquiry or hardware issue in detail..."
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs py-3 rounded-xl shadow-md shadow-amber-500/20 hover:scale-[1.01] transition-all flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting Ticket...' : 'Submit Support Ticket'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right: Knowledge Base & FAQs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-base">Frequently Asked Questions</h3>
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'Orders', 'Warranty', 'Payments', 'Returns', 'Delivery'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Accordion list */}
              <div className="space-y-2.5 pt-2">
                {filteredFaqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full text-left p-4 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-900"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          expandedFaq === idx ? 'rotate-180 text-amber-600' : ''
                        }`}
                      />
                    </button>
                    {expandedFaq === idx && (
                      <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-black uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Self-Service Portals</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Need immediate status check? Access automated verification tools:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <a href="/warranty-verification" className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center justify-between">
                  <span>Verify Warranty</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </a>
                <a href="/shipping-rates" className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center justify-between">
                  <span>Shipping Rates</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </Container>

    </div>
  );
};

export default CustomerSupport;
