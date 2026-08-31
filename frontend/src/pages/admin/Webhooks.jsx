import React, { useState, useEffect } from 'react';
import { 
  Radio, RefreshCw, CheckCircle2, AlertTriangle, 
  Clock, Filter, Search, ChevronLeft, ChevronRight, X 
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const AdminWebhooks = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [provider, setProvider] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await brandSellerService.getAdminWebhooks({ provider, page, limit: 20 });
      if (res.success) {
        setWebhooks(res.webhooks || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching webhooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [provider, page]);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Carrier & Gateway Webhooks Monitor
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Real-time webhook ingestion log, event idempotency verifications, and delivery payloads.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchWebhooks} className="text-xs uppercase font-bold flex items-center space-x-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feeds</span>
        </Button>
      </div>

      {/* 2. Provider Filters */}
      <div className="flex space-x-2 border-b border-brand-gray-200">
        {[
          { key: 'all', label: 'All Providers' },
          { key: 'shiprocket', label: 'Shiprocket' },
          { key: 'razorpay', label: 'Razorpay' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setProvider(tab.key); setPage(1); }}
            className={`py-2 px-3.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              provider === tab.key
                ? 'border-brand-accent text-brand-accent font-black'
                : 'border-transparent text-brand-gray-500 hover:text-brand-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Webhooks Table */}
      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <Radio className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No webhook events recorded</h3>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Provider</th>
                  <th className="px-4 py-3.5">Event Type</th>
                  <th className="px-4 py-3.5">Provider Event ID</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Received At</th>
                  <th className="px-4 py-3.5 text-right">Payload</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {webhooks.map((w) => (
                  <tr key={w._id} className="hover:bg-brand-gray-50/70 font-medium">
                    <td className="px-4 py-3.5 font-bold uppercase text-[10px] text-brand-dark">
                      {w.provider}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-brand-gray-900">
                      {w.eventType || 'tracking_update'}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-brand-accent">
                      {w.providerEventId || 'N/A'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        w.processed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {w.processed ? 'Processed' : 'Pending'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-brand-gray-500">
                      {new Date(w.createdAt).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEvent(w)}
                        className="text-[10px] uppercase font-bold py-0.5 px-2"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-brand-gray-200 bg-brand-light flex justify-between items-center text-xs text-brand-gray-600 font-semibold">
            <span>Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} events</span>
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

      {/* 4. Payload Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-premium max-w-2xl w-full p-6 space-y-4 border border-brand-gray-200">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <h3 className="font-black text-sm text-brand-gray-900 uppercase">Webhook Event Inspector</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-brand-gray-400 hover:text-brand-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-brand-light p-3 rounded border font-mono">
                <div>Provider: <strong>{selectedEvent.provider}</strong></div>
                <div>Event ID: <strong>{selectedEvent.providerEventId}</strong></div>
                <div>Processed: <strong>{selectedEvent.processed ? 'Yes' : 'No'}</strong></div>
                <div>Received: <strong>{new Date(selectedEvent.createdAt).toLocaleString('en-IN')}</strong></div>
              </div>

              <div>
                <span className="font-bold uppercase text-[10px] text-brand-gray-400 block mb-1">Raw Received Payload</span>
                <pre className="p-3 bg-brand-dark text-emerald-400 rounded font-mono text-[11px] overflow-auto max-h-60">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-brand-gray-200">
              <Button size="sm" onClick={() => setSelectedEvent(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminWebhooks;
