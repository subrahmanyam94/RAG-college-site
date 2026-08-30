import React, { useState } from 'react';
import { Sparkles, Mail, Lock, LogIn, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (res.success) {
      if (res.user.role === 'admin') {
        window.location.hash = '/admin/dashboard';
      } else {
        window.location.hash = '/chat';
      }
    }
  };

  const handleDemoStudent = async () => {
    setEmail('student@campus.edu');
    setPassword('StudentPassword123!');
    const res = await login('student@campus.edu', 'StudentPassword123!');
    if (res.success) {
      window.location.hash = '/chat';
    }
  };

  const handleDemoAdmin = async () => {
    setEmail('admin@campus.edu');
    setPassword('AdminPassword123!');
    const res = await login('admin@campus.edu', 'AdminPassword123!');
    if (res.success) {
      window.location.hash = '/admin/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col justify-center items-center px-4 py-12 selection:bg-orange-500 selection:text-white">
      {/* Brand logo */}
      <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => (window.location.hash = '/')}>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/25 border-2 border-white">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="text-left">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">CampusRAG</span>
          <p className="text-xs text-amber-900/70 font-medium">Institutional AI Assistant</p>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-amber-200/90 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome Back</h2>
        <p className="text-xs text-slate-500 mb-6 font-medium">
          Sign in to access your verified college knowledge base
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fade-in shadow-2xs">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-amber-700/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) clearError();
                }}
                placeholder="student@campus.edu or admin@campus.edu"
                className="w-full bg-white border border-amber-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-2xs transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-amber-700/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                placeholder="••••••••••••"
                className="w-full bg-white border border-amber-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-2xs transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to CampusRAG</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Options */}
        <div className="mt-6 pt-5 border-t border-amber-100 space-y-2">
          <p className="text-[11px] font-bold text-amber-900/70 uppercase tracking-wider text-center mb-2.5">
            Instant One-Click Demo Access
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDemoStudent}
              disabled={isLoading}
              className="py-2.5 px-3 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-amber-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              <UserCheck className="w-4 h-4 text-orange-600" />
              <span>Demo Student</span>
            </button>

            <button
              type="button"
              onClick={handleDemoAdmin}
              disabled={isLoading}
              className="py-2.5 px-3 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100/80 text-orange-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Demo Admin</span>
            </button>
          </div>
        </div>

        {/* Link to Register */}
        <div className="mt-6 text-center text-xs text-slate-500 font-medium">
          Don't have an account?{' '}
          <button
            onClick={() => (window.location.hash = '/register')}
            className="text-orange-600 hover:text-orange-700 font-bold underline underline-offset-2 ml-1"
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  );
}
