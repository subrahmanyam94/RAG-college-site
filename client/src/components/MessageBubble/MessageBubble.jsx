import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Sparkles, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import SourceReferenceCard from '../SourceReferenceCard/SourceReferenceCard';

export default function MessageBubble({ message }) {
  const isUser = message.sender === 'user';
  const isFound = message.foundAnswer !== false;
  const sources = message.sources || [];

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3 max-w-3xl ml-auto animate-fade-in">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white px-5 py-3 rounded-2xl rounded-tr-xs shadow-md text-sm leading-relaxed max-w-[85%] font-medium">
          <p className="whitespace-pre-wrap">{message.message}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-orange-700 shrink-0 shadow-2xs">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3.5 max-w-3xl mr-auto animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center text-white shadow-md shrink-0 border border-white">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex-1 space-y-3 min-w-0">
        {/* Main Response Box */}
        <div
          className={`p-5 rounded-2xl rounded-tl-xs text-sm border shadow-sm ${
            isFound
              ? 'bg-white border-amber-200/90 text-slate-800'
              : 'bg-amber-50/90 border-orange-300 text-orange-950'
          }`}
        >
          {!isFound && (
            <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 shrink-0 text-orange-600" />
              <span>No Grounded Information Found in Documents</span>
            </div>
          )}

          <div className="markdown-content max-w-none text-slate-800">
            <ReactMarkdown>{message.message}</ReactMarkdown>
          </div>

          {/* Latency & Grounding Badge */}
          <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-900/80 font-mono">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              <span>
                {isFound
                  ? 'Grounded in Institutional Knowledge'
                  : 'Zero Hallucination Filter Triggered'}
              </span>
            </div>
            {message.latencyMs > 0 && (
              <div className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>{message.latencyMs}ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Source References list */}
        {isFound && sources.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase tracking-wider px-1">
              <span>Verified Sources ({sources.length})</span>
            </div>
            <div className="grid gap-2">
              {sources.map((src, idx) => (
                <SourceReferenceCard key={src.chunkId || idx} source={src} index={idx} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
