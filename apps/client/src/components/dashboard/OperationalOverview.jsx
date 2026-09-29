import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { employeeApi, masterApi, auditApi, importApi } from '../../lib/api.js';
import {
  ShieldCheck,
  Users,
  Database,
  ScrollText,
  FileSpreadsheet,
  ArrowRight,
  Key,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export function OperationalOverview({ onNavigate }) {
  const { user, permissions, activeContextRole } = useAuth();

  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    verticalsCount: 0,
    sbusCount: 0,
    clientsCount: 0,
    locationsCount: 0,
    recentAudits: [],
    latestBatch: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadTelemetry() {
      try {
        const [empRes, masterRes, auditRes, batchRes] = await Promise.all([
          employeeApi.list({ pageSize: 1 }).catch(() => ({ meta: { totalCount: 0 } })),
          masterApi.getAll().catch(() => ({ verticals: [], sbus: [], clients: [], locations: [] })),
          auditApi.getEvents({ pageSize: 4 }).catch(() => ({ events: [] })),
          importApi.listBatches({ pageSize: 1 }).catch(() => ({ batches: [] })),
        ]);

        if (isMounted) {
          setMetrics({
            totalEmployees: empRes.meta?.totalCount || 0,
            verticalsCount: masterRes.verticals?.length || 0,
            sbusCount: masterRes.sbus?.length || 0,
            clientsCount: masterRes.clients?.length || 0,
            locationsCount: masterRes.locations?.length || 0,
            recentAudits: auditRes.events || [],
            latestBatch: batchRes.batches?.[0] || null,
          });
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTelemetry();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const corePermissions = permissions.filter((p) => p.startsWith('CORE.'));
  const bpmsPermissions = permissions.filter((p) => p.startsWith('BPMS.'));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Operational Governance Overview
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Centralized telemetry across identity, organizational hierarchy, master catalogs, and audit ledger.
                All metrics strictly query live tables in Microsoft SQL Server.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Session Context
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 inline-block mt-0.5">
                {activeContextRole ? `Simulating ${activeContextRole}` : 'Real Platform Identity'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div
          onClick={() => onNavigate && onNavigate('employees')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Employees Registered
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : metrics.totalEmployees}
          </div>
          <div className="flex items-center text-[11px] text-indigo-600 font-medium mt-1">
            <span>Inspect directory</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Master Verticals & SBUs */}
        <div
          onClick={() => onNavigate && onNavigate('masters')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              BPMS Structure
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              `${metrics.verticalsCount} Verticals / ${metrics.sbusCount} SBUs`
            )}
          </div>
          <div className="flex items-center text-[11px] text-emerald-600 font-medium mt-1">
            <span>Manage catalogs</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Clients & Locations */}
        <div
          onClick={() => onNavigate && onNavigate('masters')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Clients & Locations
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              `${metrics.clientsCount} Clients / ${metrics.locationsCount} Facilities`
            )}
          </div>
          <div className="flex items-center text-[11px] text-blue-600 font-medium mt-1">
            <span>View delivery centers</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Staged Excel Pipeline */}
        <div
          onClick={() => onNavigate && onNavigate('imports')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Spreadsheet Ingestion
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2 truncate">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : metrics.latestBatch ? (
              `Batch #${metrics.latestBatch.batch_id} (${metrics.latestBatch.status})`
            ) : (
              'Ready for Ingestion'
            )}
          </div>
          <div className="flex items-center text-[11px] text-purple-600 font-medium mt-1">
            <span>Open ingestion pipeline</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Main Grid: Active User Capabilities & Recent Audit Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capability Engine Profile */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Active Capability Tokens ({permissions.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Resolved dynamically by backend RBAC & ABAC engine for {user?.name || user?.ecode}
              </p>
            </div>
          </div>

          {/* Module Tokens */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block mb-1.5">
                Core Platform Capabilities ({corePermissions.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {corePermissions.map((perm) => (
                  <span
                    key={perm}
                    className="font-mono text-[10px] font-medium bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1.5">
                BPMS Module Capabilities ({bpmsPermissions.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {bpmsPermissions.map((perm) => (
                  <span
                    key={perm}
                    className="font-mono text-[10px] font-medium bg-emerald-50/70 border border-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-md"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Audit Activity */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                <ScrollText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Immutable Audit Activity
                </h3>
                <p className="text-[11px] text-slate-400">
                  Most recent verified state transitions recorded in dbo.Audit_Events
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('audit')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View Ledger
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {metrics.recentAudits.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No audit events recorded yet. Perform actions to emit tamper-proof records.
              </div>
            ) : (
              metrics.recentAudits.map((ev) => (
                <div key={ev.event_id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                        {ev.module_code}
                      </span>
                      <span className="font-semibold text-slate-800">{ev.action}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Entity: {ev.entity_type} #{ev.entity_id} • By {ev.performed_by_name || ev.performed_by}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
