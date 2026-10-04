import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../lib/api';
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
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Filters state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    module_code: 'ALL',
    entity_type: 'ALL',
    action: 'ALL',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPage(1); // Reset page on filter
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    const defaultFilters = { module_code: 'ALL', entity_type: 'ALL', action: 'ALL' };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-events', page, pageSize, appliedFilters],
    queryFn: () => auditApi.getEvents({ page, pageSize, ...appliedFilters }),
    keepPreviousData: true,
  });

  const events = data?.events || [];
  const meta = data?.meta || { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 };
  
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= meta.totalPages) {
      setPage(newPage);
    }
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'CREATE': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'UPDATE': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'DELETE': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'LOGIN': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'ROLE_ASSIGN': return 'text-amber-700 bg-amber-50 border-amber-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
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
          <button onClick={() => refetch()} className="p-1.5 text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-lg border border-outline-variant transition-colors" title="Force Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
              <select 
                value={filters.module_code}
                onChange={(e) => handleFilterChange('module_code', e.target.value)}
                className="w-full bg-surface-container-low text-xs text-on-surface rounded-lg border-outline-variant py-1.5 pl-2.5 pr-8 focus:ring-1 focus:ring-primary focus:border-primary font-medium appearance-none"
              >
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
              <select 
                value={filters.entity_type}
                onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                className="w-full bg-surface-container-low text-xs text-on-surface rounded-lg border-outline-variant py-1.5 pl-2.5 pr-8 focus:ring-1 focus:ring-primary focus:border-primary font-medium appearance-none"
              >
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
              <select 
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full bg-surface-container-low text-xs text-on-surface rounded-lg border-outline-variant py-1.5 pl-2.5 pr-8 focus:ring-1 focus:ring-primary focus:border-primary font-medium appearance-none"
              >
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
          {/* Date Range Picker - Static for now */}
          <div className="space-y-1 lg:col-span-2 opacity-50 pointer-events-none">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-label">Date Range</label>
            <div className="flex items-center bg-surface-container-low border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
              <Calendar className="w-3.5 h-3.5 text-on-surface-variant mr-2" />
              <span className="font-mono text-xs text-on-surface font-medium">All Time</span>
            </div>
          </div>
          {/* Filter Buttons */}
          <div className="flex items-end gap-2">
            <button 
              onClick={applyFilters}
              className="flex-1 bg-primary text-on-primary text-xs font-semibold py-2 px-3 rounded-lg hover:bg-primary-dim transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>
            <button 
              onClick={resetFilters}
              className="bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-xs font-medium py-2 px-3 rounded-lg border border-outline-variant transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
        {/* Filter Meta bar */}
        <div className="pt-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant font-medium">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-primary" />
            <span>Showing {events.length} of {meta.totalCount} audit events</span>
          </div>
        </div>
      </section>

      {/* Main Ledger Data Table Container */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/70 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
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
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-on-surface-variant text-sm">
                    Loading audit events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-on-surface-variant text-sm">
                    No audit events found.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.event_id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-xs">{new Date(event.created_at).toLocaleString()}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant border border-outline-variant">
                        {event.module_code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] bg-surface-container-highest px-1.5 py-0.5 rounded font-semibold">
                        {event.entity_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-xs font-semibold">{event.entity_id}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${getActionColor(event.action)}`}>
                        {event.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        {event.performed_by === 'SYSTEM' ? (
                          <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                            <Network className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-[10px]">
                            {event.performed_by_name?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface leading-none">{event.performed_by_name || event.performed_by}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono mt-0.5">{event.performed_by}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {event.acting_context_role ? (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-max">
                          <ShieldCheck className="w-3 h-3" />
                          {event.acting_context_role}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant text-[11px] italic">Self</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {event.payload && (
                        <button 
                          onClick={() => toggleRow(event.event_id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-dim transition-colors"
                        >
                          <FileDiff className="w-3.5 h-3.5" />
                          {expandedRow === event.event_id ? 'Hide Diff' : 'View Diff'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer & Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-outline-variant bg-surface-container-low/40">
          <div className="flex items-center gap-4 text-xs text-on-surface-variant">
            <span>Showing <strong className="text-on-surface">{(page - 1) * pageSize + (events.length > 0 ? 1 : 0)} to {Math.min(page * pageSize, meta.totalCount)}</strong> of <strong className="text-on-surface">{meta.totalCount}</strong> audit events</span>
            <div className="flex items-center gap-1.5">
              <span className="text-outline-variant">•</span>
              <span>Rows per page:</span>
              <select 
                value={pageSize} 
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="bg-surface-container text-xs text-on-surface rounded border border-outline-variant py-0.5 px-2 focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
          {/* Pagination Buttons */}
          <div className="flex items-center gap-1 select-none">
            <button 
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-2.5 py-1 text-xs rounded border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            
            <span className="px-2 py-1 text-xs font-semibold rounded bg-primary text-on-primary">
              {page}
            </span>
            <span className="px-2 py-1 text-xs text-on-surface-variant">/ {meta.totalPages || 1}</span>
            
            <button 
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= meta.totalPages}
              className="px-2.5 py-1 text-xs rounded border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

