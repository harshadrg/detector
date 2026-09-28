import { useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import {
  ShieldCheck,
  CheckCircle2,
  FileEdit,
  Send,
  Check,
  ArrowRightLeft,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

export function CapabilityPreview() {
  const { user, permissions, activeContextRole, hasPermission } = useAuth();
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Sample process records representing different ownership scenarios
  const sampleProcesses = [
    {
      registry_id: 101,
      process_code: 'PRC-0001',
      process_name: 'Core Banking Payment Processing',
      vertical_name: 'BFSI',
      sbu_name: 'BFSI-NORTH',
      status: 'ACTIVE',
      pm_ecode: 'ADMIN001', // Assigned to current user
      owners: [
        { role_type: 'CBO', employee_ecode: 'SAMEER_C' },
        { role_type: 'SBU_HEAD', employee_ecode: 'SAURABH_F' },
        { role_type: 'ACCOUNT_HEAD', employee_ecode: 'POOJA_G' },
        { role_type: 'PM', employee_ecode: 'ADMIN001' },
      ],
    },
    {
      registry_id: 102,
      process_code: 'PRC-0042',
      process_name: 'Healthcare Claim Adjudication',
      vertical_name: 'HEALTHCARE',
      sbu_name: 'HEALTH-US',
      status: 'ACTIVE',
      pm_ecode: 'RARATA_H', // Assigned to another PM
      owners: [
        { role_type: 'CBO', employee_ecode: 'NIKHIL_C' },
        { role_type: 'SBU_HEAD', employee_ecode: 'SCARLETT_F' },
        { role_type: 'ACCOUNT_HEAD', employee_ecode: 'DANIEL_G' },
        { role_type: 'PM', employee_ecode: 'RARATA_H' },
      ],
    },
  ];

  // Helper function simulating row-level capability resolver on client
  const computeRowCapabilities = (process) => {
    const isGlobal =
      hasPermission('BPMS.PROCESS.CREATE') ||
      hasPermission('CORE.USER.MANAGE') ||
      hasPermission('CORE.ROLE.ASSIGN_ADMIN');

    const isPM = process.pm_ecode === user?.ecode;
    const isHierarchy = process.owners.some((o) => o.employee_ecode === user?.ecode);

    const caps = [];

    if (hasPermission('BPMS.PROCESS.VIEW')) {
      if (isGlobal || isHierarchy || isPM) caps.push('BPMS.PROCESS.VIEW');
    }
    if (hasPermission('BPMS.CHANGE_REQUEST.DRAFT') && (isGlobal || isPM)) {
      caps.push('BPMS.CHANGE_REQUEST.DRAFT');
    }
    if (hasPermission('BPMS.CHANGE_REQUEST.SUBMIT') && (isGlobal || isPM)) {
      caps.push('BPMS.CHANGE_REQUEST.SUBMIT');
    }
    if (hasPermission('BPMS.CHANGE_REQUEST.APPROVE') && isGlobal) {
      caps.push('BPMS.CHANGE_REQUEST.APPROVE');
    }
    if (hasPermission('BPMS.HANDOVER.REQUEST') && (isGlobal || isPM || isHierarchy)) {
      caps.push('BPMS.HANDOVER.REQUEST');
    }
    if (hasPermission('BPMS.PROCESS.DEACTIVATE_REQUEST') && (isGlobal || isPM || isHierarchy)) {
      caps.push('BPMS.PROCESS.DEACTIVATE_REQUEST');
    }

    return caps;
  };

  const handleActionClick = (capability, processCode) => {
    setFeedbackMessage(
      `Triggered action authorized by [${capability}] on ${processCode}. Verified by row capability!`
    );
    setTimeout(() => setFeedbackMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Capability Engine Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 mt-1">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Centralized Authorization Engine (RBAC + ABAC)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                The UI renders strictly from resolved capabilities. Action buttons, review queues,
                and edit forms adapt dynamically as you switch roles via the top bar.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Context
            </span>
            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 inline-block mt-1">
              {activeContextRole ? `Simulating ${activeContextRole}` : 'Real Platform Identity'}
            </span>
          </div>
        </div>

        {feedbackMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* Row-Level Capabilities Demonstration Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Row-Level Capability Resolution on Process Records
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Compare how button actions adapt based on whether you are the assigned PM, an executive, or simulating a role.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>No hardcoded role strings in buttons</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {sampleProcesses.map((proc) => {
            const rowCapabilities = computeRowCapabilities(proc);
            const isAssignedToUser = proc.pm_ecode === user?.ecode;

            return (
              <div key={proc.process_code} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded">
                        {proc.process_code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {proc.process_name}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {proc.status}
                      </span>
                      {isAssignedToUser && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Assigned to You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-500">
                      <span>Vertical: <strong className="text-slate-700">{proc.vertical_name}</strong></span>
                      <span>•</span>
                      <span>SBU: <strong className="text-slate-700">{proc.sbu_name}</strong></span>
                      <span>•</span>
                      <span>Operational PM: <strong className="text-slate-700">{proc.pm_ecode}</strong></span>
                    </div>
                  </div>

                  {/* Resolved Action Triggers (Strictly from rowCapabilities) */}
                  <div className="flex flex-wrap items-center gap-2">
                    {rowCapabilities.includes('BPMS.CHANGE_REQUEST.DRAFT') && (
                      <button
                        onClick={() => handleActionClick('BPMS.CHANGE_REQUEST.DRAFT', proc.process_code)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        <FileEdit className="w-3.5 h-3.5 text-slate-500" />
                        <span>Draft Edit</span>
                      </button>
                    )}

                    {rowCapabilities.includes('BPMS.CHANGE_REQUEST.SUBMIT') && (
                      <button
                        onClick={() => handleActionClick('BPMS.CHANGE_REQUEST.SUBMIT', proc.process_code)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Submit Change</span>
                      </button>
                    )}

                    {rowCapabilities.includes('BPMS.CHANGE_REQUEST.APPROVE') && (
                      <button
                        onClick={() => handleActionClick('BPMS.CHANGE_REQUEST.APPROVE', proc.process_code)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Changes</span>
                      </button>
                    )}

                    {rowCapabilities.includes('BPMS.HANDOVER.REQUEST') && (
                      <button
                        onClick={() => handleActionClick('BPMS.HANDOVER.REQUEST', proc.process_code)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                        <span>Request Handover</span>
                      </button>
                    )}

                    {rowCapabilities.includes('BPMS.PROCESS.DEACTIVATE_REQUEST') && (
                      <button
                        onClick={() => handleActionClick('BPMS.PROCESS.DEACTIVATE_REQUEST', proc.process_code)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Deactivate</span>
                      </button>
                    )}

                    {rowCapabilities.length === 0 && (
                      <span className="text-xs text-slate-400 italic flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Read-only / No operational capability</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges of Computed Capabilities */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="font-semibold text-slate-400 mr-1">
                    Row Capabilities ({rowCapabilities.length}):
                  </span>
                  {rowCapabilities.map((cap) => (
                    <span
                      key={cap}
                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Ledger Pill List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          Effective Granted Permissions ({permissions.length})
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          All API authorization checks and client navigations rely strictly on these resolved tokens.
        </p>

        <div className="flex flex-wrap gap-1.5">
          {permissions.map((perm) => (
            <span
              key={perm}
              className={`font-mono text-[11px] px-2.5 py-1 rounded-lg border ${
                perm.startsWith('CORE.')
                  ? 'bg-purple-50/70 text-purple-700 border-purple-200/80'
                  : 'bg-blue-50/70 text-blue-700 border-blue-200/80'
              }`}
            >
              {perm}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
