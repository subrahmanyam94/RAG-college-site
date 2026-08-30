import React, { useState } from 'react';
import { Sparkles, User, Mail, Lock, Building, UserPlus, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('Computer Science');
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register({ name, email, password, role, department });
    if (res.success) {
      if (res.user.role === 'admin') {
        window.location.hash = '/admin/dashboard';
      } else {
        window.location.hash = '/chat';
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col justify-center items-center px-4 py-12 selection:bg-orange-500 selection:text-white">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => (window.location.hash = '/')}>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/25 border-2 border-white">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="text-left">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">CampusRAG</span>
          <p className="text-xs text-amber-900/70 font-medium">Institutional AI Assistant</p>
        </div>
      </div>

      {/* Main Register Card */}
      <div className="w-full max-w-md bg-white border border-amber-200/90 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Create an Account</h2>
        <p className="text-xs text-slate-500 mb-6 font-medium">
          Join CampusRAG to access official university documents & regulations
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fade-in shadow-2xs">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-amber-700/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) clearError();
                }}
                placeholder="e.g. Alex Student"
                className="w-full bg-white border border-amber-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-2xs transition-colors"
              />
            </div>
          </div>

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
                placeholder="you@campus.edu"
                className="w-full bg-white border border-amber-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-2xs transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-amber-700/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                placeholder="Minimum 6 characters"
                className="w-full bg-white border border-amber-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-2xs transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 shadow-2xs"
              >
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 mt-2"
          >
            {isLoading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Register Account</span>
              </>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="mt-6 text-center text-xs text-slate-500 font-medium">
          Already have an account?{' '}
          <button
            onClick={() => (window.location.hash = '/login')}
            className="text-orange-600 hover:text-orange-700 font-bold underline underline-offset-2 ml-1"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
