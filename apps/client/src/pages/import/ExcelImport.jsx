import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { importApi } from '../../lib/api';
import { 
  Download, 
  UploadCloud, 
  Filter, 
  RefreshCw,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Eye,
  Check,
  XCircle,
  Lock
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const passwordSchema = z.object({
  password: z.string().min(1, 'Password is required')
});

function BatchDetails({ batch, onClose }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  
  const { data, isLoading } = useQuery({
    queryKey: ['batch-rows', batch.batch_id, filter],
    queryFn: async () => {
      const res = await importApi.getStagedRows(batch.batch_id, { page: 1, pageSize: 1000, filter });
      return res.data;
    }
  });

  const rows = data?.rows || [];
  
  // Filter locally for now
  const displayRows = filter === 'ALL' ? rows : rows.filter(r => r.match_status === filter);
  
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === displayRows.filter(r => r.is_valid && r.match_status !== 'EXISTING_EXACT').length) {
      setSelectedIds(new Set());
    } else {
      const allValidIds = displayRows.filter(r => r.is_valid && r.match_status !== 'EXISTING_EXACT').map(r => r.staging_row_id);
      setSelectedIds(new Set(allValidIds));
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  const commitMutation = useMutation({
    mutationFn: async ({ password }) => {
      const confirmed_row_ids = Array.from(selectedIds);
      await importApi.commitBatch(batch.batch_id, { password, confirmed_row_ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['import-batches']);
      setIsCommitModalOpen(false);
      onClose();
    },
    onError: (error) => {
      alert(error.response?.data?.error?.message || 'Failed to commit batch');
    }
  });

  const onConfirmCommit = (data) => {
    commitMutation.mutate({ password: data.password });
  };

  return (
    <div className="bg-surface-container rounded-b-xl border border-t-0 border-outline-variant p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-on-surface">Staging Preview</h3>
        <div className="flex space-x-2">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs bg-surface-container-lowest border border-outline-variant rounded-md px-2 py-1 text-on-surface focus:outline-none"
          >
            <option value="ALL">All Rows</option>
            <option value="NEW">New (Valid)</option>
            <option value="DIFFERENCE">Differences (Valid)</option>
            <option value="EXISTING_EXACT">Existing Exact</option>
          </select>
          <Button 
            variant="primary" 
            size="sm" 
            disabled={selectedIds.size === 0 || batch.status === 'COMMITTED'}
            onClick={() => setIsCommitModalOpen(true)}
          >
            Commit Selected ({selectedIds.size})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-xs text-on-surface-variant">Loading staging rows...</div>
      ) : (
        <div className="max-h-96 overflow-y-auto border border-outline-variant rounded-md bg-surface-container-lowest">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-container sticky top-0 border-b border-outline-variant">
              <tr>
                <th className="px-3 py-2 w-10">
                  <input 
                    type="checkbox" 
                    checked={displayRows.length > 0 && selectedIds.size === displayRows.filter(r => r.is_valid && r.match_status !== 'EXISTING_EXACT').length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-3 py-2">Row</th>
                <th className="px-3 py-2">Match Status</th>
                <th className="px-3 py-2">WPS Code</th>
                <th className="px-3 py-2">Process Name</th>
                <th className="px-3 py-2">Diff Summary</th>
                <th className="px-3 py-2">Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {displayRows.map(row => (
                <tr key={row.staging_row_id} className={row.is_valid ? '' : 'bg-error-container/20'}>
                  <td className="px-3 py-2">
                    {row.is_valid && row.match_status !== 'EXISTING_EXACT' && (
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(row.staging_row_id)}
                        onChange={() => toggleSelectRow(row.staging_row_id)}
                        disabled={batch.status === 'COMMITTED'}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">{row.row_number}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] uppercase ${
                      row.match_status === 'NEW' ? 'bg-emerald-100 text-emerald-800' :
                      row.match_status === 'DIFFERENCE' ? 'bg-amber-100 text-amber-800' :
                      row.match_status === 'EXISTING_EXACT' ? 'bg-gray-200 text-gray-700' : 'bg-surface-container-high'
                    }`}>
                      {row.match_status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono">{row.normalized?.wps_code || '-'}</td>
                  <td className="px-3 py-2 truncate max-w-[150px]" title={row.normalized?.process_name}>{row.normalized?.process_name || '-'}</td>
                  <td className="px-3 py-2 text-[10px]">
                    {row.diff_summary ? (
                      <ul className="list-disc pl-3">
                        {row.diff_summary.map((d, i) => (
                          <li key={i}>{d.field}: {d.old} &rarr; {d.new}</li>
                        ))}
                      </ul>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 text-[10px]">
                    {row.is_valid ? (
                      <span className="text-emerald-600 flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Valid</span>
                    ) : (
                      <span className="text-error flex items-center" title={row.errors?.join(', ')}><AlertCircle className="w-3 h-3 mr-1"/> Invalid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isCommitModalOpen}
        onClose={() => {
          setIsCommitModalOpen(false);
          reset();
        }}
        title="Security Confirmation"
      >
        <div className="p-1 mb-4 flex items-start gap-3 rounded-lg bg-error-container text-on-error-container p-3">
          <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">High-Risk Action</p>
            <p>You are about to commit {selectedIds.size} rows into the live BPMS registry. This action cannot be undone.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onConfirmCommit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface">Administrator Password</label>
            <input
              type="password"
              {...register('password')}
              className="block w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-xs text-on-surface border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              placeholder="Confirm your password to proceed"
            />
            {errors.password && <p className="text-[10px] text-error">{errors.password.message}</p>}
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsCommitModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={commitMutation.isPending}>
              {commitMutation.isPending ? 'Committing...' : 'Commit Batch'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function ExcelImport() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [expandedBatchId, setExpandedBatchId] = useState(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['import-batches', page, pageSize],
    queryFn: async () => {
      const res = await importApi.listBatches({ page, pageSize });
      return res.data;
    },
    keepPreviousData: true
  });

  const batches = data?.batches || [];
  const meta = data?.meta || { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMMITTED': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'VALIDATED_WITH_ERRORS': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'READY_TO_COMMIT': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'VALIDATING': return 'bg-surface-container-high text-on-surface-variant border-outline-variant';
      default: return 'bg-surface-container text-on-surface border-outline-variant';
    }
  };

  const toggleBatch = (batchId) => {
    setExpandedBatchId(expandedBatchId === batchId ? null : batchId);
  };

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Data Pipeline</h1>
          <p className="text-sm text-on-surface-variant mt-1.5">Import, validate, and manage batch data ingestion securely.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center px-4 py-2 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant text-on-surface text-xs font-semibold rounded-lg shadow-sm transition-colors duration-150">
            <Download className="w-4 h-4 mr-2 text-primary" />
            Download Template
          </button>
        </div>
      </div>

      <section aria-labelledby="upload-zone-heading">
        <div className="border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-lowest hover:bg-surface-container-low transition-colors duration-200 rounded-xl p-8 flex flex-col items-center justify-center text-center group cursor-pointer">
          <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center text-primary mb-3.5 group-hover:scale-105 transition-transform duration-150">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-on-surface mb-1" id="upload-zone-heading">Drag and drop your .xlsx file here</h2>
          <p className="text-xs text-on-surface-variant mb-3">or</p>
          <button className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold rounded-lg border border-outline-variant shadow-sm transition-colors duration-150 mb-3" type="button">
            Browse Files
          </button>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-[11px] text-on-surface-variant">
            <span>Max 10MB, .xlsx format</span>
            <span className="hidden sm:inline text-outline-variant">•</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-primary font-medium border border-outline-variant/50">Schema: v4.2 Process Registry Canonical Format</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="batches-table-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-on-surface" id="batches-table-heading">Import Batches</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-secondary-container text-on-secondary-container">{meta.totalCount} total</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
              <select className="pl-8 pr-7 py-1 text-xs bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary appearance-none">
                <option>All Statuses</option>
              </select>
            </div>
            <button 
              onClick={() => refetch()}
              className="p-1.5 border border-outline-variant bg-surface-container-lowest hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors" 
              title="Refresh batches"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant text-on-surface-variant font-semibold">
                  <th className="py-2.5 px-4 w-10"></th>
                  <th className="py-2.5 px-4">Batch ID</th>
                  <th className="py-2.5 px-4">File Name</th>
                  <th className="py-2.5 px-4">Uploaded By</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Total Rows</th>
                  <th className="py-2.5 px-4 text-right">Valid</th>
                  <th className="py-2.5 px-4 text-right">Errors</th>
                  <th className="py-2.5 px-4">Uploaded At</th>
                  <th className="py-2.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 font-body text-on-surface">
                {isLoading ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-on-surface-variant text-sm">
                      Loading import batches...
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-on-surface-variant text-sm">
                      No import batches found.
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <React.Fragment key={batch.batch_id}>
                      <tr className={`hover:bg-surface-container/30 transition-colors ${expandedBatchId === batch.batch_id ? 'bg-surface-container/30' : ''}`}>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => toggleBatch(batch.batch_id)} className="p-1 rounded hover:bg-surface-container-high transition-colors text-outline">
                            {expandedBatchId === batch.batch_id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-primary">{batch.batch_id}</td>
                        <td className="py-3 px-4 truncate max-w-[150px]">{batch.original_filename}</td>
                        <td className="py-3 px-4">{batch.uploaded_by}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${getStatusColor(batch.status)}`}>
                            {batch.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{batch.total_rows}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600">{batch.valid_rows}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600">{batch.error_rows}</td>
                        <td className="py-3 px-4">{new Date(batch.created_at).toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => toggleBatch(batch.batch_id)} className="text-primary hover:underline font-semibold text-[11px]">
                            {expandedBatchId === batch.batch_id ? 'Hide Details' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                      {expandedBatchId === batch.batch_id && (
                        <tr>
                          <td colSpan="10" className="p-0 border-b border-outline-variant">
                            <BatchDetails batch={batch} onClose={() => refetch()} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 bg-surface-container border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
            <span>Showing {batches.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, meta.totalCount)} of {meta.totalCount} import batches</span>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-2 py-1 rounded border border-outline-variant/60 bg-surface-container-lowest text-outline hover:bg-surface-container disabled:opacity-50" 
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(page + 1)}
                disabled={page >= meta.totalPages}
                className="px-2 py-1 rounded border border-outline-variant/60 bg-surface-container-lowest text-outline hover:bg-surface-container disabled:opacity-50" 
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
