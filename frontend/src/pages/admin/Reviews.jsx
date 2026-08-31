import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Star, Search, Filter, 
  CheckCircle, EyeOff, Eye, ChevronLeft, ChevronRight, AlertCircle 
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState('all');
  const [page, setPage] = useState(1);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await brandSellerService.getAdminReviews({ rating, page, limit: 20 });
      if (res.success) {
        setReviews(res.reviews || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [rating, page]);

  const toggleReviewVisibility = async (review) => {
    try {
      await brandSellerService.moderateReview(review._id, {
        isHidden: !review.isHidden,
        moderationNote: review.isHidden ? 'Restored by admin' : 'Flagged content / hidden by admin',
      });
      fetchReviews();
    } catch (err) {
      alert('Error updating review moderation state.');
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Customer Reviews & Product Feedback Moderation
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Audit customer product ratings, verified purchase feedback, and content moderation.
          </p>
        </div>
      </div>

      {/* 2. Rating Filters */}
      <div className="flex space-x-2 border-b border-brand-gray-200">
        {[
          { key: 'all', label: 'All Ratings' },
          { key: '5', label: '5 Stars' },
          { key: '4', label: '4 Stars' },
          { key: '3', label: '3 Stars' },
          { key: '2', label: '2 Stars' },
          { key: '1', label: '1 Star' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setRating(tab.key); setPage(1); }}
            className={`py-2 px-3.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              rating === tab.key
                ? 'border-brand-accent text-brand-accent font-black'
                : 'border-transparent text-brand-gray-500 hover:text-brand-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Reviews Table */}
      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <MessageSquare className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No customer reviews found</h3>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Rating</th>
                  <th className="px-4 py-3.5">Review / Feedback</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Moderation</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {reviews.map((r) => (
                  <tr key={r._id} className="hover:bg-brand-gray-50/70 font-medium">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-brand-gray-900 truncate max-w-[200px]">{r.product?.name || 'Product'}</p>
                      <span className="text-[10px] text-brand-gray-400 font-mono">SKU: {r.product?.SKU || 'N/A'}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-brand-gray-900">{r.user?.name || 'Customer'}</p>
                      <span className="text-[10px] text-brand-gray-500">{r.user?.email}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1 text-amber-500 font-black text-xs">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{r.rating}/5</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 max-w-sm">
                      {r.title && <p className="font-bold text-brand-gray-900 mb-0.5">{r.title}</p>}
                      <p className="text-brand-gray-600 line-clamp-2 text-xs">{r.comment || r.review}</p>
                      {r.moderationNote && (
                        <span className="text-[9px] text-red-600 font-mono block mt-1">Note: {r.moderationNote}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        !r.isHidden ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {!r.isHidden ? 'Published' : 'Hidden'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleReviewVisibility(r)}
                        className="text-[10px] uppercase font-bold py-1 px-2.5 flex items-center space-x-1 ml-auto"
                      >
                        {r.isHidden ? <Eye className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3 text-red-600" />}
                        <span>{r.isHidden ? 'Restore' : 'Hide'}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-brand-gray-200 bg-brand-light flex justify-between items-center text-xs text-brand-gray-600 font-semibold">
            <span>Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} reviews</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-xs uppercase px-2 py-1">
                <ChevronLeft className="w-4 h-4 mr-0.5" /> Prev
              </Button>
              <span className="px-3 py-1 font-black text-brand-gray-900 bg-white border rounded">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="text-xs uppercase px-2 py-1">
                Next <ChevronRight className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminReviews;
