import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { processApi, masterApi } from '../../lib/api.js';
import { ProcessDetailModal } from './ProcessDetailModal.jsx';
import {
  GitBranch,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  AlertCircle,
  Database,
} from 'lucide-react';

// Register AG Grid Community Modules
ModuleRegistry.registerModules([AllCommunityModule]);

export function ProcessRegistry({ onNavigate }) {
  // Master options for dropdown filters
  const [verticals, setVerticals] = useState([]);
  const [sbus, setSbus] = useState([]);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedVertical, setSelectedVertical] = useState('');
  const [selectedSbu, setSelectedSbu] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Table Data & Pagination States
  const [processes, setProcesses] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalCount: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail Modal State
  const [selectedProcess, setSelectedProcess] = useState(null);
  const gridRef = useRef(null);

  // Load Master Options for Filters
  useEffect(() => {
    let isMounted = true;
    masterApi.getAll()
      .then((data) => {
        if (isMounted) {
          setVerticals(data.verticals || []);
          setSbus(data.sbus || []);
        }
      })
      .catch((err) => console.warn('Failed to load masters for process filter:', err.message));

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered SBUs based on selected Vertical
  const filteredSBUs = useMemo(() => {
    if (!selectedVertical) return sbus;
    return sbus.filter((s) => String(s.vertical_id) === String(selectedVertical));
  }, [sbus, selectedVertical]);

  // Load Processes from Database via processApi
  useEffect(() => {
    let isMounted = true;

    async function fetchProcesses() {
      try {
        const res = await processApi.list({
          page,
          pageSize: 20,
          search: appliedSearch,
          vertical_id: selectedVertical,
          sbu_id: selectedSbu,
          status: statusFilter,
        });

        if (isMounted) {
          setProcesses(res.processes || []);
          if (res.meta) {
            setMeta(res.meta);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to retrieve processes from registry.');
          setIsLoading(false);
        }
      }
    }

    fetchProcesses();

    return () => {
      isMounted = false;
    };
  }, [page, appliedSearch, selectedVertical, selectedSbu, statusFilter]);

  const reloadProcesses = useCallback(() => {
    setIsLoading(true);
    processApi
      .list({
        page,
        pageSize: 20,
        search: appliedSearch,
        vertical_id: selectedVertical,
        sbu_id: selectedSbu,
        status: statusFilter,
      })
      .then((res) => {
        setProcesses(res.processes || []);
        if (res.meta) setMeta(res.meta);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to retrieve processes from registry.');
        setIsLoading(false);
      });
  }, [page, appliedSearch, selectedVertical, selectedSbu, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleVerticalChange = (vId) => {
    setIsLoading(true);
    setSelectedVertical(vId);
    setSelectedSbu('');
    setPage(1);
  };

  const handleSbuChange = (sId) => {
    setIsLoading(true);
    setSelectedSbu(sId);
    setPage(1);
  };

  const handleStatusChange = (status) => {
    setIsLoading(true);
    setStatusFilter(status);
    setPage(1);
  };

  // AG Grid Column Definitions
  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Process Code',
        field: 'process_code',
        width: 140,
        pinned: 'left',
        cellRenderer: (params) => (
          <div className="flex items-center h-full">
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded">
              {params.value}
            </span>
          </div>
        ),
      },
      {
        headerName: 'Process Name / WPS Code',
        field: 'process_name',
        minWidth: 200,
        flex: 1,
        cellRenderer: (params) => (
          <div className="flex flex-col justify-center h-full">
            <span className="font-semibold text-slate-800 text-xs truncate">
              {params.value || params.data?.wps_code || '—'}
            </span>
            {params.data?.wps_code && params.value && (
              <span className="font-mono text-[10px] text-slate-400">
                WPS: {params.data.wps_code}
              </span>
            )}
          </div>
        ),
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 120,
        cellRenderer: (params) => {
          const val = params.value;
          const style =
            val === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : val === 'TRANSITION'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-100 text-slate-600 border-slate-200';
          return (
            <div className="flex items-center h-full">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style}`}>
                {val}
              </span>
            </div>
          );
        },
      },
      {
        headerName: 'Vertical',
        field: 'vertical_code',
        width: 130,
        valueGetter: (params) => params.data?.vertical_code || params.data?.vertical_name || '—',
        cellRenderer: (params) => (
          <div className="flex items-center h-full">
            <span className="text-xs font-semibold text-slate-700">
              {params.value}
            </span>
          </div>
        ),
      },
      {
        headerName: 'SBU',
        field: 'sbu_code',
        width: 130,
        valueGetter: (params) => params.data?.sbu_code || params.data?.sbu_name || '—',
      },
      {
        headerName: 'Client',
        field: 'client_name',
        width: 140,
        valueGetter: (params) => params.data?.client_name || params.data?.client_type || '—',
      },
      {
        headerName: 'Project Manager (PM)',
        width: 160,
        valueGetter: (params) => params.data?.hierarchy?.pm?.name || '—',
        cellRenderer: (params) => (
          <div className="flex flex-col justify-center h-full">
            <span className="text-xs font-semibold text-slate-800">
              {params.value}
            </span>
            {params.data?.hierarchy?.pm?.ecode && (
              <span className="font-mono text-[10px] text-slate-400">
                {params.data.hierarchy.pm.ecode}
              </span>
            )}
          </div>
        ),
      },
      {
        headerName: 'Account Head',
        width: 140,
        valueGetter: (params) => params.data?.hierarchy?.account_head?.name || '—',
      },
      {
        headerName: 'SBU Head',
        width: 140,
        valueGetter: (params) => params.data?.hierarchy?.sbu_head?.name || '—',
      },
      {
        headerName: 'CBO',
        width: 140,
        valueGetter: (params) => params.data?.hierarchy?.cbo?.name || '—',
      },
      {
        headerName: 'Actions',
        pinned: 'right',
        width: 140,
        cellRenderer: (params) => {
          const caps = params.data?.capabilities || [];
          return (
            <div className="flex items-center space-x-1.5 h-full">
              {/* View Capability Button */}
              {caps.includes('BPMS.PROCESS.VIEW') && (
                <button
                  onClick={() => setSelectedProcess(params.data)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                  title="View Process Details & Hierarchy"
                >
                  <Eye className="w-3 h-3" />
                  <span>Inspect</span>
                </button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: false,
    }),
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                BPMS Process Registry
              </h1>
              <p className="text-xs text-slate-500">
                High-performance server-side AG Grid registry with ABAC ownership scoping & 5-tier governance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={reloadProcesses}
            disabled={isLoading}
            className="p-2.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh process registry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-xs text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Registry Query Failure</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, WPS, or client..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>
        </form>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {['ALL', 'ACTIVE', 'TRANSITION', 'INACTIVE'].map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Vertical Dropdown */}
          <select
            value={selectedVertical}
            onChange={(e) => handleVerticalChange(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Verticals</option>
            {verticals.map((v) => (
              <option key={v.vertical_id} value={v.vertical_id}>
                {v.vertical_code}
              </option>
            ))}
          </select>

          {/* SBU Dropdown */}
          <select
            value={selectedSbu}
            onChange={(e) => handleSbuChange(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All SBUs</option>
            {filteredSBUs.map((s) => (
              <option key={s.sbu_id} value={s.sbu_id}>
                {s.sbu_code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AG Grid Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-800">
            {meta.totalCount} Processes Registered
          </span>
          <span className="text-[11px] text-slate-400">
            Double-click row or click &ldquo;Inspect&rdquo; to view full hierarchy
          </span>
        </div>

        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Querying server-side process registry...</span>
          </div>
        ) : processes.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3 text-slate-400 p-6 text-center">
            <Database className="w-8 h-8 text-slate-300" />
            <span className="text-xs font-medium text-slate-600">
              No processes found matching your criteria.
            </span>
            <p className="text-[11px] text-slate-400 max-w-sm">
              If this is a fresh setup, use the Excel Ingestion screen to upload DummyData.xlsx and commit records.
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate('imports')}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Go to Excel Ingestion
              </button>
            )}
          </div>
        ) : (
          <div className="ag-theme-quartz w-full" style={{ height: '520px' }}>
            <AgGridReact
              ref={gridRef}
              rowData={processes}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowSelection="single"
              onRowDoubleClicked={(e) => setSelectedProcess(e.data)}
              animateRows={false}
              headerHeight={40}
              rowHeight={46}
            />
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {meta.page} of {meta.totalPages} ({meta.totalCount} total processes)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsLoading(true);
                  setPage((p) => Math.max(1, p - 1));
                }}
                disabled={page <= 1}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  setIsLoading(true);
                  setPage((p) => Math.min(meta.totalPages, p + 1));
                }}
                disabled={page >= meta.totalPages}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Process Detail Modal */}
      <ProcessDetailModal
        isOpen={Boolean(selectedProcess)}
        onClose={() => setSelectedProcess(null)}
        process={selectedProcess}
      />
    </div>
  );
}
