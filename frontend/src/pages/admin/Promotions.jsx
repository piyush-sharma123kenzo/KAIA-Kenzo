import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Search, Filter, Image, 
  ExternalLink, Layers, Check, X, AlertCircle 
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    placement: 'hero_banner',
    subtitle: '',
    bannerUrl: '',
    targetUrl: '',
    ctaText: 'Shop Now',
    displayOrder: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await brandSellerService.getAdminPromotions();
      if (res.success) {
        setPromotions(res.promotions || []);
      }
    } catch (err) {
      console.error('Error fetching promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await brandSellerService.createAdminPromotion(formData);
      if (res.success) {
        setShowModal(false);
        fetchPromotions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating promotion slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (promo) => {
    try {
      await brandSellerService.updateAdminPromotion(promo._id, { isActive: !promo.isActive });
      fetchPromotions();
    } catch (err) {
      alert('Error updating promotion status.');
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Homepage & Promotional Slot Manager
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Dynamically configure Hero Banners, Deals of the Day, and Category Highlights directly from MongoDB.
          </p>
        </div>

        <Button onClick={() => setShowModal(true)} size="sm" className="text-xs uppercase font-bold flex items-center space-x-1.5">
          <Plus className="w-4 h-4" />
          <span>New Promotion Slot</span>
        </Button>
      </div>

      {/* 2. Promotions Grid */}
      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <Sparkles className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No dynamic promotion slots configured</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((p) => (
            <div key={p._id} className="bg-white border border-brand-gray-200 rounded-sm shadow-premium p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-brand-light text-brand-accent border rounded">
                    {p.placement?.replace('_', ' ')}
                  </span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    p.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-brand-gray-100 text-brand-gray-500'
                  }`}>
                    {p.isActive ? 'Active' : 'Draft'}
                  </span>
                </div>

                <h4 className="font-black text-sm text-brand-gray-900 mt-2 uppercase">{p.title}</h4>
                {p.subtitle && <p className="text-xs text-brand-gray-500 mt-0.5">{p.subtitle}</p>}
                
                {p.bannerUrl && (
                  <div className="mt-3 h-24 bg-brand-light border rounded overflow-hidden flex items-center justify-center">
                    <img src={p.bannerUrl} alt="" className="object-cover w-full h-full" />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-brand-gray-100 flex justify-between items-center text-xs">
                <span className="text-[10px] text-brand-gray-400 font-mono">Order: {p.displayOrder}</span>
                <Button variant="outline" size="sm" onClick={() => toggleStatus(p)} className="text-[10px] uppercase font-bold py-0.5 px-2">
                  {p.isActive ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-premium max-w-md w-full p-6 space-y-4 border border-brand-gray-200">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <h3 className="font-black text-sm text-brand-gray-900 uppercase">New Homepage Slot</h3>
              <button onClick={() => setShowModal(false)} className="text-brand-gray-400 hover:text-brand-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Slot Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ultra-Fast RTX 4090 Series Launch"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-brand-gray-200 rounded font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Placement Target</label>
                <select
                  value={formData.placement}
                  onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                  className="w-full p-2 border border-brand-gray-200 rounded font-bold"
                >
                  <option value="hero_banner">Hero Showcase Banner</option>
                  <option value="deals_of_the_day">Deals of the Day</option>
                  <option value="featured_brands">Featured Brand Partners</option>
                  <option value="featured_categories">Top Categories Grid</option>
                  <option value="announcement_bar">Top Announcement Bar</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Banner Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.bannerUrl}
                  onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                  className="w-full p-2 border border-brand-gray-200 rounded"
                />
              </div>

              <div>
                <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Destination Target Link</label>
                <input
                  type="text"
                  placeholder="/products?category=laptops"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  className="w-full p-2 border border-brand-gray-200 rounded font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-brand-gray-200">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button size="sm" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Promotion'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPromotions;
