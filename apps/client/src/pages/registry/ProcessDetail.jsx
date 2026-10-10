import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Lock, ShieldCheck, CheckCircle, XCircle, 
  Layers, 
  Network, 
  SlidersHorizontal, 
  ArrowRightLeft, 
  Power, 
  Info, 
  History, 
  ScrollText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  MapPin, 
  Send
} from 'lucide-react';
import { processApi, employeeApi, auditApi, handoverApi } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { useAuth } from '../../context/useAuth.js';

export function ProcessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'change-request' | 'history' | 'audit'
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Modals state
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  // Fetch Process Details
  const { 
    data: processData, 
    isLoading: isProcessLoading, 
    error: processError 
  } = useQuery({
    queryKey: ['process', id],
    queryFn: () => processApi.getById(id),
    enabled: Boolean(id),
  });

  const process = processData?.process;
  const capabilities = process?.capabilities || [];

  // Fetch Ownership History
  const { 
    data: historyData, 
    isLoading: isHistoryLoading 
  } = useQuery({
    queryKey: ['process-history', id],
    queryFn: () => processApi.getOwnershipHistory(id),
    enabled: Boolean(id) && activeTab === 'history',
  });

  // Fetch Audit Trail
  const { 
    data: auditData, 
    isLoading: isAuditLoading 
  } = useQuery({
    queryKey: ['process-audit', process?.process_code],
    queryFn: () => auditApi.getEvents({ 
      module_code: 'BPMS', 
      entity_id: process?.process_code,
      pageSize: 50 
    }),
    enabled: Boolean(process?.process_code) && activeTab === 'audit',
  });

  // Change Request Form State
  const [changeForm, setChangeForm] = useState({
    process_name: '',
    wps_code: '',
    client_type: 'DOMESTIC',
    location_state: '',
    location_city: '',
    facility_name: '',
    started_on: '',
    reason: '',
  });


  const canReviewHandover = user?.permissions?.includes('BPMS.HANDOVER.APPROVE');
  const { data: handoverData } = useQuery({
    queryKey: ['pending-handovers'],
    queryFn: () => handoverApi.listPendingHandovers(),
    enabled: Boolean(canReviewHandover),
  });
  const pendingHandover = handoverData?.handovers?.find(h => h.registry_id === Number(id));

  const [handoverPasswordPrompt, setHandoverPasswordPrompt] = useState({ isOpen: false, handoverId: null, action: null });
  const [handoverPassword, setHandoverPassword] = useState('');
  const [handoverRemarks, setHandoverRemarks] = useState('');

  const reviewHandoverMutation = useMutation({
    mutationFn: ({ handoverId, action, remarks, password }) => 
      handoverApi.review(handoverId, { action, review_remarks: remarks, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process', id] });
      queryClient.invalidateQueries({ queryKey: ['process-history', id] });
      queryClient.invalidateQueries({ queryKey: ['pending-handovers'] });
      setHandoverPasswordPrompt({ isOpen: false, handoverId: null, action: null });
      setHandoverPassword('');
      setHandoverRemarks('');
      setActionSuccess('Handover review executed successfully.');
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err) => {
      setActionError(err.message || 'Handover review failed.');
    }
  });

  const confirmHandoverReview = (e) => {
    e.preventDefault();
    if (!handoverPassword) return alert('Password required');
    if (handoverPasswordPrompt.action === 'REJECT' && !handoverRemarks) return alert('Remarks required for rejection');
    reviewHandoverMutation.mutate({
      handoverId: handoverPasswordPrompt.handoverId,
      action: handoverPasswordPrompt.action,
      remarks: handoverRemarks || 'Approved via Process Detail.',
      password: handoverPassword
    });
  };

  // Initialize Change Request form when process loads
  const initChangeForm = () => {
    if (!process) return;
    setChangeForm({
      process_name: process.process_name || '',
      wps_code: process.wps_code || '',
      client_type: process.client_type || 'DOMESTIC',
      location_state: process.location_state || '',
      location_city: process.location_city || '',
      facility_name: process.location_facility || '',
      started_on: process.started_on ? process.started_on.substring(0, 10) : '',
      reason: '',
    });
  };

  // Submit Change Request Mutation
  const changeRequestMutation = useMutation({
    mutationFn: (payload) => processApi.submitChangeRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process', id] });
      setActionSuccess('Change request submitted successfully for review.');
      setActionError(null);
      setActiveTab('details');
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to submit change request.');
    },
  });

  const handleCRSubmit = (e) => {
    e.preventDefault();
    if (!changeForm.reason.trim()) {
      setActionError('Change remarks are required to submit a change request.');
      return;
    }

    const payload = {
      change_type: 'PROCESS_DETAIL_UPDATE',
      action: 'SUBMIT',
      reason: changeForm.reason.trim(),
      proposed_data: {
        process_name: changeForm.process_name,
        wps_code: changeForm.wps_code || null,
        client_type: changeForm.client_type,
        started_on: changeForm.started_on || null,
      },
    };

    changeRequestMutation.mutate(payload);
  };

  // Handover Mutation
  const handoverMutation = useMutation({
    mutationFn: (payload) => processApi.requestHandover(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process', id] });
      queryClient.invalidateQueries({ queryKey: ['process-history', id] });
      setIsHandoverModalOpen(false);
      setActionSuccess('PM Handover requested successfully.');
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to submit handover request.');
    },
  });

  // Deactivation Request Mutation
  const deactivateMutation = useMutation({
    mutationFn: (payload) => processApi.submitChangeRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process', id] });
      setIsDeactivateModalOpen(false);
      setActionSuccess('Deactivation request submitted for review.');
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to submit deactivation request.');
    },
  });

  if (isProcessLoading) {
    return (
      <div className="py-24 flex items-center justify-center text-on-surface-variant font-medium">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span>Loading process details...</span>
      </div>
    );
  }

  if (processError || !process) {
    return (
      <div className="p-8 text-center bg-surface-container-lowest border border-outline-variant/30 rounded-xl space-y-4">
        <AlertCircle className="w-8 h-8 text-error mx-auto" />
        <h2 className="text-lg font-bold text-on-surface">Process Not Found</h2>
        <p className="text-xs text-on-surface-variant max-w-md mx-auto">
          {processError?.message || `Process with ID ${id} was not found or access is unauthorized.`}
        </p>
        <Button variant="primary" onClick={() => navigate('/registry')}>
          Back to Registry
        </Button>
      </div>
    );
  }

  const hierarchy = process.hierarchy || {};
  const currentPM = hierarchy.pm;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <section className="space-y-4">
        <div>
          <Link
            to="/registry"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Process Registry</span>
          </Link>
        </div>

        {/* Action feedback banners */}
        {actionSuccess && (
          <div 
            role="status" 
            className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div 
            role="alert" 
            className="p-3.5 rounded-lg bg-error/10 border border-error/20 text-error flex items-center gap-2.5 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        
        {pendingHandover && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-sm">Pending Handover Request</h3>
                <p className="text-amber-700 text-xs mt-1">
                  <strong>{pendingHandover.from_pm?.name || 'System'}</strong> requested a handover to <strong>{pendingHandover.to_pm?.name}</strong>.
                  <br/>Reason: {pendingHandover.reason || pendingHandover.scenario}
                </p>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Audit remarks (required for rejection)..."
                    value={handoverRemarks}
                    onChange={(e) => setHandoverRemarks(e.target.value)}
                    className="w-full sm:w-80 text-xs px-3 py-1.5 rounded border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-8 px-3 text-xs"
                onClick={() => setHandoverPasswordPrompt({ isOpen: true, handoverId: pendingHandover.handover_id, action: 'APPROVE' })}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
              </Button>
              <Button 
                variant="outline" 
                className="bg-white border-rose-300 text-rose-700 hover:bg-rose-50 h-8 px-3 text-xs"
                onClick={() => setHandoverPasswordPrompt({ isOpen: true, handoverId: pendingHandover.handover_id, action: 'REJECT' })}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
              </Button>
            </div>
          </div>
        )}

        {/* Process Header Information */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface tracking-tight font-mono">
                {process.process_code}
              </h1>

              {process.status === 'ACTIVE' && (
                <Badge variant="success">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ACTIVE
                </Badge>
              )}
              {process.status === 'TRANSITION' && (
                <Badge variant="warning">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  TRANSITION
                </Badge>
              )}
              {process.status !== 'ACTIVE' && process.status !== 'TRANSITION' && (
                <Badge variant="default">
                  {process.status}
                </Badge>
              )}

              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/30">
                v{process.version_num || 1}.0
              </span>
            </div>
            <p className="text-on-surface-variant text-xs sm:text-sm mt-1">
              {process.process_name} &bull; {process.client_name || 'Internal Operations'}
            </p>
          </div>

          {/* Action Cluster (Guarded strictly by computed capabilities) */}
          <div className="flex items-center flex-wrap gap-2.5">
            {capabilities.includes('BPMS.CHANGE_REQUEST.SUBMIT') && (
              <Button
                variant="outline"
                className="text-xs"
                icon={SlidersHorizontal}
                onClick={() => {
                  initChangeForm();
                  setActiveTab('change-request');
                }}
              >
                Request Change
              </Button>
            )}

            {capabilities.includes('BPMS.HANDOVER.REQUEST') && (
              <Button
                variant="outline"
                className="text-xs"
                icon={ArrowRightLeft}
                onClick={() => setIsHandoverModalOpen(true)}
              >
                Request Handover
              </Button>
            )}

            {capabilities.includes('BPMS.PROCESS.DEACTIVATE_REQUEST') && process.status !== 'INACTIVE' && (
              <Button
                variant="outline"
                className="text-xs text-error border-error/30 hover:bg-error/10"
                icon={Power}
                onClick={() => setIsDeactivateModalOpen(true)}
              >
                Request Deactivation
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation (Matching Stitch screen 4e5b3bb832aa48c0a8e0e15167f616f1) */}
        <div className="border-b border-outline-variant/40 pt-2">
          <nav className="flex space-x-6 sm:space-x-8 -mb-px text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`pb-3 px-1 inline-flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab === 'details'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Process Details</span>
            </button>

            <button
              type="button"
              onClick={() => {
                initChangeForm();
                setActiveTab('change-request');
              }}
              className={`pb-3 px-1 inline-flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab === 'change-request'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Change Request</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-1 inline-flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Ownership History</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`pb-3 px-1 inline-flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              <span>Audit Trail</span>
            </button>
          </nav>
        </div>
      </section>

      {/* TAB 1: PROCESS DETAILS (Two-Column Bento Grid) */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* LEFT CARD: Process Information */}
          <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/40">
              <div>
                <h2 className="font-headline font-bold text-sm sm:text-base text-on-surface">
                  Process Information
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Core metadata and operational classification
                </p>
              </div>
              <Layers className="w-5 h-5 text-outline" />
            </div>

            <div className="p-5 sm:p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                {/* Process Code */}
                <div className="border-b border-outline-variant/20 pb-3">
                  <dt className="text-on-surface-variant font-medium mb-1">Process Code</dt>
                  <dd className="font-mono font-semibold text-on-surface text-sm bg-surface-container-low px-2 py-0.5 rounded inline-block">
                    {process.process_code}
                  </dd>
                </div>

                {/* WPS Code */}
                <div className="border-b border-outline-variant/20 pb-3">
                  <dt className="text-on-surface-variant font-medium mb-1">WPS Code</dt>
                  <dd className="font-mono font-semibold text-on-surface text-sm">
                    {process.wps_code || '—'}
                  </dd>
                </div>

                {/* Process Name */}
                <div className="border-b border-outline-variant/20 pb-3 sm:col-span-2">
                  <dt className="text-on-surface-variant font-medium mb-1">Process Name</dt>
                  <dd className="font-semibold text-on-surface text-sm">
                    {process.process_name}
                  </dd>
                </div>

                {/* Client */}
                <div className="border-b border-outline-variant/20 pb-3">
                  <dt className="text-on-surface-variant font-medium mb-1">Client</dt>
                  <dd className="font-semibold text-on-surface text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                    <span>{process.client_name || '—'}</span>
                  </dd>
                </div>

                {/* Client Type */}
                <div className="border-b border-outline-variant/20 pb-3">
                  <dt className="text-on-surface-variant font-medium mb-1">Client Type</dt>
                  <dd>
                    <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface border border-outline-variant/30">
                      {process.client_type || 'DOMESTIC'}
                    </span>
                  </dd>
                </div>

                {/* Vertical */}
                <div className="border-b border-outline-variant/20 pb-3">
                  <dt className="text-on-surface-variant font-medium mb-1">Vertical</dt>
                  <dd>
                    <span className="bg-surface-container text-on-surface font-mono text-[11px] font-semibold px-2 py-0.5 rounded border border-outline-variant/30">
                      {process.vertical_code}
                    </span>
                  </dd>
                </div>

                {/* SBU */}
                <div className="border-b border-outline-variant/20 pb-3">
                  <dt className="text-on-surface-variant font-medium mb-1">SBU</dt>
                  <dd className="font-mono font-semibold text-on-surface text-xs">
                    {process.sbu_code || '—'}
                  </dd>
                </div>

                {/* Primary Operations Location */}
                <div className="border-b border-outline-variant/20 pb-3 sm:col-span-2">
                  <dt className="text-on-surface-variant font-medium mb-1">Primary Operations Location</dt>
                  <dd className="font-medium text-on-surface flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-outline" />
                    <span>
                      {process.location_city && process.location_state 
                        ? `${process.location_city}, ${process.location_state}${process.location_facility ? ` - ${process.location_facility}` : ''}`
                        : 'No primary facility specified'}
                    </span>
                  </dd>
                </div>

                {/* Lifecycle Status */}
                <div className="border-b border-outline-variant/20 pb-3">
                  <dt className="text-on-surface-variant font-medium mb-1">Lifecycle Status</dt>
                  <dd>
                    <Badge variant={process.status === 'ACTIVE' ? 'success' : process.status === 'TRANSITION' ? 'warning' : 'default'}>
                      {process.status}
                    </Badge>
                  </dd>
                </div>

                {/* Started On */}
                <div className="border-b border-outline-variant/20 pb-3">
                  <dt className="text-on-surface-variant font-medium mb-1">Started On</dt>
                  <dd className="font-mono text-on-surface flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-outline" />
                    <span>{process.started_on ? process.started_on.substring(0, 10) : '—'}</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* RIGHT CARD: Current Ownership Hierarchy (5 Levels) */}
          <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
            <div className="p-4 sm:p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/40">
              <div>
                <h2 className="font-headline font-bold text-sm sm:text-base text-on-surface">
                  Current Ownership Hierarchy
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  5-level governance and escalation chain
                </p>
              </div>
              <Network className="w-5 h-5 text-outline" />
            </div>

            <div className="p-6 relative">
              {/* Connecting line */}
              <div className="absolute left-10 top-8 bottom-8 w-0.5 bg-outline-variant/30"></div>
              
              <div className="space-y-5 relative">
                {/* Level 1: OPS Quality Head */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/50 text-on-surface font-semibold text-xs flex items-center justify-center shrink-0 z-10">
                    {hierarchy.ops_head ? hierarchy.ops_head.name.substring(0, 2).toUpperCase() : 'OH'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-on-surface">
                        {hierarchy.ops_head?.name || 'Unassigned'}
                      </span>
                      {hierarchy.ops_head?.ecode && (
                        <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                          {hierarchy.ops_head.ecode}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      Level 1 &bull; OPS Quality Head
                    </div>
                  </div>
                </div>

                {/* Level 2: CBO */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/50 text-on-surface font-semibold text-xs flex items-center justify-center shrink-0 z-10">
                    {hierarchy.cbo ? hierarchy.cbo.name.substring(0, 2).toUpperCase() : 'CB'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-on-surface">
                        {hierarchy.cbo?.name || 'Unassigned'}
                      </span>
                      {hierarchy.cbo?.ecode && (
                        <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                          {hierarchy.cbo.ecode}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      Level 2 &bull; Chief Business Officer
                    </div>
                  </div>
                </div>

                {/* Level 3: SBU Head */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/50 text-on-surface font-semibold text-xs flex items-center justify-center shrink-0 z-10">
                    {hierarchy.sbu_head ? hierarchy.sbu_head.name.substring(0, 2).toUpperCase() : 'SH'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-on-surface">
                        {hierarchy.sbu_head?.name || 'Unassigned'}
                      </span>
                      {hierarchy.sbu_head?.ecode && (
                        <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                          {hierarchy.sbu_head.ecode}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      Level 3 &bull; Strategic Business Unit Head
                    </div>
                  </div>
                </div>

                {/* Level 4: Account Head */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/50 text-on-surface font-semibold text-xs flex items-center justify-center shrink-0 z-10">
                    {hierarchy.account_head ? hierarchy.account_head.name.substring(0, 2).toUpperCase() : 'AH'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-on-surface">
                        {hierarchy.account_head?.name || 'Unassigned'}
                      </span>
                      {hierarchy.account_head?.ecode && (
                        <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                          {hierarchy.account_head.ecode}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      Level 4 &bull; Account Head
                    </div>
                  </div>
                </div>

                {/* Level 5: Project Manager (PRIMARY OWNER - HIGHLIGHTED) */}
                <div className="relative bg-primary-container/20 border border-primary/30 rounded-lg p-3 z-10 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary font-semibold text-xs flex items-center justify-center shrink-0">
                      {currentPM ? currentPM.name.substring(0, 2).toUpperCase() : 'PM'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">
                          {currentPM?.name || 'Unassigned'}
                        </span>
                        {currentPM?.ecode && (
                          <span className="font-mono text-[10px] text-primary font-bold bg-primary-container/50 px-1.5 py-0.5 rounded border border-primary/20">
                            {currentPM.ecode}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="font-semibold text-primary">Level 5 &bull; Process Project Manager (Primary)</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">Assigned</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHANGE REQUEST (Side-by-Side Review & Proposal Form) */}
      {activeTab === 'change-request' && (
        <div className="space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-outline-variant/30 bg-surface-container-low/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-headline font-bold text-base text-on-surface">
                    Propose Change Request for {process.process_code}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Propose updates to process attributes. Changes route to the Review Queue before ledger commit.
                  </p>
                </div>
                <Badge variant="primary">GOVERNANCE WORKFLOW</Badge>
              </div>
            </div>

            <form onSubmit={handleCRSubmit} className="p-6 space-y-6">
              {/* Side-by-Side Review Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Process Name */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-on-surface">
                    Process Name *
                  </label>
                  <input
                    type="text"
                    value={changeForm.process_name}
                    onChange={(e) => setChangeForm({ ...changeForm, process_name: e.target.value })}
                    required
                    className="w-full text-xs px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-on-surface-variant">Current: {process.process_name}</p>
                </div>

                {/* Column 2: WPS Code */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-on-surface">
                    WPS Code
                  </label>
                  <input
                    type="text"
                    value={changeForm.wps_code}
                    onChange={(e) => setChangeForm({ ...changeForm, wps_code: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-on-surface-variant">Current: {process.wps_code || 'None'}</p>
                </div>

                {/* Column 3: Client Type */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-on-surface">
                    Client Type
                  </label>
                  <select
                    value={changeForm.client_type}
                    onChange={(e) => setChangeForm({ ...changeForm, client_type: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="DOMESTIC">DOMESTIC</option>
                    <option value="INTERNATIONAL">INTERNATIONAL</option>
                  </select>
                  <p className="text-[11px] text-on-surface-variant">Current: {process.client_type || 'DOMESTIC'}</p>
                </div>

                {/* Column 4: Started On */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-on-surface">
                    Started On
                  </label>
                  <input
                    type="date"
                    value={changeForm.started_on}
                    onChange={(e) => setChangeForm({ ...changeForm, started_on: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-on-surface-variant">
                    Current: {process.started_on ? process.started_on.substring(0, 10) : 'None'}
                  </p>
                </div>
              </div>

              {/* Change Remarks */}
              <div className="space-y-1.5 text-left pt-2 border-t border-outline-variant/20">
                <label className="block text-xs font-semibold text-on-surface">
                  Change Remarks *
                </label>
                <textarea
                  rows={3}
                  value={changeForm.reason}
                  onChange={(e) => setChangeForm({ ...changeForm, reason: e.target.value })}
                  placeholder="Explain why this change is necessary..."
                  required
                  className="w-full text-xs p-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-on-surface-variant">
                  This justification is permanently appended to the immutable platform audit ledger.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('details')}
                  disabled={changeRequestMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={changeRequestMutation.isPending}
                  icon={changeRequestMutation.isPending ? Loader2 : Send}
                >
                  {changeRequestMutation.isPending ? 'Submitting...' : 'Submit Change Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: OWNERSHIP HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/40">
            <div>
              <h2 className="font-headline font-bold text-sm sm:text-base text-on-surface">
                Ownership & Handover History
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Chronological audit record of PM and governance assignments
              </p>
            </div>
            <History className="w-5 h-5 text-outline" />
          </div>

          <div className="p-6">
            {isHistoryLoading ? (
              <div className="py-12 text-center text-on-surface-variant font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-primary inline mr-2" />
                <span>Loading ownership transitions...</span>
              </div>
            ) : !historyData?.history || historyData.history.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-8">
                No past handover records found for this process.
              </p>
            ) : (
              <div className="space-y-4">
                {historyData.history.map((record, idx) => (
                  <div 
                    key={record.ownership_id || idx}
                    className="p-4 rounded-lg bg-surface-container-low/40 border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-container/40 text-on-primary-container font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {record.employee_name ? record.employee_name.substring(0, 2).toUpperCase() : 'EM'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-on-surface">{record.employee_name}</span>
                          <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded">
                            {record.employee_ecode}
                          </span>
                          <Badge variant={record.is_current ? 'success' : 'default'}>
                            {record.is_current ? 'Current PM' : 'Past Owner'}
                          </Badge>
                        </div>
                        <p className="text-on-surface-variant mt-0.5">
                          {record.reason || 'Process ownership assignment'} &bull; Source: {record.source_type}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono text-[11px] text-on-surface-variant">
                      <div>Assigned: {record.effective_from ? record.effective_from.substring(0, 10) : '—'}</div>
                      {record.effective_to && <div>Relinquished: {record.effective_to.substring(0, 10)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/40">
            <div>
              <h2 className="font-headline font-bold text-sm sm:text-base text-on-surface">
                Immutable Platform Audit Ledger
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Cryptographically tracked lifecycle events for {process.process_code}
              </p>
            </div>
            <ScrollText className="w-5 h-5 text-outline" />
          </div>

          <div className="p-6">
            {isAuditLoading ? (
              <div className="py-12 text-center text-on-surface-variant font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-primary inline mr-2" />
                <span>Loading audit records...</span>
              </div>
            ) : !auditData?.events || auditData.events.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-8">
                No specific audit events logged for this process code.
              </p>
            ) : (
              <div className="space-y-3">
                {auditData.events.map((event, idx) => (
                  <div
                    key={event.event_id || idx}
                    className="p-3.5 rounded-lg border border-outline-variant/20 bg-surface-container-low/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{event.action}</span>
                        <span className="text-on-surface-variant font-mono text-[11px]">&bull; Performed by {event.performed_by}</span>
                      </div>
                      <p className="text-on-surface mt-1">{event.remarks || 'Event processed without additional remarks.'}</p>
                    </div>
                    <span className="text-[11px] font-mono text-on-surface-variant whitespace-nowrap">
                      {event.created_at ? new Date(event.created_at).toLocaleString() : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      
      {/* Handover Security Modal */}
      {handoverPasswordPrompt.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-outline-variant/50 flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant/50 bg-error/5 flex items-center gap-3">
              <div className="p-2 bg-error/10 text-error rounded-full">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface">Security Confirmation</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Authorize handover transition.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-on-surface-variant">
                You are about to <strong className={handoverPasswordPrompt.action === 'APPROVE' ? 'text-emerald-600' : 'text-rose-600'}>{handoverPasswordPrompt.action}</strong> the handover for {process.process_code}.
              </p>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <Lock className="w-4 h-4" /> BPMS Admin Password
                </label>
                <input
                  type="password"
                  value={handoverPassword}
                  onChange={(e) => setHandoverPassword(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-container flex justify-end gap-3 border-t border-outline-variant/50">
              <Button variant="outline" onClick={() => setHandoverPasswordPrompt({ isOpen: false, handoverId: null, action: null })}>Cancel</Button>
              <Button onClick={confirmHandoverReview} className="bg-primary text-on-primary">Confirm & Execute</Button>
            </div>
          </div>
        </div>
      )}


      {/* Handover Modal */}
      <HandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        process={process}
        onSubmit={(data) => handoverMutation.mutate(data)}
        isPending={handoverMutation.isPending}
      />

      {/* Deactivation Modal */}
      <DeactivateModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        process={process}
        onSubmit={(data) => deactivateMutation.mutate(data)}
        isPending={deactivateMutation.isPending}
      />
    </div>
  );
}

// Handover Request Modal Subcomponent
function HandoverModal({ isOpen, onClose, process, onSubmit, isPending }) {
  const [employees, setEmployees] = useState([]);
  const [targetEcode, setTargetEcode] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');

  // Load candidate PMs
  useEffect(() => {
    if (isOpen) {
      employeeApi.list({ page: 1, pageSize: 100, status: 'ACTIVE' }).then((data) => {
        if (Array.isArray(data?.employees)) {
          setEmployees(data.employees);
        }
      });
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetEcode || !reason.trim()) return;
    onSubmit({
      target_ecode: targetEcode,
      effective_date: effectiveDate || null,
      handover_reason: reason.trim(),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Request PM Handover — ${process?.process_code}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <p className="text-xs text-on-surface-variant">
          Transfer primary Project Manager responsibility to an active colleague.
        </p>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface" htmlFor="target_ecode">
            Target Project Manager *
          </label>
          <select
            id="target_ecode"
            value={targetEcode}
            onChange={(e) => setTargetEcode(e.target.value)}
            required
            className="w-full text-xs px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="">Select Target PM...</option>
            {employees
              .filter((e) => e.ecode !== process?.hierarchy?.pm?.ecode)
              .map((emp) => (
                <option key={emp.ecode} value={emp.ecode}>
                  {emp.ecode} — {emp.name}
                </option>
              ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface" htmlFor="effective_date">
            Effective Date
          </label>
          <input
            id="effective_date"
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface" htmlFor="handover_reason">
            Handover Reason *
          </label>
          <textarea
            id="handover_reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="e.g. Account re-allocation, project transition..."
            className="w-full text-xs p-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isPending} icon={isPending ? Loader2 : ArrowRightLeft}>
            {isPending ? 'Requesting...' : 'Request Handover'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Deactivation Request Modal Subcomponent
function DeactivateModal({ isOpen, onClose, process, onSubmit, isPending }) {
  const [endedOn, setEndedOn] = useState(new Date().toISOString().substring(0, 10));
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!remarks.trim()) return;
    onSubmit({
      change_type: 'PROCESS_DEACTIVATION',
      action: 'SUBMIT',
      reason: remarks.trim(),
      proposed_data: {
        ended_on: endedOn,
        closure_remarks: remarks.trim(),
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Request Deactivation — ${process?.process_code}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
          <strong>Process Closure Warning:</strong> Deactivation will mark this process as retired and disallow new changes or assignments upon approval.
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface" htmlFor="ended_on">
            Effective End Date *
          </label>
          <input
            id="ended_on"
            type="date"
            value={endedOn}
            onChange={(e) => setEndedOn(e.target.value)}
            required
            className="w-full text-xs px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface" htmlFor="closure_remarks">
            Closure / Deactivation Reason *
          </label>
          <textarea
            id="closure_remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            required
            placeholder="e.g. Contract ended, client migration complete..."
            className="w-full text-xs p-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={isPending} icon={isPending ? Loader2 : Power}>
            {isPending ? 'Submitting...' : 'Confirm Deactivation Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProcessDetail;
