import { X, GitBranch, Users, Key } from 'lucide-react';

export function ProcessDetailModal({ isOpen, onClose, process }) {
  if (!isOpen || !process) return null;

  const hierarchy = process.hierarchy || {};
  const capabilities = process.capabilities || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  {process.process_code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    process.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : process.status === 'TRANSITION'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {process.status}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 mt-1">
                {process.process_name || process.wps_code || 'Unnamed Process Unit'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Vertical
              </span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {process.vertical_code || process.vertical_name || '—'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                SBU
              </span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {process.sbu_code || process.sbu_name || '—'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Client / Type
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                {process.client_name || process.client_type || '—'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                WPS Code
              </span>
              <span className="font-mono text-slate-700 mt-0.5 block">
                {process.wps_code || 'Pending Form'}
              </span>
            </div>
          </div>

          {/* 5-Tier Ownership Hierarchy */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Current 5-Tier Ownership Hierarchy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Project Manager */}
              <div className="p-3 bg-white border border-indigo-200 rounded-xl shadow-2xs">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Project Manager (PM)
                </span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {hierarchy.pm?.name || 'Unassigned'}
                </span>
                <span className="font-mono text-[10px] text-slate-400 block">
                  {hierarchy.pm?.ecode ? `${hierarchy.pm.ecode} • ${hierarchy.pm.email}` : 'No active PM'}
                </span>
              </div>

              {/* Account Head */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Account Head
                </span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {hierarchy.account_head?.name || 'Unassigned'}
                </span>
                <span className="font-mono text-[10px] text-slate-400 block">
                  {hierarchy.account_head?.ecode || '—'}
                </span>
              </div>

              {/* SBU Head */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Strategic Business Unit Head
                </span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {hierarchy.sbu_head?.name || 'Unassigned'}
                </span>
                <span className="font-mono text-[10px] text-slate-400 block">
                  {hierarchy.sbu_head?.ecode || '—'}
                </span>
              </div>

              {/* CBO */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Chief Business Officer (CBO)
                </span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {hierarchy.cbo?.name || 'Unassigned'}
                </span>
                <span className="font-mono text-[10px] text-slate-400 block">
                  {hierarchy.cbo?.ecode || '—'}
                </span>
              </div>

              {/* Ops Quality Head */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Operations & Quality Head
                </span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {hierarchy.ops_head?.name || 'Unassigned'}
                </span>
                <span className="font-mono text-[10px] text-slate-400 block">
                  {hierarchy.ops_head?.ecode || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Resolved Row Capabilities */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Your Authorized Row Capabilities ({capabilities.length})</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Evaluated dynamically by backend ABAC ownership policies for your session:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {capabilities.map((cap) => (
                <span
                  key={cap}
                  className="font-mono text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 border border-indigo-200/80 text-indigo-800 rounded-md"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Status Reason / Sentinels */}
          {process.status_reason && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Status Reason / Sentinels
              </span>
              <p className="text-xs text-amber-900 font-mono">{process.status_reason}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Created by: {process.created_by}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
