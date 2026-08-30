import React from 'react';
import {
  MessageSquare,
  History,
  LayoutDashboard,
  Files,
  Settings,
  Shield,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Sidebar({ currentPath }) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const navigate = (path) => {
    window.location.hash = path;
  };

  const navItems = [
    {
      label: 'Student Assistant',
      items: [
        { path: '/chat', label: 'Campus Chat', icon: MessageSquare },
        { path: '/chat/history', label: 'Chat History', icon: History },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: 'Administration',
            items: [
              { path: '/admin/dashboard', label: 'Analytics Dashboard', icon: LayoutDashboard },
              { path: '/admin/documents', label: 'Document Base', icon: Files },
            ],
          },
        ]
      : []),
    {
      label: 'Preferences',
      items: [{ path: '/settings', label: 'User Settings', icon: Settings }],
    },
  ];

  return (
    <aside className="w-60 bg-white border-r border-amber-200/60 flex flex-col justify-between shrink-0 hidden md:flex shadow-xs">
      <div className="p-4 space-y-6">
        {navItems.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            <h4 className="text-[11px] font-bold text-amber-900/70 uppercase tracking-wider px-3 mb-2">
              {group.label}
            </h4>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent text-orange-950 border-l-4 border-orange-500 pl-2.5 shadow-xs'
                      : 'text-slate-600 hover:text-orange-950 hover:bg-amber-50/60 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-orange-600' : 'text-amber-700/60'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Institutional Knowledge Badge */}
      <div className="p-4 border-t border-amber-100">
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
          <GraduationCap className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-950">Campus Verified</p>
            <p className="text-[10px] text-amber-900/70 mt-0.5 leading-relaxed">
              Strictly grounded responses backed by official university circulars.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
