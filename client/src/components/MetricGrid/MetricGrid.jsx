import React from 'react';
import { Files, Database, CheckCircle2, Clock, AlertCircle, Layers } from 'lucide-react';
import { getCategoryBadgeStyle } from '../../lib/utils';

export default function MetricGrid({ metrics }) {
  if (!metrics) return null;

  const {
    totalDocs = 0,
    indexedDocs = 0,
    processingDocs = 0,
    failedDocs = 0,
    totalChunks = 0,
    categoriesBreakdown = [],
  } = metrics;

  const statCards = [
    {
      title: 'Total Documents',
      value: totalDocs,
      subtitle: 'Uploaded campus files',
      icon: Files,
      iconBg: 'bg-amber-100 text-amber-800 border-amber-200',
      borderColor: 'border-amber-200',
    },
    {
      title: 'Indexed & Ready',
      value: indexedDocs,
      subtitle: `${totalDocs > 0 ? Math.round((indexedDocs / totalDocs) * 100) : 100}% Active in Vector DB`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      borderColor: 'border-emerald-200',
    },
    {
      title: 'Total Vector Chunks',
      value: totalChunks,
      subtitle: 'Semantic chunks in MongoDB',
      icon: Database,
      iconBg: 'bg-orange-100 text-orange-800 border-orange-200',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Processing Queue',
      value: processingDocs + failedDocs,
      subtitle: failedDocs > 0 ? `${failedDocs} failed indexations` : 'All indexes synchronized',
      icon: failedDocs > 0 ? AlertCircle : Clock,
      iconBg: failedDocs > 0 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200',
      borderColor: failedDocs > 0 ? 'border-red-200' : 'border-yellow-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-white border ${card.borderColor} shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-950/70 uppercase tracking-wider">
                    {card.title}
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                    {card.value}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">{card.subtitle}</p>
                </div>

                <div className={`p-3 rounded-xl border ${card.iconBg} shadow-2xs`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Distribution Bar */}
      {categoriesBreakdown.length > 0 && (
        <div className="bg-white border border-amber-200/90 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-600" />
              Document Distribution by Knowledge Category
            </h4>
            <span className="text-xs text-amber-900 font-mono font-medium">
              {categoriesBreakdown.length} Active Categories
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categoriesBreakdown.map((item) => (
              <div
                key={item._id}
                className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between"
              >
                <div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getCategoryBadgeStyle(
                      item._id
                    )}`}
                  >
                    {item._id || 'General'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-medium">{item.chunks} chunks</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {item.count}
                  </span>
                  <p className="text-[10px] text-slate-500">docs</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
