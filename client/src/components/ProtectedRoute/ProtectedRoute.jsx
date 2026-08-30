import React from 'react';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute({ children, adminOnly = false, redirectPath = '/login' }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080d1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-campus-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Validating campus credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    window.location.hash = redirectPath;
    return null;
  }

  if (adminOnly && user.role !== 'admin') {
    window.location.hash = '/chat';
    return null;
  }

  return children;
}
