import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { auditApi } from '../../lib/api.js';
import { AuditDiffModal } from './AuditDiffModal.jsx';
import {
  ScrollText,
  Search,
  RefreshCw,
  Eye,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const MODULE_STYLES = {
  CORE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  BPMS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const ACTION_STYLES = {
  CREATE_EMPLOYEE: 'bg-blue-50 text-blue-700 border-blue-200',
  UPDATE_EMPLOYEE_STATUS: 'bg-amber-50 text-amber-700 border-amber-200',
  ASSIGN_ROLE: 'bg-purple-50 text-purple-700 border-purple-200',
  REVOKE_ROLE: 'bg-red-50 text-red-700 border-red-200',
};

export function AuditLedger() {
  const { hasPermission } = useAuth();
  const canViewGlobal = hasPermission('CORE.AUDIT.VIEW_GLOBAL');

  // State
  const [events, setEvents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 15, totalCount: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState(canViewGlobal ? 'ALL' : 'BPMS');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected event for Diff Modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const reloadEvents = useCallback(() => {
    setIsLoading(true);
    setRefreshIndex((idx) => idx + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const response = await auditApi.getEvents({
          page,
          pageSize: 15,
          module_code: moduleFilter,
          entity_type: entityFilter,
          search: appliedSearch,
        });

        if (isMounted) {
          setEvents(response.events || []);
          if (response.meta) {
            setMeta(response.meta);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to retrieve audit events.');
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [page, moduleFilter, entityFilter, appliedSearch, refreshIndex]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleModuleChange = (mod) => {
    setIsLoading(true);
    setModuleFilter(mod);
    setPage(1);
  };

  const handleEntityChange = (entity) => {
    setIsLoading(true);
    setEntityFilter(entity);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setIsLoading(true);
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Platform Immutable Audit Ledger
              </h1>
              <p className="text-xs text-slate-500">
                Append-only verifiable ledger of all platform and operational module state changes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={reloadEvents}
            disabled={isLoading}
            className="p-2.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh audit ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Module & Entity Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {canViewGlobal && (
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'ALL', label: 'All Modules' },
                { id: 'CORE', label: 'Core Platform' },
                { id: 'BPMS', label: 'BPMS Module' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleModuleChange(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    moduleFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Entity Type Filter */}
          <select
            value={entityFilter}
            onChange={(e) => handleEntityChange(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Entity Types</option>
            <option value="EMPLOYEE">Employees</option>
            <option value="EMPLOYEE_ROLE">Role Assignments</option>
            <option value="PROCESS">Process Registry</option>
            <option value="CHANGE_REQUEST">Change Requests</option>
            <option value="HANDOVER">PM Handovers</option>
          </select>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search action, entity, actor, remarks..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Events Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Module & Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Performer</th>
                <th className="py-3 px-4">Acting Context</th>
                <th className="py-3 px-4 text-right">Details & Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                    <span>Querying immutable audit ledger...</span>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ScrollText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-medium">No audit events found</p>
                    <p className="text-[11px] text-slate-400">
                      Try adjusting your search criteria or module filter.
                    </p>
                  </td>
                </tr>
              ) : (
                events.map((evt) => {
                  const moduleStyle =
                    MODULE_STYLES[evt.module_code] || 'bg-slate-100 text-slate-700 border-slate-200';
                  const actionStyle =
                    ACTION_STYLES[evt.action] || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr key={evt.event_id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-700">
                          {new Date(evt.created_at).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Event #{evt.event_id}
                        </div>
                      </td>

                      {/* Module & Action */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${moduleStyle}`}
                          >
                            {evt.module_code}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${actionStyle}`}
                          >
                            {evt.action}
                          </span>
                        </div>
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {evt.entity_type}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {evt.entity_id}
                        </span>
                      </td>

                      {/* Performer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {evt.performer_name || evt.performed_by}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {evt.performed_by}
                        </div>
                      </td>

                      {/* Acting Context */}
                      <td className="py-3 px-4">
                        {evt.acting_context ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Simulated ({evt.acting_context})
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Direct</span>
                        )}
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(evt)}
                          className="px-2.5 py-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors inline-flex items-center space-x-1 text-[11px] font-medium cursor-pointer"
                          title="Inspect audit diff"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Showing <span className="font-semibold text-slate-700">{events.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{meta.totalCount}</span> total audit records
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-slate-700 px-2">
              Page {page} of {meta.totalPages || 1}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(meta.totalPages, page + 1))}
              disabled={page >= meta.totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Diff Inspector Modal */}
      {selectedEvent && (
        <AuditDiffModal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          event={selectedEvent}
        />
      )}
    </div>
  );
}
