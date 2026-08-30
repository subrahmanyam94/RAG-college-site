import React, { useState, useEffect } from 'react';
import {
  Files,
  Trash2,
  RotateCw,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import AppShell from '../components/AppShell/AppShell';
import DocumentUploadPanel from '../components/DocumentUploadPanel/DocumentUploadPanel';
import api from '../lib/api';
import { formatDate, formatBytes, getCategoryBadgeStyle } from '../lib/utils';

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/documents', { params });
      setDocuments(res.data.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Could not retrieve documents list.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleReindex = async (id, title) => {
    if (!window.confirm(`Re-index and update vector embeddings for "${title}"?`)) return;
    setActionLoadingId(id);
    try {
      await api.put(`/documents/${id}/reindex`);
      await fetchDocuments();
      setActionLoadingId(null);
    } catch (err) {
      alert(`Re-index failed: ${err.response?.data?.error || err.message}`);
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${title}" and all its vector embeddings?`
      )
    )
      return;
    setActionLoadingId(id);
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      setActionLoadingId(null);
    } catch (err) {
      alert(`Deletion failed: ${err.response?.data?.error || err.message}`);
      setActionLoadingId(null);
    }
  };

  const handleViewDetail = (id) => {
    window.location.hash = `/admin/documents/${id}`;
  };

  return (
    <AppShell currentPath="/admin/documents">
      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-200/80">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <Files className="w-6 h-6 text-orange-600" />
              Institutional Knowledge Documents
            </h1>
            <p className="text-xs text-amber-900/70 mt-1 font-medium">
              Upload, inspect chunks, re-index vectors, and manage college circulars.
            </p>
          </div>
        </div>

        {/* Upload Panel */}
        <DocumentUploadPanel onUploadSuccess={() => fetchDocuments()} />

        {/* Search & Filter Bar */}
        <div className="bg-white border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-700/60" />
            <input
              type="text"
              placeholder="Search document title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-amber-50/40 border border-amber-300 rounded-xl text-xs text-slate-900 placeholder-amber-800/40 focus:outline-none focus:border-orange-500 shadow-2xs"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-amber-700" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold text-amber-950 focus:outline-none focus:border-orange-500 w-full sm:w-auto shadow-2xs"
            >
              {[
                'All',
                'Admissions',
                'Departments',
                'Courses',
                'Fees',
                'Exams',
                'Academic Calendar',
                'Hostel',
                'Library',
                'Clubs',
                'Placements',
                'Scholarships',
                'Policies',
                'Events',
                'General',
              ].map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white border border-amber-200/90 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="text-[11px] uppercase tracking-wider text-amber-900/70 bg-amber-50/60 border-b border-amber-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Title & Original File</th>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-4 font-bold">Department</th>
                  <th className="py-3.5 px-4 font-bold">Chunks</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Uploaded</th>
                  <th className="py-3.5 px-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading documents repository...
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No documents found matching the filter.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => {
                    const isBusy = actionLoadingId === doc._id;
                    return (
                      <tr key={doc._id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 max-w-xs truncate">
                            {doc.title}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs font-medium">
                            {doc.originalName} ({formatBytes(doc.fileSize)})
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getCategoryBadgeStyle(
                              doc.category
                            )}`}
                          >
                            {doc.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-medium">{doc.department || 'All'}</td>

                        <td className="py-3.5 px-4 font-mono font-medium">{doc.chunkCount} chunks</td>

                        <td className="py-3.5 px-4">
                          {doc.status === 'indexed' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Indexed
                            </span>
                          ) : doc.status === 'processing' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
                              Processing
                            </span>
                          ) : doc.status === 'failed' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertCircle className="w-3 h-3" />
                              Failed
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">{doc.status}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {formatDate(doc.createdAt)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect Chunk Details */}
                            <button
                              onClick={() => handleViewDetail(doc._id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-amber-100/70 transition-colors"
                              title="Inspect Extracted Chunks"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Reindex */}
                            <button
                              onClick={() => handleReindex(doc._id, doc.title)}
                              disabled={isBusy}
                              className="p-1.5 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-40"
                              title="Re-chunk and Re-embed"
                            >
                              <RotateCw
                                className={`w-4 h-4 ${isBusy ? 'animate-spin' : ''}`}
                              />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(doc._id, doc.title)}
                              disabled={isBusy}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                              title="Delete Document and Chunks"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
