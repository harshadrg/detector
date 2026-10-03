import { ArrowLeft, Info, Shapes, MapPin, Calendar, Users, UserCheck, Building2, UserCog, User, Lock, CheckCircle } from 'lucide-react';
import { NavLink } from 'react-router';

export function RegisterProcess() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Navigation Header */}
      <div className="flex flex-col gap-2">
        <NavLink to="/registry" className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors duration-150 w-fit">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Process Registry</span>
        </NavLink>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1">
          <div>
            <h1 className="font-headline font-bold text-2xl text-on-surface tracking-tight">Register New Process</h1>
            <p className="font-body text-sm text-on-surface-variant mt-0.5">Manually create a new process registry entry</p>
          </div>
          {/* Environment & Scope Tag */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container-high text-xs font-medium text-on-surface border border-outline-variant">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Scope: Core Enterprise Operations
            </span>
          </div>
        </div>
      </div>

      {/* Informative Helper Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-lowest border border-secondary-fixed shadow-sm">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 text-xs leading-relaxed text-on-surface">
          <strong className="font-semibold text-primary uppercase tracking-wider">FORM VALIDATION & GOVERNANCE — </strong>
          <span>Required fields marked with an asterisk (*). Processes created with <span className="inline-block px-1.5 py-0.5 rounded font-semibold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">TRANSITION</span> status can defer Client and Process Name assignment.</span>
        </div>
      </div>

      {/* Main Form Container */}
      <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
        {/* Two-Column Main Form Card */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Process Details */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-2 border-b border-surface-container">
                <Shapes className="w-5 h-5 text-primary" />
                <h2 className="font-headline font-semibold text-sm text-on-surface tracking-tight">Process Details</h2>
              </div>

              {/* Vertical * (Required Dropdown) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between" htmlFor="vertical-select">
                  <span>Vertical <span className="text-error">*</span></span>
                  <span className="text-[11px] text-on-surface-variant font-normal">Primary Sector</span>
                </label>
                <div className="relative">
                  {/* TODO: Phase 6 - Fetch Vertical taxonomy from masterApi */}
                  <select id="vertical-select" className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2.5 px-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                    <option value="">Select Vertical...</option>
                  </select>
                </div>
                <p className="text-[11px] text-on-surface-variant">Governing industry vertical taxonomy.</p>
              </div>

              {/* SBU (Cascaded Dropdown) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface" htmlFor="sbu-select">
                  Strategic Business Unit (SBU) <span className="text-error">*</span>
                </label>
                {/* TODO: Phase 6 - Fetch SBUs dynamically based on Vertical via masterApi */}
                <select id="sbu-select" className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2.5 px-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                  <option value="">Select SBU...</option>
                </select>
                <p className="text-[11px] text-on-surface-variant">Cascades dynamically from selected Vertical taxonomy.</p>
              </div>

              {/* Process Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between" htmlFor="process-name">
                  <span>Process Name</span>
                  <span className="text-[11px] text-on-surface-variant font-normal">Optional for TRANSITION</span>
                </label>
                <input id="process-name" type="text" placeholder="e.g. Treasury Operations Clearing" className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                <p className="text-[11px] text-on-surface-variant">Descriptive title of the operational workflow unit.</p>
              </div>

              {/* Client (Searchable Dropdown) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between" htmlFor="client-search">
                  <span>Client <span className="text-error">*</span></span>
                  <span className="text-[11px] text-on-surface-variant font-normal">Registered Entity</span>
                </label>
                <div className="relative">
                  <input id="client-search" type="text" placeholder="Select or search client (e.g. HDFC Bank, ICICI, Nykaa)..." className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
                <p className="text-[11px] text-on-surface-variant">Associated master corporate or contract partner.</p>
              </div>

              {/* Client Type & WPS Code Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="client-type">Client Type</label>
                  <select id="client-type" className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                    <option value="DOMESTIC">DOMESTIC</option>
                    <option value="INTERNATIONAL">INTERNATIONAL</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="wps-code">WPS Code</label>
                  <input id="wps-code" type="text" placeholder="e.g. WPS-BFSI-088" className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
              </div>
              <p className="text-[11px] text-on-surface-variant -mt-2">Work Breakdown Structure code, unique identifier.</p>

              {/* Initial Status * */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="text-xs font-semibold text-on-surface">
                  Initial Status <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* ACTIVE Option */}
                  <label className="relative flex items-center justify-between p-3 rounded-lg border-2 border-primary bg-secondary-container/20 cursor-pointer hover:border-primary transition-all">
                    <div className="flex items-center gap-2">
                      <input type="radio" name="initial-status" value="ACTIVE" className="text-primary focus:ring-primary h-4 w-4" defaultChecked />
                      <span className="text-xs font-semibold text-on-surface">Active Production</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">ACTIVE</span>
                  </label>
                  {/* TRANSITION Option */}
                  <label className="relative flex items-center justify-between p-3 rounded-lg border border-outline-variant bg-surface-bright hover:border-outline cursor-pointer transition-all">
                    <div className="flex items-center gap-2">
                      <input type="radio" name="initial-status" value="TRANSITION" className="text-primary focus:ring-primary h-4 w-4" />
                      <span className="text-xs font-medium text-on-surface">Transition Phase</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-amber-100 text-amber-900 border border-amber-300">TRANSITION</span>
                  </label>
                </div>
                <p className="text-[11px] text-on-surface-variant">ACTIVE mandates immediate date assignment and live registry sync.</p>
              </div>
            </div>

            {/* Right Column: Location & Operational Dates */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-2 border-b border-surface-container">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="font-headline font-semibold text-sm text-on-surface tracking-tight">Location & Operational Dates</h2>
              </div>

              {/* State & City Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="state-input">State</label>
                  <input id="state-input" type="text" placeholder="e.g. Maharashtra, Karnataka" className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="city-input">City</label>
                  <input id="city-input" type="text" placeholder="e.g. Mumbai, Bengaluru" className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
              </div>

              {/* Facility Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface" htmlFor="facility-input">Facility Name / Delivery Center</label>
                <input id="facility-input" type="text" placeholder="e.g. Andheri DC, Whitefield Campus" className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                <p className="text-[11px] text-on-surface-variant">Physical or Virtual center hosting this operation.</p>
              </div>

              {/* Operational Dates Cluster */}
              <div className="bg-surface-container-low p-4 rounded-lg border border-surface-variant flex flex-col gap-4">
                <span className="text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  Service Lifecycle Windows
                </span>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="started-on">
                    Started On <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input id="started-on" type="date" className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                  </div>
                  <p className="text-[11px] text-on-surface-variant">Required when Initial Status is set to ACTIVE.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="ended-on">Ended On</label>
                  <div className="relative">
                    <input id="ended-on" type="date" className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                  </div>
                  <p className="text-[11px] text-on-surface-variant">Optional / deactivation date if predefined lifecycle window.</p>
                </div>
              </div>

              {/* SLA / Service Category Badge Preview */}
              <div className="p-3.5 rounded-lg border border-outline-variant bg-surface-container/50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">Operational Tier Classification</span>
                  <span className="text-[11px] text-on-surface-variant">Default: Standard Enterprise L1 Tier</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary-fixed text-on-primary-fixed border border-primary-fixed-dim">TIER-1 CORE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Assign Initial Ownership (Optional) */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-container gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-headline font-semibold text-sm text-on-surface tracking-tight">Assign Initial Ownership (Optional)</h2>
              </div>
              <p className="font-body text-xs text-on-surface-variant mt-1">Assign standard 5-level governance chain. Unassigned roles can be mapped later or handled via automated escalation.</p>
            </div>
            <span className="inline-flex items-center text-[11px] text-on-surface-variant font-medium bg-surface-container px-2.5 py-1 rounded">5 Levels Matrix</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Level 1: OPS Quality Head */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-outline-variant bg-surface-bright">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Level 1</span>
                <UserCheck className="w-4 h-4 text-on-surface-variant" />
              </div>
              <span className="text-xs font-semibold text-on-surface truncate">OPS Quality Head</span>
              {/* TODO: Phase 4 - Fetch applicable employees by role from employeeApi */}
              <div className="relative mt-1">
                <select className="w-full text-[11px] rounded border border-outline-variant bg-surface py-1.5 px-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                  <option>Unassigned (Escalate)</option>
                </select>
              </div>
            </div>

            {/* Level 2: CBO */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-outline-variant bg-surface-bright">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Level 2</span>
                <Building2 className="w-4 h-4 text-on-surface-variant" />
              </div>
              <span className="text-xs font-semibold text-on-surface truncate">CBO</span>
              {/* TODO: Phase 4 - Fetch applicable employees by role from employeeApi */}
              <div className="relative mt-1">
                <select className="w-full text-[11px] rounded border border-outline-variant bg-surface py-1.5 px-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                  <option>Unassigned (Escalate)</option>
                </select>
              </div>
            </div>

            {/* Level 3: SBU Head */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-outline-variant bg-surface-bright">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Level 3</span>
                <UserCog className="w-4 h-4 text-on-surface-variant" />
              </div>
              <span className="text-xs font-semibold text-on-surface truncate">SBU Head</span>
              {/* TODO: Phase 4 - Fetch applicable employees by role from employeeApi */}
              <div className="relative mt-1">
                <select className="w-full text-[11px] rounded border border-outline-variant bg-surface py-1.5 px-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                  <option>Unassigned (Escalate)</option>
                </select>
              </div>
            </div>

            {/* Level 4: Account Head */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-outline-variant bg-surface-bright">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Level 4</span>
                <Users className="w-4 h-4 text-on-surface-variant" />
              </div>
              <span className="text-xs font-semibold text-on-surface truncate">Account Head</span>
              {/* TODO: Phase 4 - Fetch applicable employees by role from employeeApi */}
              <div className="relative mt-1">
                <select className="w-full text-[11px] rounded border border-outline-variant bg-surface py-1.5 px-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                  <option>Unassigned (Escalate)</option>
                </select>
              </div>
            </div>

            {/* Level 5: Project Manager [Primary Owner] */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border-2 border-primary/40 bg-secondary-container/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Level 5 • Lead</span>
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-on-surface truncate">Project Manager</span>
              {/* TODO: Phase 4 - Fetch applicable employees by role from employeeApi */}
              <div className="relative mt-1">
                <select className="w-full text-[11px] font-medium rounded border border-outline-variant bg-surface py-1.5 px-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                  <option>Unassigned (Escalate)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Docked Action Bar Card */}
        <div className="sticky bottom-4 z-20 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Lock className="w-4 h-4 text-primary shrink-0" />
            <span>Audit target: Action will create immutable genesis log entry in <strong>Audit Ledger</strong></span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button type="button" className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors duration-150">
              Cancel
            </button>
            <button type="button" className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-secondary-container bg-secondary-container/50 hover:bg-secondary-container border border-outline-variant rounded-lg transition-colors duration-150">
              Save as Draft
            </button>
            <button type="submit" className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-on-primary bg-primary hover:bg-primary-dim shadow-sm rounded-lg transition-colors duration-150">
              <CheckCircle className="w-4 h-4" />
              <span>Create Process</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
