import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  KeyRound,
  Bell,
  CheckCircle,
  AlertCircle,
  Database,
  Info,
} from 'lucide-react';
import AppShell from '../components/AppShell/AppShell';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { formatDate } from '../lib/utils';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwStatus, setPwStatus] = useState(null); // 'success' | 'error'
  const [pwMessage, setPwMessage] = useState('');

  const [notifications, setNotifications] = useState({
    newCirculars: true,
    policyUpdates: true,
    examNotices: true,
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwStatus('error');
      setPwMessage('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    setPwStatus(null);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setIsChangingPassword(false);
      setPwStatus('success');
      setPwMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setIsChangingPassword(false);
      setPwStatus('error');
      setPwMessage(err.response?.data?.error || 'Failed to update password.');
    }
  };

  return (
    <AppShell currentPath="/settings">
      <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
        {/* Header */}
        <div className="pb-6 border-b border-amber-200/80">
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-orange-600" />
            Account & System Preferences
          </h1>
          <p className="text-xs text-amber-900/70 mt-1 font-medium">
            Manage your campus credentials, view access roles, and adjust notification alerts.
          </p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white border border-amber-200/90 rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-orange-600" />
            Institutional Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70">
              <span className="text-amber-900/70 text-[10px] uppercase font-mono font-bold block">
                Full Name
              </span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {user?.name}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70">
              <span className="text-amber-900/70 text-[10px] uppercase font-mono font-bold block">
                Email Address
              </span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block font-mono">
                {user?.email}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70">
              <span className="text-amber-900/70 text-[10px] uppercase font-mono font-bold block">
                Assigned Role
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase font-mono font-bold ${
                    user?.role === 'admin'
                      ? 'bg-orange-100 text-orange-900 border-orange-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                >
                  {user?.role}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-700 font-semibold">{user?.department || 'General'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70">
              <span className="text-amber-900/70 text-[10px] uppercase font-mono font-bold block">
                Account Created
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block font-mono">
                {formatDate(user?.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-amber-200/90 rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-orange-600" />
            Security & Password Update
          </h3>

          {pwStatus === 'success' && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-2xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pwMessage}</span>
            </div>
          )}

          {pwStatus === 'error' && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{pwMessage}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
            >
              {isChangingPassword ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white border border-amber-200/90 rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-600" />
            Knowledge Notification Alerts
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/70 cursor-pointer hover:bg-amber-50/70 transition-colors">
              <div>
                <span className="font-bold text-slate-900 block">
                  New Circulars & Announcements
                </span>
                <span className="text-amber-900/70 text-[11px] font-medium">
                  Alert when an administrator indexes a new university circular
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.newCirculars}
                onChange={(e) =>
                  setNotifications({ ...notifications, newCirculars: e.target.checked })
                }
                className="w-4 h-4 accent-orange-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/70 cursor-pointer hover:bg-amber-50/70 transition-colors">
              <div>
                <span className="font-bold text-slate-900 block">Examination Schedules</span>
                <span className="text-amber-900/70 text-[11px] font-medium">
                  Receive notifications when academic timetables are refreshed
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.examNotices}
                onChange={(e) =>
                  setNotifications({ ...notifications, examNotices: e.target.checked })
                }
                className="w-4 h-4 accent-orange-500 rounded"
              />
            </label>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
