import { useState, useEffect } from 'react';
import { processApi, auditApi } from '../../lib/api.js';
import {
  ArrowLeft,
  GitBranch,
  Users,
  Key,
  History,
  FileEdit,
  Activity,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { ProcessChangeRequestForm } from './ProcessChangeRequestForm.jsx';
import { ProcessHandoverModal } from './ProcessHandoverModal.jsx';

export function ProcessDetailView({ processId, onNavigate }) {
  const [activeTab, setActiveTab] = useState('details'); // details, draft, ownership, audit
  
  const [process, setProcess] = useState(null);
  const [ownershipHistory, setOwnershipHistory] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      if (isMounted) {
        setIsLoading(true);
      }
      try {
        const [procRes, histRes, auditRes] = await Promise.all([
          processApi.getById(processId),
          processApi.getOwnershipHistory(processId),
          auditApi.getEvents({ module_code: 'BPMS', entity_type: 'PROCESS', entity_id: String(processId), pageSize: 100 })
        ]);
        
        if (isMounted) {
          setProcess(procRes.process || procRes); // Depends on how getById returns data, looking at controller it's usually just data or data.process
          setOwnershipHistory(histRes.history || []);
          setAuditEvents(auditRes.events || []);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load process details.');
          setIsLoading(false);
        }
      }
    }
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [processId]);

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Loading process details...</span>
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-xs text-red-800">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Error</span>
          <span>{error || 'Process not found or unauthorized.'}</span>
        </div>
      </div>
    );
  }

  // Fallbacks if data structure is slightly nested
  const proc = process.process || process; 
  const hierarchy = proc.hierarchy || {};
  const capabilities = proc.capabilities || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <button
              onClick={() => onNavigate('processes')}
              className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-slate-500"
              title="Back to Registry"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {proc.process_name || proc.wps_code || 'Unnamed Process Unit'}
                </h1>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  {proc.process_code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    proc.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : proc.status === 'TRANSITION'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : proc.status === 'INACTIVE'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {proc.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Unified Process Management View
              </p>
            </div>
          </div>
        </div>
        
        {/* Contextual Actions */}
        <div className="flex items-center space-x-2">
          {proc.status !== 'INACTIVE' && capabilities.includes('BPMS.HANDOVER.REQUEST') && (
            <button 
              onClick={() => setIsHandoverModalOpen(true)}
              className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Request Handover
            </button>
          )}
          {proc.status !== 'INACTIVE' && capabilities.includes('BPMS.PROCESS.DEACTIVATE') && (
            <button 
              onClick={() => setActiveTab('draft')} // Let them request deactivation via draft tab
              className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Request Deactivation
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'details'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Details & Hierarchy</span>
        </button>
        
        {proc.status !== 'INACTIVE' && (
          <button
            onClick={() => setActiveTab('draft')}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'draft'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>Change Request</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('ownership')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'ownership'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Ownership History</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Trail</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden min-h-[500px]">
        {/* TAB 1: DETAILS & HIERARCHY */}
        {activeTab === 'details' && (
          <div className="p-6 space-y-6 text-xs text-slate-700">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Vertical</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{proc.vertical_code || proc.vertical_name || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">SBU</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{proc.sbu_code || proc.sbu_name || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Client / Type</span>
                <span className="font-semibold text-slate-800 mt-0.5 block truncate">{proc.client_name || proc.client_type || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">WPS Code</span>
                <span className="font-mono text-slate-700 mt-0.5 block">{proc.wps_code || 'Pending Form'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Current 5-Tier Ownership Hierarchy</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white border border-indigo-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Project Manager (PM)</span>
                  <span className="font-semibold text-slate-900 block mt-1 text-sm">{hierarchy.pm?.name || 'Unassigned'}</span>
                  <span className="font-mono text-xs text-slate-400 block mt-0.5">{hierarchy.pm?.ecode ? `${hierarchy.pm.ecode} • ${hierarchy.pm.email}` : 'No active PM'}</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Account Head</span>
                  <span className="font-semibold text-slate-900 block mt-1 text-sm">{hierarchy.account_head?.name || 'Unassigned'}</span>
                  <span className="font-mono text-xs text-slate-400 block mt-0.5">{hierarchy.account_head?.ecode || '—'}</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Strategic Business Unit Head</span>
                  <span className="font-semibold text-slate-900 block mt-1 text-sm">{hierarchy.sbu_head?.name || 'Unassigned'}</span>
                  <span className="font-mono text-xs text-slate-400 block mt-0.5">{hierarchy.sbu_head?.ecode || '—'}</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chief Business Officer (CBO)</span>
                  <span className="font-semibold text-slate-900 block mt-1 text-sm">{hierarchy.cbo?.name || 'Unassigned'}</span>
                  <span className="font-mono text-xs text-slate-400 block mt-0.5">{hierarchy.cbo?.ecode || '—'}</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Operations & Quality Head</span>
                  <span className="font-semibold text-slate-900 block mt-1 text-sm">{hierarchy.ops_head?.name || 'Unassigned'}</span>
                  <span className="font-mono text-xs text-slate-400 block mt-0.5">{hierarchy.ops_head?.ecode || '—'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>Your Authorized Row Capabilities ({capabilities.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {capabilities.map((cap) => (
                  <span key={cap} className="font-mono text-[10px] font-semibold px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md">
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {proc.status_reason && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 mt-4">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Status Reason / Sentinels</span>
                <p className="text-xs text-amber-900 font-mono">{proc.status_reason}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHANGE REQUEST DRAFT */}
        {activeTab === 'draft' && (
          <ProcessChangeRequestForm
            process={proc}
            capabilities={capabilities}
            onNavigate={onNavigate}
          />
        )}

        {/* TAB 3: OWNERSHIP HISTORY */}
        {activeTab === 'ownership' && (
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Historical Ownership Timeline</h3>
            {ownershipHistory.length === 0 ? (
              <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                No ownership records found.
              </div>
            ) : (
              <div className="space-y-4">
                {ownershipHistory.map((hist) => (
                  <div key={hist.ownership_id} className={`p-4 rounded-xl border ${hist.is_current ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-200'} shadow-2xs`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${hist.is_current ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                          {hist.is_current ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{hist.role_type}</p>
                          <p className="text-xs text-slate-500 font-mono">
                            {hist.employee_name} ({hist.employee_ecode})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-slate-700">
                          {new Date(hist.effective_from).toLocaleDateString()} — {hist.effective_to ? new Date(hist.effective_to).toLocaleDateString() : 'Present'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Assigned via: {hist.source_type}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Process Audit Trail</h3>
            {auditEvents.length === 0 ? (
              <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                No audit events found for this process.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Performed By</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                    {auditEvents.map((evt) => (
                      <tr key={evt.event_id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px]">{new Date(evt.created_at).toLocaleString()}</td>
                        <td className="py-3 px-4 font-semibold text-indigo-700">{evt.action}</td>
                        <td className="py-3 px-4 font-mono">{evt.performed_by_name || evt.performed_by}</td>
                        <td className="py-3 px-4 truncate max-w-xs">{evt.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <ProcessHandoverModal 
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        process={proc}
        onSuccess={() => {
          setIsHandoverModalOpen(false);
          // Optional: re-fetch or show toast
        }}
      />
    </div>
  );
}
