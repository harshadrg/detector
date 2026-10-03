import { useState } from 'react';
import { 
  Download, 
  UploadCloud, 
  Filter, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown, 
  AlertCircle, 
  Check 
} from 'lucide-react';

export function ExcelImport() {
  const [expandedBatchId, setExpandedBatchId] = useState('B-002');

  const toggleBatch = (batchId) => {
    setExpandedBatchId(expandedBatchId === batchId ? null : batchId);
  };

  return (
    <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline tracking-tight text-on-surface">Excel Import</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Staged spreadsheet migration pipeline</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-xs text-on-surface-variant font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
            Ingestion Engine: Online
          </div>
          <button className="inline-flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold bg-surface-container-lowest border border-outline-variant hover:bg-surface-container rounded-lg text-primary shadow-sm transition-colors duration-150">
            <Download className="w-4 h-4" />
            <span>Download Template (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Pipeline Stepper / Guidance Banner */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Step 1 */}
          <div className="flex items-start space-x-3">
            <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-on-surface">Step 1: Upload File</div>
              <div className="text-[11px] text-on-surface-variant mt-0.5">Drag-and-drop standard canonical Excel template for automated parser parsing.</div>
            </div>
          </div>
          {/* Step 2 */}
          <div className="flex items-start space-x-3 border-t md:border-t-0 md:border-l border-outline-variant/60 pt-3 md:pt-0 md:pl-4">
            <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container border border-primary/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-primary">Step 2: Validation & Staging Preview</div>
              <div className="text-[11px] text-on-surface-variant mt-0.5">Master entity verification, schema checks, and relational constraint validation.</div>
            </div>
          </div>
          {/* Step 3 */}
          <div className="flex items-start space-x-3 border-t md:border-t-0 md:border-l border-outline-variant/60 pt-3 md:pt-0 md:pl-4">
            <div className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              3
            </div>
            <div>
              <div className="text-xs font-semibold text-on-surface-variant">Step 3: Atomic Commit to Registry</div>
              <div className="text-[11px] text-outline mt-0.5">Transaction safe execution into canonical Process Registry with full audit logging.</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Upload Zone */}
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

      {/* SECTION 2: Import Batch History & Staging Preview */}
      <section aria-labelledby="batches-table-heading" className="space-y-4">
        {/* Batches Section Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-on-surface" id="batches-table-heading">Import Batches</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-secondary-container text-on-secondary-container">0 total</span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Filter Bar */}
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
              <select className="pl-8 pr-7 py-1 text-xs bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary appearance-none">
                <option>All Statuses</option>
                <option>Committed</option>
                <option>Validated with Errors</option>
                <option>Ready to Commit</option>
              </select>
            </div>
            <button className="p-1.5 border border-outline-variant bg-surface-container-lowest hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors" title="Refresh batches">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Batches Table Container */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant text-on-surface-variant font-semibold">
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
              <tbody className="divide-y divide-outline-variant/60 font-body">
                {/* TODO: Phase 7 - Fetch import batches from the ingestion engine API */}
                <tr>
                  <td colSpan="9" className="py-8 text-center text-on-surface-variant text-sm">
                    No import batches found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination/Status */}
          <div className="px-4 py-2.5 bg-surface-container border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
            <span>Showing 0 of 0 import batches</span>
            <div className="flex items-center space-x-1">
              <button className="px-2 py-1 rounded border border-outline-variant/60 bg-surface-container-lowest text-outline" disabled>Previous</button>
              <button className="px-2 py-1 rounded border border-outline-variant/60 bg-surface-container-lowest text-outline" disabled>Next</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
