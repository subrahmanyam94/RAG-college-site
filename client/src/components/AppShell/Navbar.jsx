import React from 'react';
import { Sparkles, Shield, User, LogOut, Settings, ExternalLink, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuthStore();

  const handleNavigate = (path) => {
    window.location.hash = path;
  };

  const handleLogout = () => {
    logout();
    window.location.hash = '/login';
  };

  return (
    <header className="h-16 border-b border-amber-200/70 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Brand Logo & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-amber-800 hover:text-orange-600 hover:bg-amber-50"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={() => handleNavigate(user?.role === 'admin' ? '/admin/dashboard' : '/chat')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900 tracking-tight">CampusRAG</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
                Institutional
              </span>
            </div>
            <p className="text-[10px] text-amber-800/80 -mt-0.5">Verified AI Knowledge Assistant</p>
          </div>
        </button>
      </div>

      {/* User Info & Navigation Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user ? (
          <>
            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50/80 border border-amber-200 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  user.role === 'admin' ? 'bg-orange-600 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="font-semibold text-amber-950 capitalize">{user.role}</span>
              {user.department && (
                <span className="text-amber-800/80 border-l border-amber-300 pl-2">
                  {user.department}
                </span>
              )}
            </div>

            {/* Settings button */}
            <button
              onClick={() => handleNavigate('/settings')}
              className="p-2 rounded-lg text-slate-600 hover:text-orange-600 hover:bg-amber-50 transition-colors"
              title="Settings & Profile"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-700 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-300 transition-all shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigate('/login')}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-orange-600"
            >
              Sign In
            </button>
            <button
              onClick={() => handleNavigate('/register')}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-lg shadow-sm"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
