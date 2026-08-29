import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, FileText, ArrowUpDown } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axiosInstance.get('/admin/audit-logs');
        if (res.data.success) {
          setLogs(res.data.logs);
        }
      } catch (err) {
        console.error('Error fetching administrative audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-brand-gray-500">Loading audit logs directory...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-extrabold text-brand-gray-900">Administrative Audit Logs</h2>
        <p className="text-xs text-brand-gray-500">Log ledger transactions, brand approvals, listing reviews, and account adjustments.</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white border p-12 text-center text-brand-gray-500">No administrative logs recorded in database.</div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
            <thead className="bg-brand-gray-50 text-brand-gray-500 font-semibold uppercase">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Admin Operator</th>
                <th className="px-6 py-4">Action Event</th>
                <th className="px-6 py-4">Target Entity</th>
                <th className="px-6 py-4">Change Values</th>
                <th className="px-6 py-4">Metadata</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y text-brand-gray-700">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-brand-gray-50/50">
                  <td className="px-6 py-4 font-semibold">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-brand-gray-950">
                    <p>{log.user?.name}</p>
                    <p className="text-[9px] text-brand-gray-400 font-normal uppercase tracking-wider">{log.user?.role}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-brand-accent">{log.action}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-brand-gray-800">{log.entity}</span>
                    <p className="text-[10px] text-brand-gray-400 mt-0.5">{log.entityId || 'Platform-level'}</p>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="bg-brand-gray-50 p-2 border rounded font-mono text-[10px] text-brand-gray-600 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(log.changes || {})}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-brand-gray-450 leading-relaxed">
                    <p>IP: {log.metadata?.ip || 'Local Dev'}</p>
                    <p className="text-[9px] truncate max-w-[150px]">UA: {log.metadata?.userAgent}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default AuditLogs;
