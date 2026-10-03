import { useState } from 'react';
import { 
  Building2, 
  Building, 
  Users, 
  MapPin, 
  Search, 
  Filter, 
  Plus, 
  Landmark, 
  Factory, 
  MonitorSmartphone, 
  Check, 
  X, 
  Edit2, 
  MoreVertical,
  CloudDownload,
  RefreshCw,
  Info,
  Network,
  ShieldCheck,
  FileSignature
} from 'lucide-react';

export function MasterData() {
  const [activeTab, setActiveTab] = useState('VERTICALS');

  return (
    <main className="flex-1 flex flex-col overflow-y-auto bg-background focus:outline-none">
      <div className="max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Page Header */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <h1 className="font-headline font-bold text-3xl text-on-surface tracking-tight">Master Data</h1>
            <p className="text-on-surface-variant text-sm mt-1">Manage organizational reference data</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors duration-150" type="button">
              <CloudDownload className="w-4 h-4" />
              <span>Export Schema</span>
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors duration-150" type="button">
              <RefreshCw className="w-4 h-4" />
              <span>Sync All</span>
            </button>
          </div>
        </section>

        {/* Master Data Categories (Tabs Section) */}
        <section className="border-b border-outline-variant/40">
          <div className="flex items-center gap-2 -mb-px overflow-x-auto no-scrollbar">
            {/* Tab 1: Verticals */}
            <button 
              onClick={() => setActiveTab('VERTICALS')}
              className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-headline text-sm whitespace-nowrap rounded-t-lg transition-colors ${activeTab === 'VERTICALS' ? 'border-primary text-primary font-semibold bg-primary-container/10' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/60 font-medium'}`}
              type="button"
            >
              <Building2 className="w-5 h-5" />
              <span>Verticals</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'VERTICALS' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant font-medium'}`}>4</span>
            </button>
            {/* Tab 2: SBUs */}
            <button 
              onClick={() => setActiveTab('SBUS')}
              className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-headline text-sm whitespace-nowrap rounded-t-lg transition-colors ${activeTab === 'SBUS' ? 'border-primary text-primary font-semibold bg-primary-container/10' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/60 font-medium'}`}
              type="button"
            >
              <Building className="w-5 h-5" />
              <span>SBUs</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'SBUS' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant font-medium'}`}>10</span>
            </button>
            {/* Tab 3: Clients */}
            <button 
              onClick={() => setActiveTab('CLIENTS')}
              className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-headline text-sm whitespace-nowrap rounded-t-lg transition-colors ${activeTab === 'CLIENTS' ? 'border-primary text-primary font-semibold bg-primary-container/10' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/60 font-medium'}`}
              type="button"
            >
              <Users className="w-5 h-5" />
              <span>Clients</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'CLIENTS' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant font-medium'}`}>18</span>
            </button>
            {/* Tab 4: Locations */}
            <button 
              onClick={() => setActiveTab('LOCATIONS')}
              className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-headline text-sm whitespace-nowrap rounded-t-lg transition-colors ${activeTab === 'LOCATIONS' ? 'border-primary text-primary font-semibold bg-primary-container/10' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/60 font-medium'}`}
              type="button"
            >
              <MapPin className="w-5 h-5" />
              <span>Locations</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'LOCATIONS' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant font-medium'}`}>6</span>
            </button>
          </div>
        </section>

        {/* Action Toolbar */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <Search className="w-5 h-5" />
            </div>
            <input className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/70 rounded-lg text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150 shadow-xs" placeholder="Search vertical code or name..." type="text"/>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors" type="button">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button className="bg-primary hover:bg-primary-dim text-on-primary font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all duration-150 active:scale-95 text-sm" type="button">
              <Plus className="w-5 h-5 font-bold" />
              <span>Add Vertical</span>
            </button>
          </div>
        </section>

        {/* Verticals Data Table Container */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/50 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-mono">
                  <th className="py-3 px-5 w-48" scope="col">Code</th>
                  <th className="py-3 px-5" scope="col">Name</th>
                  <th className="py-3 px-5 w-36" scope="col">Status</th>
                  <th className="py-3 px-5 w-36 text-center" scope="col">SBUs Count</th>
                  <th className="py-3 px-5 w-44 text-right" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {/* TODO: Phase 6 - Fetch and map master data (Verticals, SBUs, Clients, Locations) from masterApi */}
                <tr>
                  <td colSpan="5" className="py-8 text-center text-on-surface-variant text-sm">
                    No data available.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table Footer / Telemetry Summary */}
          <div className="px-6 py-3.5 bg-surface-container-low border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <span>Showing <strong>0</strong> active records</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-outline">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Auto-sync live</span>
              </div>
              <span className="text-outline-variant">|</span>
              <span className="font-mono text-[11px] text-on-surface-variant">Last schema validation: 2 mins ago</span>
            </div>
          </div>
        </section>

        {/* Contextual Master Data Cards (Bento Information Blocks) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Vertical Hierarchy</span>
              <span className="text-sm font-semibold text-on-surface mt-0.5">Strict SBU-to-Client Binding</span>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">All 4 active verticals map automatically into master reporting ledgers and access scopes.</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Access Scope</span>
              <span className="text-sm font-semibold text-on-surface mt-0.5">Global Super Admin Access</span>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Modifications take immediate effect across production workflows and process instances.</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container text-tertiary flex items-center justify-center shrink-0">
              <FileSignature className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Audit Integrity</span>
              <span className="text-sm font-semibold text-on-surface mt-0.5">Immutable Change Logging</span>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Inline adjustments to Vertical labels are recorded with cryptographic session hashes.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
