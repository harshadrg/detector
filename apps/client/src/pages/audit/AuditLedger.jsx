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
            <span>Showing 8 of 1,482 audit events</span>
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
              {/* Row 1: BPMS / IMPORT_BATCH */}
              <tr className="hover:bg-surface-container-low/60 transition-colors">
                <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant">2024-09-15 10:32:15</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-100 text-violet-800 border border-violet-200">BPMS</span>
                </td>
                <td className="py-3 px-3">
                  <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-surface-container text-on-surface-variant border border-outline-variant/40">IMPORT_BATCH</span>
                </td>
                <td className="py-3 px-3 font-mono font-medium text-primary">B-003</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>COMMIT
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-headline text-[10px] font-bold flex items-center justify-center">AU</div>
                    <span className="font-medium text-on-surface">Admin User <span className="font-mono text-on-surface-variant text-[11px]">(E1001)</span></span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-secondary-container text-on-secondary-container">SUPER_ADMIN</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="inline-flex items-center gap-1 text-primary hover:text-primary-dim font-medium text-xs">
                    <span>Inspect Diff</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>

              {/* Row 2: EXPANDED ROW (CORE / EMPLOYEE / STATUS_CHANGE) */}
              <tr className={`transition-colors ${expandedRow === 'E1004' ? 'bg-secondary-container/25 border-b border-primary/20' : 'hover:bg-surface-container-low/60'}`}>
                <td className={`py-3 px-4 font-mono text-[11px] ${expandedRow === 'E1004' ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>2024-09-15 09:45:00</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">CORE</span>
                </td>
                <td className="py-3 px-3">
                  <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-surface-container text-on-surface-variant border border-outline-variant/40">EMPLOYEE</span>
                </td>
                <td className={`py-3 px-3 font-mono ${expandedRow === 'E1004' ? 'font-bold text-primary' : 'font-medium text-primary'}`}>E1004</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>STATUS_CHANGE
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-headline text-[10px] font-bold flex items-center justify-center">AU</div>
                    <span className="font-medium text-on-surface">Admin User <span className="font-mono text-on-surface-variant text-[11px]">(E1001)</span></span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-secondary-container text-on-secondary-container">SUPER_ADMIN</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => toggleRow('E1004')}
                    className={`inline-flex items-center gap-1 font-medium text-xs ${expandedRow === 'E1004' ? 'text-primary font-bold bg-surface-container-high px-2 py-1 rounded' : 'text-primary hover:text-primary-dim'}`}
                  >
                    <span>{expandedRow === 'E1004' ? 'Close Diff' : 'Inspect Diff'}</span>
                    {expandedRow === 'E1004' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </td>
              </tr>

              {/* INLINE EXPANDED JSON DIFF INSPECTOR DRAWER */}
              {expandedRow === 'E1004' && (
                <tr className="bg-surface-container-low/80 border-b-2 border-primary/40">
                  <td className="p-0" colSpan="8">
                    <div className="p-5 space-y-4">
                      {/* Diff Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-3.5 rounded-lg border border-outline-variant/60 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <FileDiff className="text-primary w-5 h-5" />
                          <div>
                            <h4 className="font-headline font-bold text-xs sm:text-sm text-on-surface">
                              Audit Event Diff Inspection #EVT-89241 — Target: Employee E1004 (Rarata H)
                            </h4>
                            <p className="text-[11px] text-on-surface-variant font-mono">Trace Reference: audit_stream_c289aa81f4</p>
                          </div>
                        </div>
                        {/* Cryptographic verification badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-mono font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>sha256:7b82f9d... verified</span>
                        </div>
                      </div>
                      
                      {/* Side-by-Side Diff Panels */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                        {/* Left Panel: Previous State */}
                        <div className="bg-inverse-surface text-surface-bright rounded-lg overflow-hidden border border-outline-variant/30 flex flex-col">
                          <div className="bg-slate-900 px-3.5 py-2 flex items-center justify-between border-b border-slate-700/80">
                            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Previous State (v2.1)
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">CRC: 0x489F</span>
                          </div>
                          <div className="p-3 text-[11px] leading-relaxed overflow-x-auto space-y-0.5">
                            <div className="text-slate-400">{'{'}</div>
                            <div className="pl-4 text-slate-300">"employee_id": <span className="text-amber-300">"E1004"</span>,</div>
                            <div className="pl-4 text-slate-300">"display_name": <span className="text-amber-300">"Rarata H"</span>,</div>
                            <div className="pl-2 -ml-2 bg-rose-950/70 text-rose-200 border-l-2 border-rose-500 py-0.5 flex items-start">
                              <span className="text-rose-400 font-bold select-none pr-2">-</span>
                              <span>"status": <span className="text-rose-300">"ACTIVE"</span>,</span>
                            </div>
                            <div className="pl-2 -ml-2 bg-rose-950/70 text-rose-200 border-l-2 border-rose-500 py-0.5 flex items-start">
                              <span className="text-rose-400 font-bold select-none pr-2">-</span>
                              <span>"deactivation_reason": <span className="text-slate-400">null</span>,</span>
                            </div>
                            <div className="pl-4 text-slate-300">"active_assignments_count": <span className="text-sky-300">3</span>,</div>
                            <div className="pl-4 text-slate-300">"sbu_code": <span className="text-amber-300">"SBU_RETAIL"</span>,</div>
                            <div className="pl-4 text-slate-300">"updated_at": <span className="text-amber-300">"2024-07-01T08:12:00Z"</span></div>
                            <div className="text-slate-400">{'}'}</div>
                          </div>
                        </div>

                        {/* Right Panel: Updated State */}
                        <div className="bg-inverse-surface text-surface-bright rounded-lg overflow-hidden border border-outline-variant/30 flex flex-col">
                          <div className="bg-slate-900 px-3.5 py-2 flex items-center justify-between border-b border-slate-700/80">
                            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Updated State (v2.2)
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">CRC: 0x93FA</span>
                          </div>
                          <div className="p-3 text-[11px] leading-relaxed overflow-x-auto space-y-0.5">
                            <div className="text-slate-400">{'{'}</div>
                            <div className="pl-4 text-slate-300">"employee_id": <span className="text-amber-300">"E1004"</span>,</div>
                            <div className="pl-4 text-slate-300">"display_name": <span className="text-amber-300">"Rarata H"</span>,</div>
                            <div className="pl-2 -ml-2 bg-emerald-950/70 text-emerald-200 border-l-2 border-emerald-500 py-0.5 flex items-start">
                              <span className="text-emerald-400 font-bold select-none pr-2">+</span>
                              <span>"status": <span className="text-emerald-300">"INACTIVE"</span>,</span>
                            </div>
                            <div className="pl-2 -ml-2 bg-emerald-950/70 text-emerald-200 border-l-2 border-emerald-500 py-0.5 flex items-start">
                              <span className="text-emerald-400 font-bold select-none pr-2">+</span>
                              <span>"deactivation_reason": <span className="text-emerald-300">"OFFBOARDING_PENDING_HANDOVER"</span>,</span>
                            </div>
                            <div className="pl-4 text-slate-300">"active_assignments_count": <span className="text-sky-300">3</span>,</div>
                            <div className="pl-2 -ml-2 bg-emerald-950/70 text-emerald-200 border-l-2 border-emerald-500 py-0.5 flex items-start">
                              <span className="text-emerald-400 font-bold select-none pr-2">+</span>
                              <span>"deactivated_at": <span className="text-emerald-300">"2024-09-15T09:45:00Z"</span>,</span>
                            </div>
                            <div className="pl-2 -ml-2 bg-emerald-950/70 text-emerald-200 border-l-2 border-emerald-500 py-0.5 flex items-start">
                              <span className="text-emerald-400 font-bold select-none pr-2">+</span>
                              <span>"deactivated_by": <span className="text-emerald-300">"E1001"</span>,</span>
                            </div>
                            <div className="pl-4 text-slate-300">"sbu_code": <span className="text-amber-300">"SBU_RETAIL"</span></div>
                            <div className="text-slate-400">{'}'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Diff Inspector Footer Metadata */}
                      <div className="flex flex-wrap items-center justify-between text-xs text-on-surface-variant font-mono bg-surface-container-high/60 px-4 py-2.5 rounded-lg border border-outline-variant/40 gap-3">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5">
                            <Network className="w-3.5 h-3.5" />
                            <span>Actor IP: <strong className="text-on-surface">10.240.12.89</strong></span>
                          </span>
                          <span className="text-outline-variant">|</span>
                          <span className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5" />
                            <span>Session ID: <strong className="text-on-surface">sess_8f29c41</strong></span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Signature: <strong className="text-emerald-700">Ed25519 Verified</strong></span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {/* Row 3: CORE / ROLE_MAPPING / ROLE_ASSIGN */}
              <tr className="hover:bg-surface-container-low/60 transition-colors">
                <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant">2024-09-14 16:20:00</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">CORE</span>
                </td>
                <td className="py-3 px-3">
                  <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-surface-container text-on-surface-variant border border-outline-variant/40">ROLE_MAPPING</span>
                </td>
                <td className="py-3 px-3 font-mono font-medium text-primary">E1003</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>ROLE_ASSIGN
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-headline text-[10px] font-bold flex items-center justify-center">AU</div>
                    <span className="font-medium text-on-surface">Admin User <span className="font-mono text-on-surface-variant text-[11px]">(E1001)</span></span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-secondary-container text-on-secondary-container">SUPER_ADMIN</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="inline-flex items-center gap-1 text-primary hover:text-primary-dim font-medium text-xs">
                    <span>Inspect Diff</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Table Footer & Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-outline-variant bg-surface-container-low/40">
          <div className="flex items-center gap-4 text-xs text-on-surface-variant">
            <span>Showing <strong className="text-on-surface">1 to 8</strong> of <strong className="text-on-surface">1,482</strong> audit events</span>
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
