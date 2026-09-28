import { useState } from 'react';
import { employeeApi } from '../../lib/api.js';
import {
  X,
  AlertTriangle,
  UserX,
  ShieldAlert,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export function DeactivationGuardModal({
  isOpen,
  onClose,
  employee,
  onStatusUpdated,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!isOpen || !employee) return null;

  const hasActiveProcesses = (employee.activeProcessCount || 0) > 0;

  const handleConfirmDeactivation = async () => {
    setIsSubmitting(true);
    setServerError('');

    try {
      await employeeApi.updateStatus(employee.ecode, 'INACTIVE');
      if (onStatusUpdated) {
        onStatusUpdated();
      }
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to deactivate employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Confirm Employee Deactivation
              </h3>
              <p className="text-[11px] text-slate-500">
                Target: <span className="font-semibold text-slate-800">{employee.name}</span> ({employee.ecode})
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

        {/* Error Alert */}
        {serverError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Warning Content */}
        <div className="py-4 space-y-4">
          {hasActiveProcesses ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
              <div className="flex items-center space-x-2 text-amber-800 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Offboarding Safeguard: Active Process Ownerships Detected</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                This employee is currently registered as the active operational owner for{' '}
                <span className="font-bold underline">
                  {employee.activeProcessCount} active or transitioning process(es)
                </span>{' '}
                in the BPMS Registry.
              </p>
              <div className="p-3 bg-amber-100/60 rounded-lg text-[11px] text-amber-950 font-medium">
                Deactivating will revoke all active platform sessions immediately. However, process
                ownerships remain assigned until re-allocated via a formal PM Handover or Change
                Request.
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <p className="text-xs text-slate-700 leading-relaxed">
                Are you sure you want to deactivate{' '}
                <span className="font-semibold text-slate-900">{employee.name}</span>?
              </p>
              <p className="text-[11px] text-slate-500">
                This employee has no active process ownerships. Deactivating will immediately
                revoke authentication credentials and invalidate any existing JWT sessions.
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Session invalidation is enforced immediately via identity token-version incrementation.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmDeactivation}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deactivating...</span>
              </>
            ) : (
              <span>Confirm Deactivation</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
