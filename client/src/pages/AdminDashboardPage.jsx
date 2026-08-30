import React, { useState, useEffect } from 'react';
import { LayoutDashboard, RefreshCw, UploadCloud, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import AppShell from '../components/AppShell/AppShell';
import MetricGrid from '../components/MetricGrid/MetricGrid';
import api from '../lib/api';
import { formatDate, getCategoryBadgeStyle } from '../lib/utils';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/documents/metrics');
      setMetrics(res.data.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load metrics:', err);
      setError('Could not retrieve dashboard analytics.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <AppShell currentPath="/admin/dashboard">
      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-200/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
                <LayoutDashboard className="w-6 h-6 text-orange-600" />
                Institutional Knowledge Metrics
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold font-mono">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-amber-900/70 mt-1 font-medium">
              Live telemetry on indexed documents, vector chunks, processing queues, and knowledge distribution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMetrics}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-slate-700 transition-colors shadow-2xs"
              title="Refresh metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
            </button>

            <button
              onClick={() => (window.location.hash = '/admin/documents')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Manage Documents</span>
            </button>
          </div>
        </div>

        {error ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs shadow-2xs">
            {error}
          </div>
        ) : isLoading && !metrics ? (
          <div className="flex flex-col items-center justify-center py-20 text-amber-900 text-xs gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-600" />
            <span>Aggregating institutional vector statistics...</span>
          </div>
        ) : (
          <>
            {/* Metric Cards & Category Breakdown */}
            <MetricGrid metrics={metrics} />

            {/* Recent Uploads Table Preview */}
            <div className="bg-white border border-amber-200/90 rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recently Indexed Documents</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Latest institutional circulars parsed into vector storage
                  </p>
                </div>

                <button
                  onClick={() => (window.location.hash = '/admin/documents')}
                  className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                >
                  <span>View All Documents</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="text-[11px] uppercase tracking-wider text-amber-900/70 bg-amber-50/60 border-b border-amber-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">Document Title</th>
                      <th className="py-3 px-4 font-bold">Category</th>
                      <th className="py-3 px-4 font-bold">Chunks</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {metrics?.recentDocs?.length > 0 ? (
                      metrics.recentDocs.map((doc) => (
                        <tr key={doc._id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-600 shrink-0" />
                            <span className="truncate max-w-xs">{doc.title}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getCategoryBadgeStyle(
                                doc.category
                              )}`}
                            >
                              {doc.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium">{doc.chunkCount}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-medium">{formatDate(doc.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No documents uploaded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
