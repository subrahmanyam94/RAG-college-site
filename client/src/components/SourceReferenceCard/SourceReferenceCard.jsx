import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, CheckCircle, Database, Bookmark } from 'lucide-react';
import { getCategoryBadgeStyle } from '../../lib/utils';

export default function SourceReferenceCard({ source, index }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDatabase = source.type === 'database_record' || source.category?.includes('DB');

  const categoryStyle = isDatabase
    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
    : getCategoryBadgeStyle(source.category);
  const matchPct = Math.round((source.similarityScore || 0) * 100);

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-2xs ${
      isDatabase
        ? 'border-emerald-300/90 bg-white hover:border-emerald-500'
        : 'border-amber-200/90 bg-white hover:border-orange-400'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left text-xs transition-colors ${
          isDatabase ? 'text-emerald-950 hover:bg-emerald-50/40' : 'text-slate-700 hover:bg-amber-50/50'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`p-1.5 rounded-lg shrink-0 ${
            isDatabase ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100/80 text-orange-700'
          }`}>
            {isDatabase ? <Database className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>

          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-slate-900 truncate">
              {source.documentTitle || (isDatabase ? 'Student Exam Record' : 'Official College Document')}
            </span>
            <span className={`text-[11px] shrink-0 font-medium ${isDatabase ? 'text-emerald-700' : 'text-amber-900/70'}`}>
              {isDatabase ? `Sem ${source.pageNumber}` : (source.pageNumber ? `Page ${source.pageNumber}` : 'Section')}
            </span>
          </div>

          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-semibold ${categoryStyle}`}
          >
            {isDatabase ? 'Live DB Record' : (source.category || 'General')}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          <div className={`flex items-center gap-1 text-[11px] font-bold font-mono ${
            isDatabase ? 'text-emerald-600' : 'text-orange-600'
          }`}>
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{isDatabase ? '100% DB Exact' : (matchPct > 0 ? `${matchPct}% Match` : 'Verified')}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 py-3 border-t border-amber-200/70 bg-amber-50/40 text-xs text-slate-800 animate-slide-up">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200/60 text-[11px] text-amber-900/80">
            <span className="flex items-center gap-1 font-semibold">
              <Bookmark className="w-3 h-3 text-orange-600" />
              Source Excerpt
            </span>
            {source.originalName && (
              <span className="text-amber-800/70 truncate max-w-[200px] font-mono">
                {source.originalName}
              </span>
            )}
          </div>
          <p className="font-mono text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-amber-200/80 shadow-2xs">
            {source.excerpt}
          </p>
        </div>
      )}
    </div>
  );
}
