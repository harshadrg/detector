import { NavLink, Outlet, useLocation } from 'react-router';
import { ShieldCheck, LayoutDashboard, GitFork, Users, LogOut, ClipboardCheck, ArrowRightLeft, UploadCloud, Database, History, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/useAuth.js';
import { NotificationDrawer } from './NotificationDrawer.jsx';

export function AppShell() {
  const { user, logout, activeContextRole } = useAuth();
  const location = useLocation();

  return (
    <div className="bg-surface-container-low text-on-surface font-sans antialiased min-h-screen flex">
      {/* FIXED LEFT SIDEBAR */}
      <aside className="fixed top-0 left-0 h-screen w-[240px] bg-surface-container-lowest border-r border-outline-variant/30 z-40 flex flex-col justify-between select-none">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand & Header */}
          <div className="h-16 flex items-center gap-2.5 px-5 border-b border-outline-variant/30">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-on-surface tracking-wider text-sm leading-tight">DETECTOR</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-outline">Core Console</span>
            </div>
          </div>

          {/* Action CTA */}
          <div className="px-3 pt-4 pb-2">
            <NavLink 
              to="/registry/new"
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2 px-3 rounded-lg text-sm font-medium hover:bg-primary-dim transition-colors duration-150 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>New Process</span>
            </NavLink>
          </div>

          {/* Navigation Section */}
          <nav className="p-3 space-y-1">
            <NavLink 
              to="/overview" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-container/30 text-primary font-semibold border border-primary/20' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">Operational Overview</span>
            </NavLink>
            <NavLink 
              to="/registry" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-container/30 text-primary font-semibold border border-primary/20' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
                }`
              }
            >
              <GitFork className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">Process Registry</span>
            </NavLink>
            <NavLink 
              to="/directory" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-container/30 text-primary font-semibold border border-primary/20' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
                }`
              }
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">Employee Directory</span>
            </NavLink>
            <NavLink 
              to="/master-data" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-container/30 text-primary font-semibold border border-primary/20' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
                }`
              }
            >
              <Database className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">Master Data</span>
            </NavLink>
            <NavLink 
              to="/reviews" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-container/30 text-primary font-semibold border border-primary/20' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
                }`
              }
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold flex-1">Review Queue</span>
              <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
            </NavLink>
            <NavLink 
              to="/handovers" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-container/30 text-primary font-semibold border border-primary/20' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
                }`
              }
            >
              <ArrowRightLeft className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">PM Handovers</span>
            </NavLink>
            <NavLink 
              to="/import" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-container/30 text-primary font-semibold border border-primary/20' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
                }`
              }
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">Excel Import</span>
            </NavLink>
            <NavLink 
              to="/audit" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-secondary-container text-on-secondary-container font-semibold' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`
              }
            >
              <History className={`w-4 h-4 shrink-0 ${location.pathname === '/audit' ? 'text-primary' : ''}`} />
              <span className="text-xs font-semibold">Audit Ledger</span>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Bottom Version */}
        <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between">
          <span className="text-xs font-mono text-outline font-medium">Detector v4.8</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>PROD
          </span>
        </div>
      </aside>

      {/* TOP BAR */}
      <header className="fixed top-0 left-[240px] right-0 h-16 bg-surface-container-lowest border-b border-outline-variant/30 z-30 flex items-center justify-between px-8 select-none">
        
        {/* Left: Brand Mark */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant tracking-wide uppercase">Operational Module</span>
          </div>
        </div>

        {/* Center-right & Right controls */}
        <div className="flex items-center gap-5">
          {activeContextRole && (
            <div className="relative">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-md text-xs font-semibold text-on-surface shadow-none">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="font-mono tracking-tight">{activeContextRole}</span>
              </div>
            </div>
          )}

          <div className="h-5 w-[1px] bg-outline-variant/30"></div>

          <NotificationDrawer />

          <div className="h-5 w-[1px] bg-outline-variant/30"></div>

          <button 
            type="button" 
            onClick={logout}
            className="flex items-center gap-2 pl-1 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-primary-container/50 border border-primary/20 text-on-primary-container font-semibold text-xs flex items-center justify-center uppercase">
              {(user?.ecode || user?.employeeCode || 'U').substring(0, 2)}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">
                Logout
              </span>
              <LogOut className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors" />
            </div>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="ml-[240px] pt-16 flex-1 min-h-screen bg-surface-container-low flex flex-col">
        <div className="p-8 w-full mx-auto space-y-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
