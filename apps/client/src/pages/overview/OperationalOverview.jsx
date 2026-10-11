import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  ClipboardCheck, 
  ArrowRightLeft, 
  Users, 
  RotateCw, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Layers, 
  AlertCircle,
  Clock,
  Plus
} from 'lucide-react';
import { 
  processApi, 
  employeeApi, 
  changeRequestApi, 
  handoverApi, 
  auditApi 
} from '../../lib/api.js';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/useAuth.js';

export function OperationalOverview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { hasPermission, hasAnyPermission } = useAuth();

  // 1. Fetch Process summary
  const { data: processData, isLoading: isProcessLoading } = useQuery({
    queryKey: ['overview-processes'],
    queryFn: () => processApi.list({ page: 1, pageSize: 5 }),
    enabled: hasPermission('BPMS.PROCESS.VIEW'),
  });

  // 2. Fetch Active Process count
  const { data: activeProcessData } = useQuery({
    queryKey: ['overview-active-processes'],
    queryFn: () => processApi.list({ page: 1, pageSize: 1, status: 'ACTIVE' }),
    enabled: hasPermission('BPMS.PROCESS.VIEW'),
  });

  // 3. Fetch Pending Change Requests
  const { data: pendingReviewsData, isLoading: isReviewsLoading } = useQuery({
    queryKey: ['overview-pending-cr'],
    queryFn: async () => {
      try {
        return await changeRequestApi.listPendingReviews();
      } catch {
        return { reviews: [] };
      }
    },
    enabled: hasPermission('BPMS.CHANGE_REQUEST.APPROVE'),
  });

  // 4. Fetch Pending Handovers
  const { data: pendingHandoversData, isLoading: isHandoversLoading } = useQuery({
    queryKey: ['overview-pending-handovers'],
    queryFn: async () => {
      try {
        return await handoverApi.listPendingHandovers();
      } catch {
        return { handovers: [] };
      }
    },
    enabled: hasPermission('BPMS.HANDOVER.APPROVE'),
  });

  // 5. Fetch Active Employees count
  const { data: employeeData } = useQuery({
    queryKey: ['overview-employees'],
    queryFn: () => employeeApi.list({ page: 1, pageSize: 1, status: 'ACTIVE' }),
    enabled: hasPermission('CORE.USER.VIEW'),
  });

  // 6. Fetch Recent Audit Events
  const { data: auditData, isLoading: isAuditLoading } = useQuery({
    queryKey: ['overview-audit'],
    queryFn: () => auditApi.getEvents({ pageSize: 5 }),
    enabled: hasAnyPermission(['CORE.AUDIT.VIEW_GLOBAL', 'BPMS.AUDIT.VIEW']),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const activeProcessCount = activeProcessData?.meta?.totalCount ?? activeProcessData?.total ?? processData?.meta?.totalCount ?? processData?.processes?.length ?? 0;
  const pendingCRList = pendingReviewsData?.reviews || [];
  const pendingHandoverList = pendingHandoversData?.handovers || [];
  const totalEmployees = employeeData?.meta?.totalCount ?? employeeData?.total ?? employeeData?.employees?.length ?? 0;
  const recentProcesses = processData?.processes || [];
  const recentEvents = auditData?.events || [];

  return (
    <div className="space-y-7">
      {/* Page Title & Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-outline-variant/30">
        <div>
          <h1 className="font-headline font-bold text-2xl tracking-tight text-on-surface">
            Operational Overview
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Real-time operational queues, governance triggers, and lifecycle health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Sync</span>
          </span>

          <Button
            variant="outline"
            className="text-xs"
            icon={isRefreshing ? RotateCw : RotateCw}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          {hasPermission('BPMS.PROCESS.CREATE') && (
            <Button
              variant="primary"
              className="text-xs"
              icon={Plus}
              onClick={() => navigate('/registry')}
            >
              New Process
            </Button>
          )}
        </div>
      </div>

      {/* SECTION 1: Summary Cards (Row of 4 Compact Metric Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Processes (Emerald accent) */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 border-l-4 border-l-emerald-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Active Processes
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-on-surface font-mono">
              {isProcessLoading ? '—' : activeProcessCount}
            </span>
            <Badge variant="success">Operational</Badge>
          </div>
          <p className="mt-2 text-[11px] text-on-surface-variant">
            Verified running business process nodes
          </p>
        </div>

        {/* Card 2: Pending Reviews (Amber accent) */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 border-l-4 border-l-amber-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Pending Reviews
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-on-surface font-mono">
              {isReviewsLoading ? '—' : pendingCRList.length}
            </span>
            <Badge variant={pendingCRList.length > 0 ? 'warning' : 'default'}>
              {pendingCRList.length > 0 ? 'Action Needed' : 'Clear'}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Change requests in queue</span>
            <Link to="/reviews" className="text-primary hover:underline font-medium inline-flex items-center gap-0.5">
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Pending Handovers (Primary/Indigo accent) */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 border-l-4 border-l-primary shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Pending Handovers
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-on-surface font-mono">
              {isHandoversLoading ? '—' : pendingHandoverList.length}
            </span>
            <Badge variant={pendingHandoverList.length > 0 ? 'primary' : 'default'}>
              {pendingHandoverList.length > 0 ? 'In Transfer' : 'Clear'}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>PM transitions pending signoff</span>
            <Link to="/registry" className="text-primary hover:underline font-medium inline-flex items-center gap-0.5">
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Active Directory Workforce (Sky accent) */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 border-l-4 border-l-sky-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Active Directory
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-on-surface font-mono">
              {totalEmployees}
            </span>
            <Badge variant="default">Workforce</Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Governed corporate personnel</span>
            <Link to="/directory" className="text-primary hover:underline font-medium inline-flex items-center gap-0.5">
              <span>Directory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: Split Bento View — Operational Queues & Recent Processes */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Active Processes & Quick Access (7 Cols) */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/40">
              <div>
                <h2 className="font-headline font-bold text-sm sm:text-base text-on-surface">
                  Recently Managed Processes
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Latest registered business processes and operational assignments
                </p>
              </div>
              <Link 
                to="/registry"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View Full Registry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-outline-variant/20">
              {isProcessLoading ? (
                <div className="p-8 text-center text-xs text-on-surface-variant">
                  Loading operational processes...
                </div>
              ) : recentProcesses.length === 0 ? (
                <div className="p-8 text-center text-xs text-on-surface-variant">
                  No active processes found.
                </div>
              ) : (
                recentProcesses.map((proc) => (
                  <div 
                    key={proc.registry_id} 
                    className="p-4 flex items-center justify-between hover:bg-surface-container-low/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4 text-on-surface-variant" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/registry/${proc.registry_id}`}
                            className="font-mono font-bold text-xs text-primary hover:underline"
                          >
                            {proc.process_code}
                          </Link>
                          <Badge variant={proc.status === 'ACTIVE' ? 'success' : 'warning'}>
                            {proc.status}
                          </Badge>
                          <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded">
                            {proc.vertical_code}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface font-medium mt-0.5 line-clamp-1">
                          {proc.process_name} &bull; <span className="text-on-surface-variant">{proc.client_name || 'Internal'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-on-surface">
                        {proc.hierarchy?.pm?.name || 'Unassigned PM'}
                      </div>
                      <div className="text-[11px] font-mono text-on-surface-variant">
                        {proc.hierarchy?.pm?.ecode ? `PM: ${proc.hierarchy.pm.ecode}` : 'No PM'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Platform Actions Banner */}
          <div className="p-5 rounded-xl bg-primary-container/20 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                  Enterprise Air-Gap Operational Guard
                </h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  All process updates, change requests, and PM handovers are strictly recorded into the immutable audit ledger.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="text-xs shrink-0 self-start sm:self-center"
              onClick={() => navigate('/directory')}
            >
              Manage Employees
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Immutable Platform Audit Ledger (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/40">
            <div>
              <h2 className="font-headline font-bold text-sm sm:text-base text-on-surface">
                Platform Audit Ledger
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Real-time cryptographic trail of governance actions
              </p>
            </div>
            <Activity className="w-4 h-4 text-outline" />
          </div>

          <div className="p-4 sm:p-5">
            {isAuditLoading ? (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                Fetching cryptographic ledger...
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-outline" />
                <span>No audit events recorded yet.</span>
              </div>
            ) : (
              <div className="space-y-3.5 relative">
                {/* Timeline bar */}
                <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-outline-variant/30"></div>

                {recentEvents.map((evt, idx) => (
                  <div key={evt.event_id || idx} className="flex items-start gap-3 relative text-xs">
                    <div className="w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center shrink-0 z-10 text-primary">
                      <Clock className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0 bg-surface-container-low/30 rounded-lg p-2.5 border border-outline-variant/20">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono font-bold text-[11px] text-primary">
                          {evt.action}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant">
                          {evt.created_at ? new Date(evt.created_at).toLocaleTimeString() : '—'}
                        </span>
                      </div>
                      <p className="text-on-surface font-medium text-xs truncate">
                        {evt.remarks || `Event on ${evt.entity_type} ${evt.entity_id || ''}`}
                      </p>
                      <div className="text-[10px] text-on-surface-variant font-mono mt-1">
                        Actor: {evt.performed_by || 'SYSTEM'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OperationalOverview;
