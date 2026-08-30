import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Search,
  BookOpen,
  ArrowRight,
  Database,
  GraduationCap,
  Layers,
  FileCheck2,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();

  const navigate = (path) => {
    window.location.hash = path;
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-slate-800 selection:bg-orange-500 selection:text-white flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-amber-200/70 bg-white/90 backdrop-blur-md px-6 sm:px-12 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">CampusRAG</span>
            <p className="text-[10px] text-amber-900/70">Institutional AI Knowledge Base</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/chat')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-semibold shadow-md shadow-orange-500/25 flex items-center gap-2 transition-all"
            >
              <span>Go to {user?.role === 'admin' ? 'Admin Dashboard' : 'Student Chat'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-amber-50 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-semibold shadow-md shadow-orange-500/25 transition-all"
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24 max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold mb-8 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-orange-600" />
          <span>Zero Hallucination Guaranteed • Verifiable Citations</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
          Instant, Grounded Answers for{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600">
            College Life
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed">
          CampusRAG utilizes Retrieval-Augmented Generation to search verified institutional handbooks, circulars, fee schedules, and academic calendars. Every response cites exact sources and page references.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button
            onClick={() => navigate(isAuthenticated ? '/chat' : '/login')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-sm shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2.5 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Campus Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-amber-300 hover:border-orange-500 bg-white hover:bg-amber-50 text-slate-800 font-semibold text-sm transition-all shadow-xs"
          >
            Admin Document Console
          </button>
        </div>

        {/* Coverage Badges */}
        <div className="w-full border-t border-amber-200/80 pt-10">
          <p className="text-xs text-amber-900/80 uppercase tracking-wider font-bold mb-4">
            Comprehensive Institutional Coverage
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              'Admissions',
              'Fee Structure',
              'Exams & Grading',
              'Hostel & Curfews',
              'Placements & Internships',
              'Scholarships',
              'Academic Calendar',
              'Clubs & Events',
              'Disciplinary Policies',
            ].map((tag, idx) => (
              <span
                key={idx}
                className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white border border-amber-200 text-amber-950 shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* RAG Pipeline Explanation Section */}
      <section className="bg-white border-t border-amber-200/70 py-16 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How Campus Retrieval-Augmented Generation Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Unlike generic chatbots that guess, CampusRAG strictly searches verified documents first.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-amber-200/80 relative space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-orange-700 flex items-center justify-center shadow-2xs">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">1. Admin Document Ingestion</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Official notices and PDFs are parsed, cleaned, and split into recursive semantic chunks with page numbering and category tags.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-amber-200/80 relative space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-300 text-orange-700 flex items-center justify-center shadow-2xs">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">2. Vector Similarity Search</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When a student asks a question, it is embedded and compared against stored vector chunks to retrieve the top-K relevant excerpts above threshold.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-amber-200/80 relative space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 border border-yellow-300 text-amber-800 flex items-center justify-center shadow-2xs">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">3. Grounded Synthesis & Citations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The LLM synthesizes an answer using strictly retrieved institutional context. If no chunk clears relevance, it deterministically declines to guess.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-200/80 py-8 px-6 text-center text-xs text-amber-900/60 font-medium">
        CampusRAG • Institutional AI College Information Assistant • Engineered with Zero-Hallucination RAG
      </footer>
    </div>
  );
}
