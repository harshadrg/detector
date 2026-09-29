import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { importApi } from '../../lib/api.js';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Check,
  AlertCircle,
  Database,
  FileCheck,
} from 'lucide-react';

export function ExcelIngestion() {
  const { hasPermission } = useAuth();
  const canStage = hasPermission('BPMS.IMPORT.STAGE');
  const canCommit = hasPermission('BPMS.IMPORT.COMMIT');

  // State
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [rows, setRows] = useState([]);
  const [rowMeta, setRowMeta] = useState({ page: 1, pageSize: 20, totalCount: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [rowFilter, setRowFilter] = useState('ALL'); // ALL | VALID | ERROR

  // Loading & Error states
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [commitSuccess, setCommitSuccess] = useState(null);
  const [showCommitModal, setShowCommitModal] = useState(false);

  const fileInputRef = useRef(null);

  // Initial load of batch list
  useEffect(() => {
    let isMounted = true;
    async function initBatches() {
      try {
        const data = await importApi.listBatches({ page: 1, pageSize: 20 });
        if (isMounted) {
          const batchList = data.batches || [];
          setBatches(batchList);
          if (batchList.length > 0) {
            setSelectedBatchId(batchList[0].batch_id);
          }
        }
      } catch (err) {
        console.warn('Failed to load import batches:', err.message);
      }
    }

    initBatches();

    return () => {
      isMounted = false;
    };
  }, []);

  // Reload details and staged rows when selectedBatchId or filters change
  useEffect(() => {
    if (!selectedBatchId) return;

    let isMounted = true;

    async function loadData() {
      try {
        const [batchRes, rowsRes] = await Promise.all([
          importApi.getBatch(selectedBatchId),
          importApi.getStagedRows(selectedBatchId, { page, pageSize: 20, filter: rowFilter }),
        ]);
        if (isMounted) {
          setBatchDetails(batchRes.batch || null);
          setRows(rowsRes.rows || []);
          if (rowsRes.meta) {
            setRowMeta(rowsRes.meta);
          }
          setIsLoadingRows(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to load batch rows:', err.message);
          setIsLoadingRows(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedBatchId, page, rowFilter]);

  // Refresh Batches list helper
  const refreshBatches = useCallback(async () => {
    try {
      const data = await importApi.listBatches({ page: 1, pageSize: 20 });
      setBatches(data.batches || []);
    } catch {
      // Ignore
    }
  }, []);

  // Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setCommitSuccess(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await importApi.stageUpload(formData);
      await refreshBatches();
      setSelectedBatchId(result.batchId);
      setIsLoadingRows(true);
      setPage(1);
      setRowFilter('ALL');
    } catch (err) {
      setUploadError(err.message || 'Spreadsheet upload and staging failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Batch Commit
  const handleConfirmCommit = async () => {
    if (!selectedBatchId || !canCommit) return;
    setIsCommitting(true);
    setUploadError('');

    try {
      const result = await importApi.commitBatch(selectedBatchId);
      setCommitSuccess(result);
      setShowCommitModal(false);

      // Refresh batch and rows
      await refreshBatches();
      const batchRes = await importApi.getBatch(selectedBatchId);
      setBatchDetails(batchRes.batch || null);
    } catch (err) {
      setUploadError(err.message || 'Batch commit failed.');
    } finally {
      setIsCommitting(false);
    }
  };

  const isCommitted = batchDetails?.status === 'COMMITTED';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Staged Excel Ingestion Pipeline
              </h1>
              <p className="text-xs text-slate-500">
                Upload, normalize, and validate legacy process spreadsheets with transactional batch commit
              </p>
            </div>
          </div>
        </div>

        {/* Upload Trigger Button */}
        {canStage && (
          <div className="flex items-center space-x-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Staging & Validating...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Stage New Spreadsheet</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-xs text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Import Validation Failure</span>
            <span>{uploadError}</span>
          </div>
        </div>
      )}

      {/* Commit Success Banner */}
      {commitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Transactional Batch Commit Successful!</span>
            <span>
              Successfully created {commitSuccess.committedCount} canonical records in{' '}
              <strong className="font-mono">dbo.Process_Registry</strong> with 5-tier ownership in{' '}
              <strong className="font-mono">dbo.Process_Ownership</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Batch Selector & Status Toolbar */}
      {batches.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-700">Active Batch:</span>
            <select
              value={selectedBatchId || ''}
              onChange={(e) => {
                const nextId = Number(e.target.value);
                setSelectedBatchId(nextId);
                setIsLoadingRows(true);
                setPage(1);
                setRowFilter('ALL');
                setCommitSuccess(null);
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  Batch #{b.batch_id}: {b.file_name} ({b.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={refreshBatches}
              className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh Batches"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {batchDetails && !isCommitted && batchDetails.valid_rows > 0 && canCommit && (
              <button
                onClick={() => setShowCommitModal(true)}
                disabled={isCommitting}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Commit Valid Rows to Registry ({batchDetails.valid_rows})</span>
              </button>
            )}

            {isCommitted && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <FileCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Committed to Registry
              </span>
            )}
          </div>
        </div>
      )}

      {/* Batch Stats KPI Cards */}
      {batchDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Rows Parsed
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {batchDetails.total_rows}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
              {batchDetails.file_name}
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Valid Rows
            </span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              {batchDetails.valid_rows}
            </span>
            <span className="text-[11px] text-emerald-600/80 mt-0.5 block">
              {Math.round((batchDetails.valid_rows / (batchDetails.total_rows || 1)) * 100)}% validated cleanly
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
              Validation Errors
            </span>
            <span className="text-2xl font-bold text-rose-700 mt-1 block">
              {batchDetails.error_rows}
            </span>
            <span className="text-[11px] text-rose-600/80 mt-0.5 block">
              {batchDetails.error_rows === 0 ? 'Zero errors detected' : 'Requires data correction'}
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Batch Status
            </span>
            <span
              className={`text-xs font-bold inline-block px-2.5 py-1 rounded-md mt-2 ${
                batchDetails.status === 'COMMITTED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : batchDetails.status === 'READY_TO_COMMIT'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {batchDetails.status}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              By {batchDetails.uploaded_by_name || batchDetails.uploaded_by}
            </span>
          </div>
        </div>
      )}

      {/* Staged Rows Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {/* Table Filters Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Staged Rows Preview
            </span>
            {batchDetails && (
              <span className="text-xs font-mono text-slate-500">
                ({rowMeta.totalCount} rows displayed)
              </span>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All Rows' },
              { id: 'VALID', label: `Valid (${batchDetails?.valid_rows || 0})` },
              { id: 'ERROR', label: `Errors (${batchDetails?.error_rows || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setRowFilter(tab.id);
                  setIsLoadingRows(true);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  rowFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {isLoadingRows ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Loading staged spreadsheet rows...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            {batches.length === 0
              ? 'No spreadsheets have been uploaded yet. Upload DummyData.xlsx to begin.'
              : 'No rows match the selected filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Row #</th>
                  <th className="py-3 px-4">Validation</th>
                  <th className="py-3 px-4">Vertical</th>
                  <th className="py-3 px-4">SBU</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Hierarchy (Ops / CBO / SBU Head / Account / PM)</th>
                  <th className="py-3 px-4">Validation Errors & Sentinels</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rows.map((row) => (
                  <tr key={row.staging_row_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">
                      #{row.row_number}
                    </td>

                    <td className="py-3 px-4">
                      {row.is_valid ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                          Error
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {row.normalized.vertical_code || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {row.normalized.sbu_code || '—'}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          row.normalized.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : row.normalized.status === 'TRANSITION'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.normalized.status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-0.5 text-[11px]">
                        <span>
                          <strong className="text-slate-400">Ops:</strong>{' '}
                          {row.normalized.ops_head_name || '—'}
                        </span>
                        <span>
                          <strong className="text-slate-400">CBO:</strong>{' '}
                          {row.normalized.cbo_name || '—'}
                        </span>
                        <span>
                          <strong className="text-slate-400">SBU Head:</strong>{' '}
                          {row.normalized.sbu_head_name || '—'}
                        </span>
                        <span>
                          <strong className="text-slate-400">Account:</strong>{' '}
                          {row.normalized.account_head_name || '—'}
                        </span>
                        <span>
                          <strong className="text-indigo-600">PM:</strong>{' '}
                          {row.normalized.pm_name || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {row.errors && row.errors.length > 0 ? (
                        <div className="space-y-1">
                          {row.errors.map((err, idx) => (
                            <span
                              key={idx}
                              className="inline-block text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-0.5 mr-1"
                            >
                              {err}
                            </span>
                          ))}
                        </div>
                      ) : row.normalized.status_reason ? (
                        <span className="text-[11px] text-amber-700 font-mono">
                          {row.normalized.status_reason}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {rowMeta.totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {rowMeta.page} of {rowMeta.totalPages} ({rowMeta.totalCount} total rows)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsLoadingRows(true);
                  setPage((p) => Math.max(1, p - 1));
                }}
                disabled={page <= 1}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  setIsLoadingRows(true);
                  setPage((p) => Math.min(rowMeta.totalPages, p + 1));
                }}
                disabled={page >= rowMeta.totalPages}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Commit Confirmation Modal */}
      {showCommitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Confirm Transactional Batch Commit
                </h3>
                <p className="text-[11px] text-slate-500">
                  Target: Batch #{batchDetails?.batch_id} ({batchDetails?.file_name})
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                You are about to commit{' '}
                <strong className="text-emerald-700 font-bold">
                  {batchDetails?.valid_rows} validated spreadsheet rows
                </strong>{' '}
                into the live canonical registry.
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
                <div className="font-semibold text-slate-800">What happens during this transaction:</div>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                  <li>
                    Generates sequential canonical identifiers (<code className="font-mono text-indigo-600">PRC-0001</code>...) in{' '}
                    <code className="font-mono">dbo.Process_Registry</code>.
                  </li>
                  <li>
                    Establishes initial 5-tier ownership hierarchy in{' '}
                    <code className="font-mono">dbo.Process_Ownership</code> with source <code className="font-mono">INITIAL_MIGRATION</code>.
                  </li>
                  <li>Records verifiable event in platform immutable audit ledger (<code className="font-mono">dbo.Audit_Events</code>).</li>
                  <li>Dispatches completion notification to your notification feed.</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowCommitModal(false)}
                disabled={isCommitting}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCommit}
                disabled={isCommitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
              >
                {isCommitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Committing Transaction...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Execute Commit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
