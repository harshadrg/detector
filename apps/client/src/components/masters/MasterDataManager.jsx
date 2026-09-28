import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { masterApi } from '../../lib/api.js';
import { MasterModal } from './MasterModal.jsx';
import {
  Database,
  Layers,
  Briefcase,
  Building2,
  MapPin,
  Search,
  Plus,
  Edit2,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export function MasterDataManager() {
  const { hasPermission } = useAuth();
  const canManageMasters = hasPermission('BPMS.MASTER.MANAGE');

  const [activeTab, setActiveTab] = useState('VERTICALS'); // VERTICALS | SBUS | CLIENTS | LOCATIONS

  // Data lists
  const [verticals, setVerticals] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Modal State
  const [modalCategory, setModalCategory] = useState(null);
  const [modalItem, setModalItem] = useState(null);

  const reloadData = useCallback(() => {
    setIsLoading(true);
    setRefreshIndex((idx) => idx + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        if (activeTab === 'VERTICALS') {
          const res = await masterApi.getVerticals({ search: appliedSearch });
          if (isMounted) setVerticals(res.verticals || []);
        } else if (activeTab === 'SBUS') {
          const [sbuRes, vertRes] = await Promise.all([
            masterApi.getSBUs({ search: appliedSearch }),
            masterApi.getVerticals(),
          ]);
          if (isMounted) {
            setSbus(sbuRes.sbus || []);
            setVerticals(vertRes.verticals || []);
          }
        } else if (activeTab === 'CLIENTS') {
          const res = await masterApi.getClients({ search: appliedSearch });
          if (isMounted) setClients(res.clients || []);
        } else if (activeTab === 'LOCATIONS') {
          const res = await masterApi.getLocations({ search: appliedSearch });
          if (isMounted) setLocations(res.locations || []);
        }
        if (isMounted) setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to retrieve master records.');
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeTab, appliedSearch, refreshIndex]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setSearchInput('');
    setAppliedSearch('');
    setIsLoading(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAppliedSearch(searchInput.trim());
  };

  const handleOpenAdd = () => {
    setModalCategory(
      activeTab === 'VERTICALS'
        ? 'VERTICAL'
        : activeTab === 'SBUS'
        ? 'SBU'
        : activeTab === 'CLIENTS'
        ? 'CLIENT'
        : 'LOCATION'
    );
    setModalItem(null);
  };

  const handleOpenEdit = (item) => {
    setModalCategory(
      activeTab === 'VERTICALS'
        ? 'VERTICAL'
        : activeTab === 'SBUS'
        ? 'SBU'
        : activeTab === 'CLIENTS'
        ? 'CLIENT'
        : 'LOCATION'
    );
    setModalItem(item);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                BPMS Master Data Catalogs
              </h1>
              <p className="text-xs text-slate-500">
                Manage corporate organizational hierarchy, clients & delivery facility locations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={reloadData}
            disabled={isLoading}
            className="p-2.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh master data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {canManageMasters && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                Add{' '}
                {activeTab === 'VERTICALS'
                  ? 'Vertical'
                  : activeTab === 'SBUS'
                  ? 'SBU'
                  : activeTab === 'CLIENTS'
                  ? 'Client'
                  : 'Location'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        {[
          { id: 'VERTICALS', label: 'Business Verticals', icon: Layers, count: verticals.length },
          { id: 'SBUS', label: 'Strategic Business Units', icon: Briefcase, count: sbus.length },
          { id: 'CLIENTS', label: 'Enterprise Clients', icon: Building2, count: clients.length },
          { id: 'LOCATIONS', label: 'Delivery Locations', icon: MapPin, count: locations.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search catalog entries..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="text-xs text-slate-500 font-medium">
          {activeTab === 'VERTICALS' && `${verticals.length} Verticals Registered`}
          {activeTab === 'SBUS' && `${sbus.length} SBUs Registered`}
          {activeTab === 'CLIENTS' && `${clients.length} Clients Registered`}
          {activeTab === 'LOCATIONS' && `${locations.length} Delivery Facilities Registered`}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'VERTICALS' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Vertical Code</th>
                  <th className="py-3 px-4">Vertical Name</th>
                  <th className="py-3 px-4">Associated SBUs</th>
                  <th className="py-3 px-4">Status</th>
                  {canManageMasters && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                      <span>Loading verticals...</span>
                    </td>
                  </tr>
                ) : verticals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No business verticals found.
                    </td>
                  </tr>
                ) : (
                  verticals.map((v) => (
                    <tr key={v.vertical_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {v.vertical_code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {v.vertical_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {v.sbu_count} SBU(s)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            v.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {v.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canManageMasters && (
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(v)}
                            className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors inline-flex items-center space-x-1 text-[11px] cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'SBUS' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">SBU Code</th>
                  <th className="py-3 px-4">SBU Name</th>
                  <th className="py-3 px-4">Parent Vertical</th>
                  <th className="py-3 px-4">Status</th>
                  {canManageMasters && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                      <span>Loading SBUs...</span>
                    </td>
                  </tr>
                ) : sbus.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No Strategic Business Units found.
                    </td>
                  </tr>
                ) : (
                  sbus.map((s) => (
                    <tr key={s.sbu_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {s.sbu_code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {s.sbu_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium text-[11px] border border-indigo-100">
                          {s.vertical_name} ({s.vertical_code})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            s.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canManageMasters && (
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors inline-flex items-center space-x-1 text-[11px] cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'CLIENTS' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Client Organization Name</th>
                  <th className="py-3 px-4">Commercial Geography Type</th>
                  <th className="py-3 px-4">Status</th>
                  {canManageMasters && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                      <span>Loading clients...</span>
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      No client accounts registered.
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => (
                    <tr key={c.client_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {c.client_name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            c.client_type === 'INTERNATIONAL'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {c.client_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            c.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canManageMasters && (
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors inline-flex items-center space-x-1 text-[11px] cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'LOCATIONS' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">State / Territory</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Facility / Campus Name</th>
                  {canManageMasters && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                      <span>Loading delivery facility locations...</span>
                    </td>
                  </tr>
                ) : locations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      No delivery locations registered.
                    </td>
                  </tr>
                ) : (
                  locations.map((loc) => (
                    <tr key={loc.location_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {loc.state}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {loc.city}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {loc.facility_name}
                      </td>
                      {canManageMasters && (
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(loc)}
                            className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors inline-flex items-center space-x-1 text-[11px] cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalCategory && (
        <MasterModal
          key={`${modalCategory}-${modalItem?.vertical_id || modalItem?.sbu_id || modalItem?.client_id || modalItem?.location_id || 'new'}`}
          isOpen={true}
          onClose={() => {
            setModalCategory(null);
            setModalItem(null);
          }}
          category={modalCategory}
          item={modalItem}
          verticals={verticals}
          onSuccess={reloadData}
        />
      )}
    </div>
  );
}
