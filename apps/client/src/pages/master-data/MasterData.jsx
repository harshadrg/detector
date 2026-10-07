import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { masterApi } from '../../lib/api';
import { 
  Building2, 
  Building, 
  Users, 
  MapPin, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Info,
  Network,
  ShieldCheck,
  FileSignature
} from 'lucide-react';

import { MasterEntityModal } from './MasterEntityModal';

export function MasterData() {
  const [activeTab, setActiveTab] = useState('VERTICALS');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const { data: verticalsData, isLoading: isLoadingVerticals } = useQuery({
    queryKey: ['master-verticals', search],
    queryFn: () => masterApi.getVerticals({ search }),
  });

  const { data: sbusData, isLoading: isLoadingSBUs } = useQuery({
    queryKey: ['master-sbus', search],
    queryFn: () => masterApi.getSBUs({ search }),
  });

  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ['master-clients', search],
    queryFn: () => masterApi.getClients({ search }),
  });

  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['master-locations', search],
    queryFn: () => masterApi.getLocations({ search }),
  });

  const verticals = verticalsData?.verticals || [];
  const sbus = sbusData?.sbus || [];
  const clients = clientsData?.clients || [];
  const locations = locationsData?.locations || [];

  const getTableData = () => {
    switch(activeTab) {
      case 'VERTICALS': return { data: verticals, loading: isLoadingVerticals };
      case 'SBUS': return { data: sbus, loading: isLoadingSBUs };
      case 'CLIENTS': return { data: clients, loading: isLoadingClients };
      case 'LOCATIONS': return { data: locations, loading: isLoadingLocations };
      default: return { data: [], loading: false };
    }
  };

  const { data: currentData, loading: isCurrentLoading } = getTableData();

  return (
    <main className="flex-1 flex flex-col overflow-y-auto bg-background focus:outline-none">
      <div className="max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Page Header */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <h1 className="font-headline font-bold text-3xl text-on-surface tracking-tight">Master Data</h1>
            <p className="text-on-surface-variant text-sm mt-1">Manage organizational reference data</p>
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
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'VERTICALS' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant font-medium'}`}>{verticals.length}</span>
            </button>
            {/* Tab 2: SBUs */}
            <button 
              onClick={() => setActiveTab('SBUS')}
              className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-headline text-sm whitespace-nowrap rounded-t-lg transition-colors ${activeTab === 'SBUS' ? 'border-primary text-primary font-semibold bg-primary-container/10' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/60 font-medium'}`}
              type="button"
            >
              <Building className="w-5 h-5" />
              <span>SBUs</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'SBUS' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant font-medium'}`}>{sbus.length}</span>
            </button>
            {/* Tab 3: Clients */}
            <button 
              onClick={() => setActiveTab('CLIENTS')}
              className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-headline text-sm whitespace-nowrap rounded-t-lg transition-colors ${activeTab === 'CLIENTS' ? 'border-primary text-primary font-semibold bg-primary-container/10' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/60 font-medium'}`}
              type="button"
            >
              <Users className="w-5 h-5" />
              <span>Clients</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'CLIENTS' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant font-medium'}`}>{clients.length}</span>
            </button>
            {/* Tab 4: Locations */}
            <button 
              onClick={() => setActiveTab('LOCATIONS')}
              className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-headline text-sm whitespace-nowrap rounded-t-lg transition-colors ${activeTab === 'LOCATIONS' ? 'border-primary text-primary font-semibold bg-primary-container/10' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/60 font-medium'}`}
              type="button"
            >
              <MapPin className="w-5 h-5" />
              <span>Locations</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'LOCATIONS' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant font-medium'}`}>{locations.length}</span>
            </button>
          </div>
        </section>

        {/* Action Toolbar */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <Search className="w-5 h-5" />
            </div>
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/70 rounded-lg text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150 shadow-xs" 
              placeholder={`Search ${activeTab.toLowerCase()}...`} 
              type="text"
            />
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors" type="button">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button 
              onClick={() => { setSelectedEntity(null); setIsModalOpen(true); }}
              className="bg-primary hover:bg-primary-dim text-on-primary font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all duration-150 active:scale-95 text-sm" 
              type="button"
            >
              <Plus className="w-5 h-5 font-bold" />
              <span>Add {activeTab.slice(0, -1)}</span>
            </button>
          </div>
        </section>

        {/* Data Table Container */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/50 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-mono">
                  {activeTab === 'VERTICALS' && (
                    <>
                      <th className="py-3 px-5 w-48" scope="col">Code</th>
                      <th className="py-3 px-5" scope="col">Name</th>
                      <th className="py-3 px-5 w-36" scope="col">Status</th>
                      <th className="py-3 px-5 w-44 text-right" scope="col">Actions</th>
                    </>
                  )}
                  {activeTab === 'SBUS' && (
                    <>
                      <th className="py-3 px-5 w-48" scope="col">Code</th>
                      <th className="py-3 px-5" scope="col">Name</th>
                      <th className="py-3 px-5" scope="col">Vertical</th>
                      <th className="py-3 px-5 w-36" scope="col">Status</th>
                      <th className="py-3 px-5 w-44 text-right" scope="col">Actions</th>
                    </>
                  )}
                  {activeTab === 'CLIENTS' && (
                    <>
                      <th className="py-3 px-5 w-48" scope="col">Client ID</th>
                      <th className="py-3 px-5" scope="col">Name</th>
                      <th className="py-3 px-5" scope="col">Type</th>
                      <th className="py-3 px-5 w-36" scope="col">Status</th>
                      <th className="py-3 px-5 w-44 text-right" scope="col">Actions</th>
                    </>
                  )}
                  {activeTab === 'LOCATIONS' && (
                    <>
                      <th className="py-3 px-5 w-48" scope="col">Location ID</th>
                      <th className="py-3 px-5" scope="col">City</th>
                      <th className="py-3 px-5" scope="col">State</th>
                      <th className="py-3 px-5 w-36" scope="col">Status</th>
                      <th className="py-3 px-5 w-44 text-right" scope="col">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {isCurrentLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-on-surface-variant text-sm">
                      Loading data...
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-on-surface-variant text-sm">
                      No data available.
                    </td>
                  </tr>
                ) : (
                  currentData.map((item) => (
                    <tr key={item.id || item.vertical_id || item.sbu_id || item.client_id || item.location_id} className="hover:bg-surface-container/30 transition-colors">
                      {activeTab === 'VERTICALS' && (
                        <>
                          <td className="py-3 px-5 font-mono text-primary font-medium">{item.vertical_code}</td>
                          <td className="py-3 px-5 text-on-surface">{item.vertical_name}</td>
                          <td className="py-3 px-5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${item.is_active ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'SBUS' && (
                        <>
                          <td className="py-3 px-5 font-mono text-primary font-medium">{item.sbu_code}</td>
                          <td className="py-3 px-5 text-on-surface">{item.sbu_name}</td>
                          <td className="py-3 px-5 text-on-surface">{item.vertical_name || item.vertical_code}</td>
                          <td className="py-3 px-5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${item.is_active ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'CLIENTS' && (
                        <>
                          <td className="py-3 px-5 font-mono text-primary font-medium">{item.client_id}</td>
                          <td className="py-3 px-5 text-on-surface">{item.client_name}</td>
                          <td className="py-3 px-5 text-on-surface">{item.client_type}</td>
                          <td className="py-3 px-5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${item.is_active ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'LOCATIONS' && (
                        <>
                          <td className="py-3 px-5 font-mono text-primary font-medium">{item.location_id}</td>
                          <td className="py-3 px-5 text-on-surface">{item.city}</td>
                          <td className="py-3 px-5 text-on-surface">{item.state}</td>
                          <td className="py-3 px-5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${item.is_active ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="py-3 px-5 text-right">
                        <button 
                          onClick={() => { setSelectedEntity(item); setIsModalOpen(true); }}
                          className="text-on-surface-variant hover:text-primary transition-colors p-1" 
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Telemetry Summary */}
          <div className="px-6 py-3.5 bg-surface-container-low border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <span>Showing <strong>{currentData.length}</strong> records</span>
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
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">All {verticals.length} active verticals map automatically into master reporting ledgers and access scopes.</p>
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

      <MasterEntityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityType={activeTab}
        initialData={selectedEntity}
        verticals={verticals}
      />
    </main>
  );
}

