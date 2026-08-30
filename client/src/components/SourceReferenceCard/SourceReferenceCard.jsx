import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, CheckCircle, ExternalLink, Bookmark } from 'lucide-react';
import { getCategoryBadgeStyle, formatSimilarity } from '../../lib/utils';

export default function SourceReferenceCard({ source, index }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryStyle = getCategoryBadgeStyle(source.category);
  const matchPct = Math.round((source.similarityScore || 0) * 100);

  return (
    <div className="rounded-xl border border-amber-200/90 bg-white transition-all duration-200 overflow-hidden hover:border-orange-400 shadow-2xs">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-xs text-slate-700 hover:bg-amber-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg bg-amber-100/80 text-orange-700 shrink-0">
            <FileText className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-slate-900 truncate">
              {source.documentTitle || 'Official College Document'}
            </span>
            <span className="text-[11px] text-amber-900/70 shrink-0 font-medium">
              {source.pageNumber ? `Page ${source.pageNumber}` : 'Section'}
            </span>
          </div>

          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-semibold ${categoryStyle}`}
          >
            {source.category || 'General'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          <div className="flex items-center gap-1 text-[11px] text-orange-600 font-bold font-mono">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{matchPct > 0 ? `${matchPct}% Match` : 'Verified'}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-amber-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-700" />
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
