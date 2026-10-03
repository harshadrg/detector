import { useState } from 'react';
import { 
  PauseCircle, 
  RefreshCw, 
  Download, 
  Calendar, 
  X, 
  Filter,
  BarChart2,
  ChevronDown,
  ChevronUp,
  FileDiff,
  ShieldCheck,
  Network,
  Key,
  Shield
} from 'lucide-react';

export function AuditLedger() {
  const [expandedRow, setExpandedRow] = useState('E1004');

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <main className="flex-1 p-6 space-y-5 max-w-[1600px] w-full mx-auto bg-background overflow-y-auto focus:outline-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-on-surface font-headline">Audit Ledger</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Tamper-Proof Log
            </span>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 font-body">
            Immutable platform-wide event log with JSON diff inspection and cryptographic verification
          </p>
        </div>
        {/* Top-Right Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-lg border border-outline-variant transition-colors shadow-sm">
            <PauseCircle className="w-4 h-4 text-amber-600" />
            <span>Live Stream: Paused</span>
          </button>
          <button className="p-1.5 text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-lg border border-outline-variant transition-colors" title="Force Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-on-primary bg-primary hover:bg-primary-dim rounded-lg shadow-sm transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Audit Log (.csv)</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Filter Bar */}
      <section className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/70 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Module Dropdown */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-label">Module</label>
            <div className="relative">
              <select className="w-full bg-surface-container-low text-xs text-on-surface rounded-lg border-outline-variant py-1.5 pl-2.5 pr-8 focus:ring-1 focus:ring-primary focus:border-primary font-medium appearance-none">
                <option value="ALL">All Modules</option>
                <option value="CORE">CORE</option>
                <option value="BPMS">BPMS</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 top-2.5 text-on-surface-variant pointer-events-none" />
            </div>
          </div>
          {/* Entity Type Dropdown */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-label">Entity Type</label>
            <div className="relative">
              <select className="w-full bg-surface-container-low text-xs text-on-surface rounded-lg border-outline-variant py-1.5 pl-2.5 pr-8 focus:ring-1 focus:ring-primary focus:border-primary font-medium appearance-none">
                <option value="ALL">All Entities</option>
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="PROCESS">PROCESS</option>
                <option value="ROLE_MAPPING">ROLE_MAPPING</option>
                <option value="IMPORT_BATCH">IMPORT_BATCH</option>
                <option value="CLIENT">CLIENT</option>
                <option value="SBU">SBU</option>
                <option value="SYSTEM_AUTH">SYSTEM_AUTH</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 top-2.5 text-on-surface-variant pointer-events-none" />
            </div>
          </div>
          {/* Action Dropdown */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-label">Action</label>
            <div className="relative">
              <select className="w-full bg-surface-container-low text-xs text-on-surface rounded-lg border-outline-variant py-1.5 pl-2.5 pr-8 focus:ring-1 focus:ring-primary focus:border-primary font-medium appearance-none">
                <option value="ALL">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="STATUS_CHANGE">STATUS_CHANGE</option>
                <option value="ROLE_ASSIGN">ROLE_ASSIGN</option>
                <option value="ROLE_REVOKE">ROLE_REVOKE</option>
                <option value="LOGIN">LOGIN</option>
                <option value="COMMIT">COMMIT</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 top-2.5 text-on-surface-variant pointer-events-none" />
            </div>
          </div>
          {/* Date Range Picker */}
          <div className="space-y-1 lg:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-label">Date Range</label>
            <div className="flex items-center bg-surface-container-low border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
              <Calendar className="w-3.5 h-3.5 text-on-surface-variant mr-2" />
              <span className="font-mono text-xs text-on-surface font-medium">2024-09-01 — 2024-09-15</span>
              <button className="ml-auto text-on-surface-variant hover:text-on-surface">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* Filter Buttons */}
          <div className="flex items-end gap-2">
            <button className="flex-1 bg-primary text-on-primary text-xs font-semibold py-2 px-3 rounded-lg hover:bg-primary-dim transition-colors flex items-center justify-center gap-1 shadow-sm">
              <Filter className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>
            <button className="bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-xs font-medium py-2 px-3 rounded-lg border border-outline-variant transition-colors">
              Reset
            </button>
          </div>
        </div>
        {/* Filter Meta bar */}
        <div className="pt-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant font-medium">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-primary" />
            <span>Showing 0 of 0 audit events</span>
            <span className="text-outline-variant">•</span>
            <span className="text-[11px] bg-surface-container px-2 py-0.5 rounded text-secondary-dim font-mono">Filter: [Active Date Window + 0 Exclusions]</span>
          </div>
          <div className="text-[11px] text-on-surface-variant/80">
            Query Latency: <span className="font-mono">14ms</span>
          </div>
        </div>
      </section>

      {/* Main Ledger Data Table Container */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-headline text-[11px] font-semibold uppercase tracking-wider border-b border-outline-variant">
                <th className="py-3 px-4 w-44">Timestamp</th>
                <th className="py-3 px-3 w-20">Module</th>
                <th className="py-3 px-3 w-28">Entity Type</th>
                <th className="py-3 px-3 w-24">Entity ID</th>
                <th className="py-3 px-3 w-32">Action</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-3 w-36">Acting Context</th>
                <th className="py-3 px-4 text-right w-36">Details / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-on-surface font-body">
                {/* TODO: Phase 5 - Fetch audit events from /api/core/audit */}
                <tr>
                  <td colSpan="8" className="py-8 text-center text-on-surface-variant text-sm">
                    No audit events found.
                  </td>
                </tr>
              </tbody>
          </table>
        </div>
        
        {/* Table Footer & Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-outline-variant bg-surface-container-low/40">
          <div className="flex items-center gap-4 text-xs text-on-surface-variant">
            <span>Showing <strong className="text-on-surface">0 to 0</strong> of <strong className="text-on-surface">0</strong> audit events</span>
            <div className="flex items-center gap-1.5">
              <span className="text-outline-variant">•</span>
              <span>Rows per page:</span>
              <select className="bg-surface-container text-xs text-on-surface rounded border border-outline-variant py-0.5 px-2 focus:ring-1 focus:ring-primary focus:border-primary">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
          {/* Pagination Buttons */}
          <div className="flex items-center gap-1 select-none">
            <button className="px-2.5 py-1 text-xs rounded border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-50 transition-colors" disabled>
              Previous
            </button>
            <button className="px-2.5 py-1 text-xs font-semibold rounded bg-primary text-on-primary">
              1
            </button>
            <button className="px-2.5 py-1 text-xs rounded border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors">
              2
            </button>
            <button className="px-2.5 py-1 text-xs rounded border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors">
              3
            </button>
            <span className="px-1 text-xs text-on-surface-variant">...</span>
            <button className="px-2.5 py-1 text-xs rounded border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors">
              149
            </button>
            <button className="px-2.5 py-1 text-xs rounded border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
