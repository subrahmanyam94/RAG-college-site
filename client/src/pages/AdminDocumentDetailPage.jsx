import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Layers, Hash, Calendar, Shield, Database, Bookmark } from 'lucide-react';
import AppShell from '../components/AppShell/AppShell';
import api from '../lib/api';
import { formatDate, formatBytes, getCategoryBadgeStyle } from '../lib/utils';

export default function AdminDocumentDetailPage({ documentId }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(`/documents/${documentId}`);
        setData(res.data.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load document detail:', err);
        setError('Could not retrieve document details.');
        setIsLoading(false);
      }
    };

    if (documentId) {
      fetchDetail();
    }
  }, [documentId]);

  return (
    <AppShell currentPath="/admin/documents">
      <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in">
        {/* Back Link */}
        <button
          onClick={() => (window.location.hash = '/admin/documents')}
          className="inline-flex items-center gap-2 text-xs font-bold text-amber-900/80 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Documents Repository</span>
        </button>

        {error ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs shadow-2xs">
            {error}
          </div>
        ) : isLoading || !data ? (
          <div className="text-center py-20 text-xs text-amber-900/60 font-medium">
            Loading document chunks and metadata...
          </div>
        ) : (
          <>
            {/* Header Document Summary */}
            <div className="bg-white border border-amber-200/90 rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${getCategoryBadgeStyle(
                        data.document.category
                      )}`}
                    >
                      {data.document.category}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Department: {data.document.department || 'General'}
                    </span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900">{data.document.title}</h1>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Original File: {data.document.originalName} ({formatBytes(data.document.fileSize)})
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px] font-medium">Processing Status</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mt-0.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {data.document.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Metadata Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-amber-100 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70">
                  <span className="text-amber-900/70 text-[10px] uppercase font-mono font-bold block">
                    Chunks Generated
                  </span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {data.chunks?.length || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70">
                  <span className="text-amber-900/70 text-[10px] uppercase font-mono font-bold block">
                    Vector Status
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    Synchronized in DB
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70">
                  <span className="text-amber-900/70 text-[10px] uppercase font-mono font-bold block">
                    Uploaded On
                  </span>
                  <span className="text-xs text-slate-700 font-mono font-medium">
                    {formatDate(data.document.createdAt)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70">
                  <span className="text-amber-900/70 text-[10px] uppercase font-mono font-bold block">
                    Last Indexed
                  </span>
                  <span className="text-xs text-slate-700 font-mono font-medium">
                    {formatDate(data.document.lastIndexedAt || data.document.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Chunks Preview List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-600" />
                  Extracted Text Chunks & Embeddings ({data.chunks?.length || 0})
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Recursive chunking with 120-char sliding overlap
                </span>
              </div>

              <div className="space-y-3">
                {data.chunks?.map((chunk) => (
                  <div
                    key={chunk._id}
                    className="p-5 rounded-2xl bg-white border border-amber-200/90 space-y-3 hover:border-orange-400 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-amber-100">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-950 font-mono font-bold border border-amber-300">
                          Chunk #{chunk.chunkIndex + 1}
                        </span>
                        <span className="text-slate-600 font-medium">
                          Page {chunk.pageNumber || 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                        <span>~{chunk.tokenCount} tokens</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          768-dim Vector Stored
                        </span>
                      </div>
                    </div>

                    <p className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/60">
                      {chunk.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
