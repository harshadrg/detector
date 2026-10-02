import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Download, 
  Search, 
  FilterX, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { processApi, masterApi } from '../../lib/api.js';
import { useAuth } from '../../context/useAuth.js';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { RegisterProcessModal } from './RegisterProcessModal.jsx';

export function ProcessRegistry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreateProcess = hasPermission('BPMS.PROCESS.CREATE');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedVertical, setSelectedVertical] = useState('');
  const [selectedSBU, setSelectedSBU] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedClientType, setSelectedClientType] = useState('ALL');

  const [masters, setMasters] = useState({ verticals: [], sbus: [] });
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Load Verticals & SBUs for filter dropdowns
  useEffect(() => {
    masterApi
      .getAll()
      .then((data) => {
        if (data) {
          setMasters({
            verticals: data.verticals || [],
            sbus: data.sbus || [],
          });
        }
      })
      .catch((err) => {
        console.warn('Could not load master filters:', err.message);
      });
  }, []);

  // Fetch Processes from server
  const { data, isLoading, isFetching, error: fetchError } = useQuery({
    queryKey: [
      'processes',
      page,
      pageSize,
      debouncedSearch,
      selectedVertical,
      selectedSBU,
      selectedStatus,
      selectedClientType,
    ],
    queryFn: () =>
      processApi.list({
        page,
        pageSize,
        search: debouncedSearch,
        vertical_id: selectedVertical || '',
        sbu_id: selectedSBU || '',
        status: selectedStatus,
        client_type: selectedClientType,
      }),
  });

  const processes = useMemo(() => data?.processes || [], [data?.processes]);
  const meta = data?.meta || { totalCount: 0, totalPages: 1 };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setDebouncedSearch(searchQuery);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedVertical('');
    setSelectedSBU('');
    setSelectedStatus('ALL');
    setSelectedClientType('ALL');
    setPage(1);
  };

  const filteredSBUs = selectedVertical
    ? masters.sbus.filter((s) => String(s.vertical_id) === String(selectedVertical))
    : masters.sbus;

  // CSV Export utility
  const handleExportCSV = useCallback(() => {
    if (processes.length === 0) return;

    const headers = [
      'Process Code',
      'WPS Code',
      'Process Name',
      'Client',
      'Client Type',
      'Vertical',
      'SBU',
      'Status',
      'Current PM',
      'Started On',
    ];

    const rows = processes.map((p) => [
      `"${p.process_code || ''}"`,
      `"${p.wps_code || ''}"`,
      `"${(p.process_name || '').replace(/"/g, '""')}"`,
      `"${(p.client_name || '').replace(/"/g, '""')}"`,
      `"${p.client_type || ''}"`,
      `"${p.vertical_code || ''}"`,
      `"${p.sbu_code || ''}"`,
      `"${p.status || ''}"`,
      `"${p.hierarchy?.pm?.name || ''}"`,
      `"${p.started_on ? p.started_on.substring(0, 10) : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `detector-process-registry-page${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processes, page]);

  // AG Grid Column Definitions
  const columnDefs = useMemo(() => [
    {
      headerName: 'Process Code',
      field: 'process_code',
      width: 140,
      pinned: 'left',
      cellRenderer: (params) => (
        <span 
          onClick={() => navigate(`/registry/${params.data?.registry_id}`)}
          className="font-mono font-bold text-primary cursor-pointer hover:underline"
        >
          {params.value}
        </span>
      ),
    },
    {
      headerName: 'WPS Code',
      field: 'wps_code',
      width: 140,
      cellRenderer: (params) => (
        <span className="font-mono text-on-surface-variant">
          {params.value || <span className="text-outline">—</span>}
        </span>
      ),
    },
    {
      headerName: 'Client',
      field: 'client_name',
      width: 170,
      cellRenderer: (params) => params.value || <span className="text-outline">—</span>,
    },
    {
      headerName: 'Process Name',
      field: 'process_name',
      minWidth: 220,
      flex: 1,
      cellRenderer: (params) => (
        <span className="font-medium text-on-surface">
          {params.value}
        </span>
      ),
    },
    {
      headerName: 'Vertical',
      field: 'vertical_code',
      width: 120,
      cellRenderer: (params) => (
        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container text-on-surface border border-outline-variant/30">
          {params.value || '—'}
        </span>
      ),
    },
    {
      headerName: 'SBU',
      field: 'sbu_code',
      width: 120,
      cellRenderer: (params) => (
        <span className="font-mono text-[11px] text-on-surface-variant">
          {params.value || '—'}
        </span>
      ),
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 140,
      cellRenderer: (params) => {
        const status = params.value;
        if (status === 'ACTIVE') {
          return (
            <Badge variant="success">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              ACTIVE
            </Badge>
          );
        }
        if (status === 'TRANSITION') {
          return (
            <Badge variant="warning">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              TRANSITION
            </Badge>
          );
        }
        return (
          <Badge variant="default">
            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
            {status || 'DRAFT'}
          </Badge>
        );
      },
    },
    {
      headerName: 'Current PM',
      valueGetter: (params) => params.data?.hierarchy?.pm?.name || null,
      width: 170,
      cellRenderer: (params) => {
        const pm = params.data?.hierarchy?.pm;
        if (!pm) return <span className="text-outline">—</span>;
        const initials = pm.name ? pm.name.substring(0, 2).toUpperCase() : 'PM';
        return (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-semibold text-[10px] flex items-center justify-center">
              {initials}
            </div>
            <span className="truncate">{pm.name}</span>
          </div>
        );
      },
    },
    {
      headerName: 'Actions',
      pinned: 'right',
      width: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="flex items-center justify-end h-full">
          <button
            type="button"
            onClick={() => navigate(`/registry/${params.data?.registry_id}`)}
            className="px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary-container/40 rounded transition-colors cursor-pointer"
          >
            View
          </button>
        </div>
      ),
    },
  ], [navigate]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl tracking-tight text-on-surface">
            Process Registry
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Canonical approved process records with ownership hierarchy
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            icon={Download}
            disabled={processes.length === 0}
            className="text-xs"
          >
            Export CSV
          </Button>

          {canCreateProcess && (
            <Button
              variant="primary"
              onClick={() => setIsRegisterModalOpen(true)}
              icon={Plus}
              className="text-xs"
            >
              Register Process
            </Button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div 
          role="status" 
          className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {fetchError && (
        <div 
          role="alert" 
          className="p-3.5 rounded-lg bg-error/10 border border-error/20 text-error flex items-center gap-2.5 text-xs font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Failed to load process records: {fetchError.message}</span>
        </div>
      )}

      {/* Filter Bar (matching Stitch specifications) */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-3 shadow-xs flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-grow min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search process code, name, WPS code, client..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-container-low/50 border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface placeholder:text-outline"
          />
        </form>

        {/* Vertical Dropdown */}
        <div className="relative min-w-[130px]">
          <select
            value={selectedVertical}
            onChange={(e) => {
              setSelectedVertical(e.target.value);
              setSelectedSBU('');
              setPage(1);
            }}
            className="w-full text-xs py-1.5 px-2.5 bg-surface-container-low/50 border border-outline-variant/40 rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">All Verticals</option>
            {masters.verticals.map((v) => (
              <option key={v.vertical_id} value={v.vertical_id}>
                {v.vertical_code}
              </option>
            ))}
          </select>
        </div>

        {/* SBU Dropdown */}
        <div className="relative min-w-[120px]">
          <select
            value={selectedSBU}
            onChange={(e) => {
              setSelectedSBU(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs py-1.5 px-2.5 bg-surface-container-low/50 border border-outline-variant/40 rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">All SBUs</option>
            {filteredSBUs.map((s) => (
              <option key={s.sbu_id} value={s.sbu_id}>
                {s.sbu_code}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="relative min-w-[120px]">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs py-1.5 px-2.5 bg-surface-container-low/50 border border-outline-variant/40 rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRANSITION">TRANSITION</option>
            <option value="DRAFT">DRAFT</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        {/* Client Type Dropdown */}
        <div className="relative min-w-[115px]">
          <select
            value={selectedClientType}
            onChange={(e) => {
              setSelectedClientType(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs py-1.5 px-2.5 bg-surface-container-low/50 border border-outline-variant/40 rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="DOMESTIC">DOMESTIC</option>
            <option value="INTERNATIONAL">INTERNATIONAL</option>
          </select>
        </div>

        {/* Clear Filters */}
        <button
          type="button"
          onClick={handleClearFilters}
          className="text-xs text-on-surface-variant hover:text-error transition-colors px-2 py-1.5 flex items-center gap-1 cursor-pointer"
        >
          <FilterX className="w-3.5 h-3.5" />
          <span>Clear filters</span>
        </button>

        {/* Total Count Badge */}
        <div className="ml-auto pl-2 border-l border-outline-variant/30 flex items-center">
          <span className="px-2.5 py-1 text-xs font-mono font-medium bg-surface-container text-on-surface-variant rounded-md">
            {meta.totalCount} Total Records
          </span>
        </div>
      </div>

      {/* AG Grid Table */}
      <DataTable
        rowData={processes}
        columnDefs={columnDefs}
        height="540px"
        loading={isLoading}
      />

      {/* Pagination Bar */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 px-4 py-2.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-on-surface-variant">
          Showing <span className="font-semibold text-on-surface">{processes.length}</span> of{' '}
          <span className="font-semibold text-on-surface">{meta.totalCount}</span> processes (Page{' '}
          <span className="font-semibold text-on-surface">{page}</span> of {meta.totalPages || 1})
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-surface-container-low text-xs font-medium text-on-surface border border-outline-variant/40 rounded px-2 py-1 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              className="px-2 py-1 text-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </Button>
            <Button
              variant="outline"
              className="px-2 py-1 text-xs"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages || isFetching}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Register Process Modal */}
      <RegisterProcessModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onCreated={(proc) => {
          queryClient.invalidateQueries({ queryKey: ['processes'] });
          setActionSuccess(`Process ${proc?.process_code || ''} registered successfully.`);
          setTimeout(() => setActionSuccess(null), 5000);
        }}
      />
    </div>
  );
}

export default ProcessRegistry;
