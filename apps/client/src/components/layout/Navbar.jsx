import { useAuth } from '../../context/useAuth.js';
import { RoleContextSwitcher } from './RoleContextSwitcher.jsx';
import { NotificationBell } from '../notifications/NotificationBell.jsx';
import { ShieldCheck, LogOut, User, Key } from 'lucide-react';

export function Navbar() {
  const { user, permissions, logout, isLoading, activeContextRole } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Brand Platform Logo */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-slate-900 block">
            Detector Platform
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Core Platform • Identity & Governance
          </span>
        </div>
      </div>

      {/* Center / Right Section */}
      <div className="flex items-center space-x-3">
        {/* Safe UI Context Switcher */}
        <RoleContextSwitcher />

        {/* Notifications Bell */}
        <NotificationBell />

        {/* User Profile Pill */}
        <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200/80">
          <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-800">
                {user?.name || user?.ecode}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                {user?.ecode}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-slate-400">
              <Key className="w-3 h-3 text-indigo-500" />
              <span>
                {permissions.length} capability tokens
                {activeContextRole ? ` (${activeContextRole})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={logout}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
