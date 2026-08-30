import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminDocumentsPage from './pages/AdminDocumentsPage';
import AdminDocumentDetailPage from './pages/AdminDocumentDetailPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const { isAuthenticated, user, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();

    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [fetchMe]);

  // Clean path (strip hash)
  const path = currentHash.replace(/^#/, '') || '/';

  // Route matching
  if (path === '/' || path === '') {
    return <LandingPage />;
  }

  if (path === '/login') {
    if (isAuthenticated) {
      window.location.hash = user?.role === 'admin' ? '/admin/dashboard' : '/chat';
      return null;
    }
    return <LoginPage />;
  }

  if (path === '/register') {
    if (isAuthenticated) {
      window.location.hash = user?.role === 'admin' ? '/admin/dashboard' : '/chat';
      return null;
    }
    return <RegisterPage />;
  }

  if (path === '/chat') {
    return (
      <ProtectedRoute>
        <ChatPage />
      </ProtectedRoute>
    );
  }

  if (path === '/chat/history') {
    return (
      <ProtectedRoute>
        <ChatHistoryPage />
      </ProtectedRoute>
    );
  }

  if (path === '/admin/dashboard') {
    return (
      <ProtectedRoute adminOnly={true}>
        <AdminDashboardPage />
      </ProtectedRoute>
    );
  }

  if (path === '/admin/documents') {
    return (
      <ProtectedRoute adminOnly={true}>
        <AdminDocumentsPage />
      </ProtectedRoute>
    );
  }

  // Handle dynamic /admin/documents/:id route
  if (path.startsWith('/admin/documents/')) {
    const documentId = path.split('/')[3];
    return (
      <ProtectedRoute adminOnly={true}>
        <AdminDocumentDetailPage documentId={documentId} />
      </ProtectedRoute>
    );
  }

  if (path === '/settings') {
    return (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    );
  }

  // Fallback 404
  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col items-center justify-center text-slate-200 px-4 text-center">
      <h2 className="text-3xl font-bold mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-400 mb-6">
        The requested campus route does not exist.
      </p>
      <button
        onClick={() => (window.location.hash = '/')}
        className="px-5 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-500 text-white text-xs font-semibold"
      >
        Return to Home
      </button>
    </div>
  );
}
