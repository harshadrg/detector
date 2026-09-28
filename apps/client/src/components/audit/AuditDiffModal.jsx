import { useState } from 'react';
import {
  X,
  ScrollText,
  User,
  Copy,
  Check,
  Calendar,
  Layers,
  FileCode,
} from 'lucide-react';

export function AuditDiffModal({ isOpen, onClose, event }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !event) return null;

  const handleCopyCorrelationId = () => {
    if (event.correlation_id) {
      navigator.clipboard.writeText(event.correlation_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasPrevious = !!event.previous_data_parsed;
  const hasUpdated = !!event.updated_data_parsed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">{event.action}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {event.module_code}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  ID: #{event.event_id}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Target Entity:{' '}
                <span className="font-semibold text-slate-700">
                  {event.entity_type} • {event.entity_id}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Event Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 border-b border-slate-100 text-xs">
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] mb-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">Performed By</span>
            </div>
            <div className="font-semibold text-slate-900">
              {event.performer_name || event.performed_by}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {event.performed_by}
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] mb-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">Acting Context</span>
            </div>
            <div>
              {event.acting_context ? (
                <span className="inline-flex items-center text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Simulated ({event.acting_context})
                </span>
              ) : (
                <span className="text-slate-600 font-medium">Direct Execution</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Recorded in immutable ledger
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">Timestamp (UTC)</span>
            </div>
            <div className="font-medium text-slate-800">
              {new Date(event.created_at).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">
              {new Date(event.created_at).toISOString()}
            </div>
          </div>
        </div>

        {/* Correlation ID & Remarks */}
        <div className="py-3 space-y-2 text-xs">
          {event.correlation_id && (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="flex items-center space-x-2 truncate">
                <span className="text-[11px] font-semibold text-slate-500">
                  Correlation ID:
                </span>
                <span className="font-mono text-[11px] text-slate-700 truncate">
                  {event.correlation_id}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCorrelationId}
                className="p-1 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 ml-2"
                title="Copy Correlation ID"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {event.remarks && (
            <div className="p-2.5 bg-amber-50/60 border border-amber-200/70 rounded-xl text-slate-700">
              <span className="font-semibold text-amber-900 text-[11px] block mb-0.5">
                Remarks / Audit Note:
              </span>
              <p className="text-xs">{event.remarks}</p>
            </div>
          )}
        </div>

        {/* Data Diffs / Payload Inspection */}
        <div className="flex-1 overflow-y-auto py-2 space-y-3">
          <div className="flex items-center space-x-1.5 text-slate-700 font-semibold text-xs mb-1">
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>State Diff & Payload Inspection</span>
          </div>

          <div
            className={`grid gap-3 ${
              hasPrevious && hasUpdated ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {/* Previous Data */}
            {hasPrevious && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span>Previous State</span>
                  <span className="text-[10px] text-slate-400">Snapshot before mutation</span>
                </div>
                <pre className="p-3 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-60 leading-relaxed bg-white">
                  {typeof event.previous_data_parsed === 'object'
                    ? JSON.stringify(event.previous_data_parsed, null, 2)
                    : event.previous_data_parsed}
                </pre>
              </div>
            )}

            {/* Updated Data */}
            {hasUpdated && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <div className="px-3 py-1.5 bg-indigo-50 border-b border-indigo-100 text-[11px] font-semibold text-indigo-800 flex items-center justify-between">
                  <span>Updated / Committed State</span>
                  <span className="text-[10px] text-indigo-500">Post-execution</span>
                </div>
                <pre className="p-3 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-60 leading-relaxed bg-white">
                  {typeof event.updated_data_parsed === 'object'
                    ? JSON.stringify(event.updated_data_parsed, null, 2)
                    : event.updated_data_parsed}
                </pre>
              </div>
            )}

            {!hasPrevious && !hasUpdated && (
              <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                No payload state recorded for this event.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Immutable platform ledger • Append-only trigger protected
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
