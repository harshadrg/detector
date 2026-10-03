import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowRightLeft, 
  Wrench, 
  Info, 
  ChevronDown, 
  Search, 
  ChevronRight, 
  Calendar, 
  ArrowRight 
} from 'lucide-react';
import { handoverApi } from '../../lib/api.js';
import { Modal } from '../../components/ui/Modal.jsx';

export function PMHandovers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch pending handovers
  const { data } = useQuery({
    queryKey: ['pending-handovers'],
    queryFn: () => handoverApi.listPendingHandovers(),
  });

  const rawHandovers = data?.handovers || [];

  // Hardcode fallback data since Phase 11 backend might not return the exact mock structures in the Stitch UI
  const displayItems = rawHandovers.length > 0 ? rawHandovers : [
    {
      handover_id: 'HO-001',
      registry_code: 'PRC-0089',
      process_name: 'Risk Analytics Platform',
      scenario: 'PM_LEFT_COMPANY',
      from_pm: { init: 'RH', name: 'Rarata H', color: 'bg-surface-container-high text-on-surface' },
      to_pm: { init: 'AR', name: 'Amit R', color: 'bg-primary-container text-on-primary-container' },
      status: 'SUBMITTED',
      requested_time: '5h ago'
    },
    {
      handover_id: 'HO-002',
      registry_code: 'PRC-0045',
      process_name: 'Cloud Migration',
      scenario: 'PM_MOVED_PROJECT',
      from_pm: { init: 'PG', name: 'Pooja G', color: 'bg-surface-container-high text-on-surface' },
      to_pm: { init: 'PM', name: 'Priya M', color: 'bg-primary-container text-on-primary-container' },
      status: 'APPROVED',
      requested_time: '2d ago'
    },
    {
      handover_id: 'HO-003',
      registry_code: 'PRC-0128',
      process_name: 'Market Research & Intel',
      scenario: 'ADMIN_OVERRIDE',
      from_pm: null, // Unassigned
      to_pm: { init: 'SF', name: 'Saurabh F', color: 'bg-primary-container text-on-primary-container' },
      status: 'EXECUTED',
      requested_time: '5d ago'
    },
    {
      handover_id: 'HO-004',
      registry_code: 'PRC-0012',
      process_name: 'Payment Gateway Operations',
      scenario: 'TEMPORARY_HANDOVER',
      from_pm: { init: 'AR', name: 'Amit R', color: 'bg-surface-container-high text-on-surface' },
      to_pm: { init: 'RK', name: 'Rajesh K', color: 'bg-primary-container text-on-primary-container' },
      status: 'REJECTED',
      requested_time: '1w ago'
    }
  ];

  const filteredItems = displayItems.filter(item => {
    const matchesSearch = item.handover_id.toLowerCase().includes(search.toLowerCase()) || 
                          item.process_name.toLowerCase().includes(search.toLowerCase()) ||
                          item.registry_code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getScenarioBadge = (scenario) => {
    switch(scenario) {
      case 'PM_MOVED_PROJECT': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">PM_MOVED_PROJECT</span>;
      case 'PM_ROLE_CHANGE': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200">PM_ROLE_CHANGE</span>;
      case 'PM_LEFT_COMPANY': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">PM_LEFT_COMPANY</span>;
      case 'TEMPORARY_HANDOVER': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-teal-50 text-teal-700 border border-teal-200">TEMPORARY_HANDOVER</span>;
      case 'ESCALATION': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-orange-50 text-orange-700 border border-orange-200">ESCALATION</span>;
      case 'ADMIN_OVERRIDE': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">ADMIN_OVERRIDE</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-surface-container text-on-surface border border-outline-variant/50">{scenario}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SUBMITTED': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">SUBMITTED</span>;
      case 'UNDER_REVIEW': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono bg-purple-50 text-purple-700 border border-purple-200">UNDER_REVIEW</span>;
      case 'APPROVED': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">APPROVED</span>;
      case 'REJECTED': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono bg-red-50 text-red-700 border border-red-200">REJECTED</span>;
      case 'EXECUTED': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">EXECUTED</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono bg-surface-container text-on-surface border border-outline-variant">{status}</span>;
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-6 py-6 px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface tracking-tight">PM Handovers</h1>
          <p className="text-sm text-on-surface-variant mt-0.5 font-normal">Scenario-driven project manager ownership transfers</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dim text-on-primary text-sm font-medium rounded-lg shadow-sm transition-colors duration-150"
        >
          <ArrowRightLeft className="w-5 h-5" />
          <span>+ Initiate Handover</span>
        </button>
      </div>

      {/* Amber Warning / Construction Container */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3.5 shadow-sm">
        <Wrench className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h2 className="text-xs font-mono font-bold text-amber-900 tracking-wide">
            BACKEND API PENDING • STAGING PREVIEW • SPEC v4.2
          </h2>
          <p className="text-xs text-amber-800 mt-0.5 font-normal leading-relaxed">
            This screen requires the Handover request and review endpoints (Phase 11) which are not yet built. The UI layout is designed and ready for integration.
          </p>
        </div>
        <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">Phase 11 Ready</span>
      </div>

      {/* Scenarios Visual Legend Bar */}
      <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium text-on-surface-variant flex items-center gap-1.5">
          <Info className="w-4 h-4" />
          Handover Scenarios:
        </span>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          {getScenarioBadge('PM_MOVED_PROJECT')}
          {getScenarioBadge('PM_ROLE_CHANGE')}
          {getScenarioBadge('PM_LEFT_COMPANY')}
          {getScenarioBadge('TEMPORARY_HANDOVER')}
          {getScenarioBadge('ESCALATION')}
          {getScenarioBadge('ADMIN_OVERRIDE')}
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <div className="relative inline-block">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium bg-surface-container-low border border-outline-variant/60 rounded-lg text-on-surface hover:bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">Status: All</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="EXECUTED">EXECUTED</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1.5 pointer-events-none text-on-surface-variant" />
          </div>
          
          {/* Search Input */}
          <div className="relative w-72 sm:w-80">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-2.5 top-1.5" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-container-low border border-outline-variant/60 rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="Search by handover ID, process, or PM..." 
              type="text"
            />
          </div>
        </div>
        
        {/* Total Count Badge */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-surface-container-high text-on-surface-variant font-mono">
            {filteredItems.length} Total Handovers
          </span>
        </div>
      </div>

      {/* Main Data Table Container */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low/70 border-b border-outline-variant text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Handover ID</th>
                <th className="py-3 px-4">Process</th>
                <th className="py-3 px-4">Scenario</th>
                <th className="py-3 px-4">From PM</th>
                <th className="py-3 px-4">To PM</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Requested</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 font-body">
              {filteredItems.map(item => (
                <tr key={item.handover_id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-on-surface">{item.handover_id}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-on-surface">{item.registry_code}</div>
                    <div className="text-[11px] text-on-surface-variant">{item.process_name}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {getScenarioBadge(item.scenario)}
                  </td>
                  <td className="py-3.5 px-4">
                    {item.from_pm ? (
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${item.from_pm.color}`}>{item.from_pm.init}</span>
                        <span className="font-medium text-on-surface">{item.from_pm.name}</span>
                      </div>
                    ) : (
                      <span className="text-on-surface-variant font-mono italic">— (Unassigned/System)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${item.to_pm.color}`}>{item.to_pm.init}</span>
                      <span className="font-medium text-on-surface">{item.to_pm.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="py-3.5 px-4 text-on-surface-variant font-mono">{item.requested_time}</td>
                  <td className="py-3.5 px-4 text-right">
                    {item.status === 'SUBMITTED' ? (
                      <button className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-on-primary hover:bg-primary-dim rounded font-medium text-xs transition-colors shadow-xs">
                        <span>Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button className="inline-flex items-center gap-1 px-2.5 py-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded font-medium text-xs transition-colors">
                        <span>View</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-on-surface-variant">
                    No handovers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay (Initiate PM Handover) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={
          <div>
            <div className="text-lg font-headline font-bold text-on-surface tracking-tight">Initiate PM Handover</div>
            <p className="text-xs text-on-surface-variant mt-0.5 font-normal">Submit ownership transfer request for administrative approval or execution.</p>
          </div>
        }
      >
        <form className="space-y-4 text-xs font-body" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          {/* Process Field */}
          <div>
            <label className="block font-medium text-on-surface mb-1">
              Process <span className="text-error">*</span>
            </label>
            <div className="relative">
              <select defaultValue="" className="w-full appearance-none bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary pr-8 cursor-pointer">
                <option disabled value="">Select process (e.g. PRC-0001 - Payment Gateway Ops)</option>
                <option value="PRC-0089">PRC-0089 - Risk Analytics Platform</option>
                <option value="PRC-0045">PRC-0045 - Cloud Migration</option>
                <option value="PRC-0128">PRC-0128 - Market Research & Intel</option>
                <option value="PRC-0012">PRC-0012 - Payment Gateway Operations</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 pointer-events-none text-on-surface-variant" />
            </div>
            <span className="text-[11px] text-on-surface-variant mt-0.5 block">Search by process code or functional name.</span>
          </div>

          {/* New Project Manager Field */}
          <div>
            <label className="block font-medium text-on-surface mb-1">
              New Project Manager <span className="text-error">*</span>
            </label>
            <div className="relative">
              <select defaultValue="" className="w-full appearance-none bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary pr-8 cursor-pointer">
                <option disabled value="">Select active PM</option>
                <option value="Amit R">Amit R (E1008 - Active PM)</option>
                <option value="Priya M">Priya M (E1045 - Active PM)</option>
                <option value="Saurabh F">Saurabh F (E1092 - Active PM)</option>
                <option value="Rajesh K">Rajesh K (E1021 - Active PM)</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 pointer-events-none text-on-surface-variant" />
            </div>
            <span className="text-[11px] text-on-surface-variant mt-0.5 block">Must be an active employee with PM authority.</span>
          </div>

          {/* Handover Scenario Field */}
          <div>
            <label className="block font-medium text-on-surface mb-1">
              Handover Scenario <span class="text-error">*</span>
            </label>
            <div className="relative">
              <select defaultValue="PM_MOVED_PROJECT" className="w-full appearance-none bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary pr-8 cursor-pointer font-mono">
                <option value="PM_MOVED_PROJECT">PM_MOVED_PROJECT</option>
                <option value="PM_ROLE_CHANGE">PM_ROLE_CHANGE</option>
                <option value="PM_LEFT_COMPANY">PM_LEFT_COMPANY</option>
                <option value="TEMPORARY_HANDOVER">TEMPORARY_HANDOVER</option>
                <option value="ESCALATION">ESCALATION</option>
                <option value="ADMIN_OVERRIDE">ADMIN_OVERRIDE</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 pointer-events-none text-on-surface-variant" />
            </div>
          </div>

          {/* Effective Date Field */}
          <div>
            <label className="block font-medium text-on-surface mb-1">
              Effective Date <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input defaultValue="2025-06-01" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary pr-8 font-mono" type="date" />
              <Calendar className="w-4 h-4 absolute right-2.5 top-2.5 pointer-events-none text-on-surface-variant" />
            </div>
          </div>

          {/* Reason Field */}
          <div>
            <label className="block font-medium text-on-surface mb-1">
              Reason <span className="text-error">*</span>
            </label>
            <textarea className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="Provide operational justification or audit rationale for this PM ownership transfer..." rows="3"></textarea>
            <span className="text-[11px] text-on-surface-variant mt-0.5 block">Recorded permanently in the immutable audit ledger.</span>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/50">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-outline rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dim text-on-primary rounded-lg font-medium text-xs transition-colors shadow-sm"
            >
              <span>Submit Handover Request</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
