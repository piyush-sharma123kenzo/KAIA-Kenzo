import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Building2, Clock, CheckCircle2 } from 'lucide-react';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="bg-white min-h-screen font-sans text-left select-none pb-20">
      
      {/* Hero Header */}
      <section className="bg-amz-navy text-white py-14 px-4 md:px-8 border-b border-brand-gray-800">
        <Container className="max-w-5xl space-y-3">
          <span className="text-amz-orange font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-[3px] inline-block">
            Customer Relations
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
            Contact KAIA Technologies
          </h1>
          <p className="text-xs md:text-sm text-brand-gray-300 max-w-2xl font-normal leading-relaxed">
            Have questions about an order, serial registration, corporate GST billing, or manufacturer warranty? Our dedicated support team is available 6 days a week.
          </p>
        </Container>
      </section>

      <Container className="max-w-5xl py-12 space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Info Cards */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-amz-bgGray/40 border border-amz-borderLight p-6 rounded-sm space-y-4 shadow-amzCard text-xs">
              <h3 className="font-bold text-sm text-amz-bodyInk uppercase tracking-wide border-b border-amz-borderLight pb-2">
                Corporate Office
              </h3>
              
              <div className="flex items-start space-x-3 text-amz-secText">
                <MapPin className="w-4 h-4 text-amz-orange shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amz-bodyInk">KAIA Technologies Pvt. Ltd.</p>
                  <p>100 Silicon Avenue, Electronic City Phase 1</p>
                  <p>Bengaluru, Karnataka 560100, India</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-amz-secText">
                <Mail className="w-4 h-4 text-amz-orange shrink-0" />
                <div>
                  <p className="font-bold text-amz-bodyInk">Email Support</p>
                  <a href="mailto:support@kaia.tech" className="text-amz-linkBlue hover:underline">support@kaia.tech</a>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-amz-secText">
                <Phone className="w-4 h-4 text-amz-orange shrink-0" />
                <div>
                  <p className="font-bold text-amz-bodyInk">Helpline (Toll-Free)</p>
                  <p className="font-mono text-amz-bodyInk">1800-202-KAIA (9 AM – 7 PM IST)</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-amz-secText">
                <Clock className="w-4 h-4 text-amz-orange shrink-0" />
                <div>
                  <p className="font-bold text-amz-bodyInk">Support Hours</p>
                  <p>Monday through Saturday</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-sm text-xs text-blue-900 space-y-1">
              <span className="font-bold block">Brand Seller Inquiries</span>
              <p className="text-[11px] leading-relaxed">
                Looking to onboard your brand onto KAIA? Visit our <a href="/brand/register" className="font-bold underline">Brand Partner Hub</a> to register your manufacturer credentials.
              </p>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="md:col-span-7 bg-white border border-amz-borderLight p-6 sm:p-8 rounded-sm shadow-amzCard space-y-6">
            <h2 className="text-lg font-bold text-amz-bodyInk border-b border-amz-borderLight pb-3">
              Send us an Inquiry
            </h2>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-emerald-900">Message Received!</h3>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  Thank you for reaching out. A KAIA customer care specialist will respond within 24 business hours.
                </p>
                <Button size="sm" onClick={() => setSubmitted(false)} className="mt-2 text-xs uppercase font-bold">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-amz-bodyInk">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-amz-secText">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-amz-borderGray rounded-[2px] bg-white focus:outline-none focus:border-amz-orange text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-amz-secText">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 border border-amz-borderGray rounded-[2px] bg-white focus:outline-none focus:border-amz-orange text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-amz-secText">Subject / Order ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Order #KAIA-ORD-2026-00101 Inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full p-2.5 border border-amz-borderGray rounded-[2px] bg-white focus:outline-none focus:border-amz-orange text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-amz-secText">Your Message *</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Describe your inquiry in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-2.5 border border-amz-borderGray rounded-[2px] bg-white focus:outline-none focus:border-amz-orange text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="amz-btn-yellow font-bold text-xs px-6 py-2.5 flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Message</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </Container>
    </div>
  );
};

export default Contact;
