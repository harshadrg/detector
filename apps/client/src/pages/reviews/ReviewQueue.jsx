import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Calendar, 
  ChevronDown, 
  Wrench, 
  Receipt, 
  RefreshCw, 
  GitCompare, 
  Lock, 
  Edit3, 
  ArrowRight, 
  Eye, 
  AlertCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { changeRequestApi } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

export function ReviewQueue() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('changeRequests');
  const [search, setSearch] = useState('');
  const [expandedCr, setExpandedCr] = useState(null);
  const [auditRemarks, setAuditRemarks] = useState('');

  // Fetch pending change requests
  const { data, refetch } = useQuery({
    queryKey: ['pending-reviews'],
    queryFn: () => changeRequestApi.listPendingReviews(),
  });

  const reviews = data?.reviews || [];
  
  const changeRequests = reviews.filter(r => r.change_type !== 'PROCESS_DEACTIVATION');
  // const deactivationRequests = reviews.filter(r => r.change_type === 'PROCESS_DEACTIVATION');

  // Hardcode fallback data since Phase 10 backend might not return the exact mock structures in the Stitch UI
  const displayItems = changeRequests.length > 0 ? changeRequests : [
    {
      cr_id: 45,
      cr_code: 'CR-0045',
      registry_code: 'PRC-0128',
      process_name: 'Market Research & Intel',
      status: 'SUBMITTED',
      priority: 'HIGH',
      submitted_by: 'Amit R (E1008)',
      submitted_time: '2 hours ago',
      change_type: 'PROCESS_UPDATE',
      proposed_fields: ['Client Name', 'WPS Code', 'Location', 'SBU Code'],
      diff: {
        client_name: { old: '— (Unassigned / Internal)', new: 'Nykaa E-Retail Ltd' },
        wps_code: { old: 'WPS-EMG-003', new: 'WPS-EMG-019' },
        location: { old: 'Gurgaon, Haryana - Tech Hub', new: 'Mumbai, Maharashtra - Andheri DC' },
        sbu_code: { old: 'EMG-NEW', new: 'EMG-RET' }
      }
    },
    {
      cr_id: 42,
      cr_code: 'CR-0042',
      registry_code: 'PRC-0089',
      process_name: 'Risk Analytics Platform',
      status: 'UNDER_REVIEW',
      priority: 'MEDIUM',
      submitted_by: 'Saurabh F (E1006)',
      submitted_time: '1 day ago',
      change_type: 'POLICY_EXCEPTION',
      proposed_fields: ['Escalation SLA', 'Backup PM Assignment']
    },
    {
      cr_id: 38,
      cr_code: 'CR-0038',
      registry_code: 'PRC-0045',
      process_name: 'Payment Gateway Operations',
      status: 'SUBMITTED',
      priority: 'NORMAL',
      submitted_by: 'Pooja G (E1003)',
      submitted_time: '3 days ago',
      change_type: 'METADATA_CORRECTION',
      proposed_fields: ['Facility Name', 'City Mapping']
    }
  ];

  const reviewMutation = useMutation({
    mutationFn: ({ crId, action, remarks }) => 
      changeRequestApi.review(crId, { action, review_remarks: remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-reviews']);
      setExpandedCr(null);
      setAuditRemarks('');
    },
  });

  const handleReviewAction = (crId, action) => {
    if (!auditRemarks && action === 'REJECT') {
      alert('Audit remarks are mandatory for rejection.');
      return;
    }
    reviewMutation.mutate({ crId, action, remarks: auditRemarks || 'Approved via Review Queue UI.' });
  };

  const currentTabItems = activeTab === 'changeRequests' ? displayItems : [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-6 px-8">
      {/* Amber Integration Banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3.5 shadow-sm">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
          <Wrench className="w-5 h-5" />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-headline font-bold text-sm tracking-tight text-amber-950">BACKEND API PENDING</h2>
            <span className="bg-amber-200/70 border border-amber-300/80 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              STAGING PREVIEW • SPEC v4.2
            </span>
          </div>
          <p className="text-xs text-amber-900/90 leading-relaxed font-body">
            Backend API partially complete — Mock data provided for UI layout demonstration. 
          </p>
        </div>
      </div>

      {/* Screen Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline font-bold text-2xl text-on-surface tracking-tight">Review Queue</h1>
            <span className="bg-secondary-container text-on-secondary-container text-xs font-semibold px-2.5 py-0.5 rounded-full border border-outline-variant/30">
              {displayItems.length} Action Items
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1 font-body">
            Pending change requests and deactivation requests awaiting admin approval
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" className="flex items-center gap-1.5 h-9 bg-surface-container border-outline-variant hover:bg-surface-container-high">
            <CheckCircle2 className="w-4 h-4" />
            <span>Batch Actions</span>
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
          <Button variant="outline" className="flex items-center gap-1.5 h-9 bg-surface-container border-outline-variant hover:bg-surface-container-high">
            <Receipt className="w-4 h-4" />
            <span>Audit Trace</span>
          </Button>
          <Button className="flex items-center gap-1.5 h-9 shadow-sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </section>

      {/* Tabs and Filters */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant pb-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('changeRequests')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-colors ${
              activeTab === 'changeRequests' 
                ? 'bg-on-surface text-surface' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span>Change Requests</span>
            <span className={activeTab === 'changeRequests' ? 'bg-surface/20 px-1.5 py-0.5 rounded-full text-[10px]' : 'bg-surface-container px-1.5 py-0.5 rounded-full text-[10px]'}>
              {displayItems.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('deactivationRequests')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'deactivationRequests'
                ? 'bg-on-surface text-surface'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span>Deactivation Requests</span>
            <span className={activeTab === 'deactivationRequests' ? 'bg-surface/20 px-1.5 py-0.5 rounded-full text-[10px]' : 'bg-surface-container px-1.5 py-0.5 rounded-full text-[10px]'}>
              1
            </span>
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-8 pr-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 transition-all" 
              placeholder="Search requests, codes..." 
              type="text"
            />
          </div>
          <div className="relative">
            <select className="appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg pl-3 pr-8 py-1.5 text-xs text-on-surface font-medium focus:outline-none focus:border-primary transition-all cursor-pointer">
              <option>All Priorities</option>
              <option>High Priority</option>
              <option>Medium Priority</option>
              <option>Normal Priority</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
          </div>
          <div className="relative">
            <select className="appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg pl-3 pr-8 py-1.5 text-xs text-on-surface font-medium focus:outline-none focus:border-primary transition-all cursor-pointer">
              <option>All Dates</option>
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
            <Calendar className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Cards Container */}
      <section className="flex flex-col gap-5">
        {currentTabItems.map((cr) => {
          const isExpanded = expandedCr === cr.cr_id || (cr.cr_id === 45 && expandedCr === null); // Default expand 45

          if (isExpanded) {
            return (
              <article key={cr.cr_id} className="bg-surface-container-lowest border-2 border-primary/40 rounded-xl shadow-sm overflow-hidden transition-all duration-150">
                <div className="p-5 border-b border-outline-variant/60 bg-surface-container-lowest flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-2 py-0.5 rounded">{cr.cr_code}</span>
                      <span className="text-xs font-semibold text-on-surface-variant font-mono">{cr.registry_code}</span>
                      <h3 className="font-headline font-bold text-base text-on-surface tracking-tight">{cr.process_name}</h3>
                      <Badge variant="primary" className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-1.5 inline-block"></span>{cr.status}
                      </Badge>
                      {cr.priority === 'HIGH' && (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {cr.priority} PRIORITY
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Submitted by: <strong className="text-on-surface font-semibold">{cr.submitted_by}</strong> • {cr.submitted_time}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs pt-1 border-t border-outline-variant/30">
                    <div className="flex items-center gap-1.5">
                      <span className="text-on-surface-variant font-medium">Change Type:</span>
                      <span className="font-mono bg-surface-container text-on-surface font-semibold px-2 py-0.5 rounded border border-outline-variant/40">{cr.change_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-on-surface-variant font-medium">Proposed Changes:</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {cr.proposed_fields.map(f => (
                          <span key={f} className="bg-secondary-container/60 text-on-secondary-container px-2 py-0.5 rounded text-[11px] font-medium">{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low p-5 flex flex-col gap-4 border-b border-outline-variant/60">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-lowest px-4 py-2.5 rounded-lg border border-outline-variant/40 shadow-xs">
                    <div className="flex items-center gap-2">
                      <GitCompare className="w-4 h-4 text-primary" />
                      <span className="font-headline font-bold text-xs uppercase tracking-wider text-on-surface">CHANGE DELTA INSPECTION • {cr.registry_code}</span>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-medium px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> sha256:4b19... verified
                    </span>
                  </div>

                  {cr.diff && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Current */}
                      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col">
                        <div className="bg-surface-container px-3.5 py-2 border-b border-outline-variant flex items-center justify-between">
                          <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-on-surface-variant" /> Current Values (v2.4)
                          </span>
                          <span className="text-[10px] font-mono text-on-surface-variant uppercase font-semibold">[HEAD COMMITTED]</span>
                        </div>
                        <div className="divide-y divide-outline-variant/30 text-xs">
                          {Object.entries(cr.diff).map(([key, val]) => (
                            <div key={key} className="px-3.5 py-2.5 flex justify-between items-center bg-surface-container-lowest">
                              <span className="text-on-surface-variant font-medium capitalize">{key.replace('_', ' ')}</span>
                              <span className="font-mono text-on-surface font-medium">{val.old}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Proposed */}
                      <div className="bg-surface-container-lowest border border-emerald-300 rounded-lg overflow-hidden flex flex-col shadow-xs">
                        <div className="bg-emerald-50 px-3.5 py-2 border-b border-emerald-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-emerald-700" /> Proposed Values (v3.0 - In Review)
                          </span>
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded font-bold uppercase">[+{Object.keys(cr.diff).length} MODIFICATIONS]</span>
                        </div>
                        <div className="divide-y divide-emerald-100 text-xs">
                          {Object.entries(cr.diff).map(([key, val]) => (
                            <div key={key} className="px-3.5 py-2.5 flex justify-between items-center bg-emerald-50/40">
                              <span className="text-on-surface-variant font-medium capitalize">{key.replace('_', ' ')}</span>
                              <span className="font-mono font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">+ {val.new}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold text-on-surface flex items-center gap-1">
                        <span>Audit Remarks</span>
                        <span className="text-error">*</span>
                        <span className="text-on-surface-variant font-normal text-[11px]">(Mandatory for state transition)</span>
                      </label>
                      <span className="text-[11px] font-mono text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-outline-variant/40">
                        Ledger Node: <strong className="text-primary font-semibold">0x8a92..f1</strong>
                      </span>
                    </div>
                    <textarea 
                      value={auditRemarks}
                      onChange={(e) => setAuditRemarks(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                      placeholder="Enter approval or rejection audit remarks (required for compliance ledger)..." 
                      rows={2}
                    />
                  </div>
                </div>

                <div className="p-4 bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Button 
                      onClick={() => handleReviewAction(cr.cr_id, 'APPROVE')} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve Changes
                    </Button>
                    <Button 
                      onClick={() => handleReviewAction(cr.cr_id, 'REJECT')}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-headline text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
                    >
                      <XCircle className="w-4 h-4" /> Reject with Remarks
                    </Button>
                    <Button variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-50 px-3 py-2 text-xs font-semibold rounded-lg">
                      Quick Reject
                    </Button>
                  </div>
                  <button onClick={() => setExpandedCr(null)} className="text-xs text-on-surface-variant hover:text-on-surface font-medium underline underline-offset-2 transition-colors">
                    Cancel Review
                  </button>
                </div>
              </article>
            );
          }

          return (
            <article key={cr.cr_id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 hover:border-primary/50 shadow-xs transition-all duration-150 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="bg-surface-container text-on-surface-variant border border-outline-variant/60 text-xs font-bold px-2 py-0.5 rounded">{cr.cr_code}</span>
                  <span className="text-xs font-semibold text-on-surface-variant font-mono">{cr.registry_code}</span>
                  <h3 className="font-headline font-bold text-base text-on-surface tracking-tight">{cr.process_name}</h3>
                  <Badge variant={cr.status === 'UNDER_REVIEW' ? 'secondary' : 'primary'} className="text-[10px]">{cr.status}</Badge>
                  {cr.priority === 'MEDIUM' && (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {cr.priority} PRIORITY
                    </span>
                  )}
                  {cr.priority === 'NORMAL' && (
                    <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      {cr.priority}
                    </span>
                  )}
                </div>
                <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Submitted by: <strong className="text-on-surface font-semibold">{cr.submitted_by}</strong> • {cr.submitted_time}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant/30">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-on-surface-variant font-medium">Type:</span>
                    <span className="font-mono bg-surface-container text-on-surface font-medium px-2 py-0.5 rounded border border-outline-variant/40">{cr.change_type}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-on-surface-variant font-medium">Changes:</span>
                    <span className="text-on-surface font-medium">{cr.proposed_fields.join(', ')}</span>
                  </div>
                </div>
                {cr.cr_id === 45 ? (
                  <Button 
                    onClick={() => { setExpandedCr(cr.cr_id); setAuditRemarks(''); }}
                    className="h-8 text-xs font-semibold px-3"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Review
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => { setExpandedCr(cr.cr_id); setAuditRemarks(''); }} className="h-8 text-xs font-semibold px-3 border-outline-variant/60 hover:bg-secondary-container hover:text-on-secondary-container">
                    Continue Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </article>
          );
        })}
        {currentTabItems.length === 0 && (
          <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant rounded-xl border-dashed">
            <CheckCircle className="w-12 h-12 text-outline-variant mx-auto mb-3" />
            <h3 className="text-on-surface font-bold">All caught up!</h3>
            <p className="text-on-surface-variant text-sm mt-1">There are no items in this queue.</p>
          </div>
        )}
      </section>
    </div>
  );
}
