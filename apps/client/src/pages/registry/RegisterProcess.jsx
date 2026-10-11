import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Info, Shapes, MapPin, Calendar, Users, UserCheck, Building2, UserCog, User, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { NavLink } from 'react-router';
import { processApi, masterApi, employeeApi } from '../../lib/api.js';

export function RegisterProcess() {
  const navigate = useNavigate();
  const [masters, setMasters] = useState({ verticals: [], sbus: [], clients: [] });
  const [roleHolders, setRoleHolders] = useState({
    OPS_QUALITY_HEAD: [],
    CBO: [],
    SBU_HEAD: [],
    ACCOUNT_HEAD: [],
    PROJECT_MANAGER: [],
  });
  
  const [formData, setFormData] = useState({
    vertical_id: '',
    sbu_id: '',
    process_name: '',
    client_id: '',
    client_type: 'DOMESTIC',
    wps_code: '',
    status: 'ACTIVE',
    state: '',
    city: '',
    facility_name: '',
    started_on: '',
    ended_on: '',
    ops_head_ecode: '',
    cbo_ecode: '',
    sbu_head_ecode: '',
    account_head_ecode: '',
    pm_ecode: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    masterApi.getAll().then((data) => {
      if (data) {
        setMasters({
          verticals: data.verticals || [],
          sbus: data.sbus || [],
          clients: data.clients || [],
        });
      }
    }).catch(err => console.warn('Could not load masters', err));

    const roles = ['OPS_QUALITY_HEAD', 'CBO', 'SBU_HEAD', 'ACCOUNT_HEAD', 'PROJECT_MANAGER'];
    roles.forEach(roleCode => {
      employeeApi.list({ page: 1, pageSize: 100, status: 'ACTIVE', role_code: roleCode })
        .then(res => {
          if (Array.isArray(res?.employees)) {
            setRoleHolders(prev => ({ ...prev, [roleCode]: res.employees }));
          }
        })
        .catch(console.warn);
    });
  }, []);

  const filteredSBUs = formData.vertical_id 
    ? masters.sbus.filter(s => String(s.vertical_id) === String(formData.vertical_id))
    : masters.sbus;

  const handleChange = (e) => {
    const { id, name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id || name]: value
    }));
  };

  const handleStatusChange = (status) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const onSubmit = async (e, isDraft = false) => {
    if (e) e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    
    try {
      const payload = {
        vertical_id: Number(formData.vertical_id),
        sbu_id: formData.sbu_id ? Number(formData.sbu_id) : null,
        process_name: formData.process_name?.trim() || null,
        wps_code: formData.wps_code?.trim() || null,
        client_id: formData.client_id ? Number(formData.client_id) : null,
        client_type: formData.client_type || 'DOMESTIC',
        status: isDraft ? 'DRAFT' : formData.status,
        started_on: formData.started_on || null,
        ops_head_ecode: formData.ops_head_ecode?.trim() || null,
        cbo_ecode: formData.cbo_ecode?.trim() || null,
        sbu_head_ecode: formData.sbu_head_ecode?.trim() || null,
        account_head_ecode: formData.account_head_ecode?.trim() || null,
        pm_ecode: formData.pm_ecode?.trim() || null,
      };
      
      const result = await processApi.create(payload);
      navigate(`/registry/${result.process.registry_id}`);
    } catch (err) {
      setSubmitError(err.message || 'Failed to register process.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <form className="flex flex-col gap-6" onSubmit={onSubmit}>
        {submitError && (
          <div role="alert" className="p-3 rounded-lg bg-error/10 border border-error/20 text-error flex items-start gap-2.5 text-xs font-medium">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{submitError}</div>
          </div>
        )}
        
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
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between" htmlFor="vertical_id">
                  <span>Vertical <span className="text-error">*</span></span>
                  <span className="text-[11px] text-on-surface-variant font-normal">Primary Sector</span>
                </label>
                <div className="relative">
                  <select 
                    id="vertical_id" 
                    value={formData.vertical_id}
                    onChange={(e) => {
                      handleChange(e);
                      setFormData(prev => ({ ...prev, sbu_id: '' }));
                    }}
                    required
                    disabled={isSubmitting}
                    className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2.5 px-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  >
                    <option value="">Select Vertical...</option>
                    {masters.verticals.map(v => (
                      <option key={v.vertical_id} value={v.vertical_id}>{v.vertical_code} — {v.vertical_name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-on-surface-variant">Governing industry vertical taxonomy.</p>
              </div>

              {/* SBU (Cascaded Dropdown) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface" htmlFor="sbu_id">
                  Strategic Business Unit (SBU) <span className="text-error">*</span>
                </label>
                <select 
                  id="sbu_id" 
                  value={formData.sbu_id}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2.5 px-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Select SBU...</option>
                  {filteredSBUs.map(s => (
                    <option key={s.sbu_id} value={s.sbu_id}>{s.sbu_code} — {s.sbu_name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-on-surface-variant">Cascades dynamically from selected Vertical taxonomy.</p>
              </div>

              {/* Process Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between" htmlFor="process_name">
                  <span>Process Name</span>
                  <span className="text-[11px] text-on-surface-variant font-normal">Optional for TRANSITION</span>
                </label>
                <input 
                  id="process_name" 
                  value={formData.process_name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  type="text" 
                  placeholder="e.g. Treasury Operations Clearing" 
                  className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                />
                <p className="text-[11px] text-on-surface-variant">Descriptive title of the operational workflow unit.</p>
              </div>

              {/* Client (Dropdown) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between" htmlFor="client_id">
                  <span>Client <span className="text-error">*</span></span>
                  <span className="text-[11px] text-on-surface-variant font-normal">Registered Entity</span>
                </label>
                <div className="relative">
                  <select 
                    id="client_id" 
                    value={formData.client_id}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  >
                    <option value="">Select Client...</option>
                    {masters.clients.map(c => (
                      <option key={c.client_id} value={c.client_id}>{c.client_name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-on-surface-variant">Associated master corporate or contract partner.</p>
              </div>

              {/* Client Type & WPS Code Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="client_type">Client Type</label>
                  <select 
                    id="client_type" 
                    value={formData.client_type}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  >
                    <option value="DOMESTIC">DOMESTIC</option>
                    <option value="INTERNATIONAL">INTERNATIONAL</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="wps_code">WPS Code</label>
                  <input 
                    id="wps_code" 
                    value={formData.wps_code}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    type="text" 
                    placeholder="e.g. WPS-BFSI-088" 
                    className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  />
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
                  <label className={`relative flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.status === 'ACTIVE' ? 'border-primary bg-secondary-container/20' : 'border-transparent bg-surface-bright hover:border-outline-variant'}`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="initial-status" 
                        checked={formData.status === 'ACTIVE'}
                        onChange={() => handleStatusChange('ACTIVE')}
                        disabled={isSubmitting}
                        className="text-primary focus:ring-primary h-4 w-4" 
                      />
                      <span className="text-xs font-semibold text-on-surface">Active Production</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">ACTIVE</span>
                  </label>
                  {/* TRANSITION Option */}
                  <label className={`relative flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${formData.status === 'TRANSITION' ? 'border-primary bg-secondary-container/20' : 'border-outline-variant bg-surface-bright hover:border-outline'}`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="initial-status" 
                        checked={formData.status === 'TRANSITION'}
                        onChange={() => handleStatusChange('TRANSITION')}
                        disabled={isSubmitting}
                        className="text-primary focus:ring-primary h-4 w-4" 
                      />
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
                  <label className="text-xs font-semibold text-on-surface" htmlFor="state">State</label>
                  <input 
                    id="state" 
                    value={formData.state}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    type="text" 
                    placeholder="e.g. Maharashtra, Karnataka" 
                    className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="city">City</label>
                  <input 
                    id="city" 
                    value={formData.city}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    type="text" 
                    placeholder="e.g. Mumbai, Bengaluru" 
                    className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  />
                </div>
              </div>

              {/* Facility Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface" htmlFor="facility_name">Facility Name / Delivery Center</label>
                <input 
                  id="facility_name" 
                  value={formData.facility_name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  type="text" 
                  placeholder="e.g. Andheri DC, Whitefield Campus" 
                  className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                />
                <p className="text-[11px] text-on-surface-variant">Physical or Virtual center hosting this operation.</p>
              </div>

              {/* Operational Dates Cluster */}
              <div className="bg-surface-container-low p-4 rounded-lg border border-surface-variant flex flex-col gap-4">
                <span className="text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  Service Lifecycle Windows
                </span>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="started_on">
                    Started On <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      id="started_on" 
                      value={formData.started_on}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      type="date" 
                      className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant">Required when Initial Status is set to ACTIVE.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="ended_on">Ended On</label>
                  <div className="relative">
                    <input 
                      id="ended_on" 
                      value={formData.ended_on}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      type="date" 
                      className="w-full text-xs rounded-lg border border-outline-variant bg-surface-bright py-2 px-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    />
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
              <div className="relative mt-1">
                <select 
                  id="ops_head_ecode"
                  value={formData.ops_head_ecode}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full text-[11px] rounded border border-outline-variant bg-surface py-1.5 px-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="">Unassigned (Escalate)</option>
                  {roleHolders.OPS_QUALITY_HEAD.map(emp => (
                    <option key={emp.ecode} value={emp.ecode}>{emp.name}</option>
                  ))}
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
              <div className="relative mt-1">
                <select 
                  id="cbo_ecode"
                  value={formData.cbo_ecode}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full text-[11px] rounded border border-outline-variant bg-surface py-1.5 px-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="">Unassigned (Escalate)</option>
                  {roleHolders.CBO.map(emp => (
                    <option key={emp.ecode} value={emp.ecode}>{emp.name}</option>
                  ))}
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
              <div className="relative mt-1">
                <select 
                  id="sbu_head_ecode"
                  value={formData.sbu_head_ecode}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full text-[11px] rounded border border-outline-variant bg-surface py-1.5 px-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="">Unassigned (Escalate)</option>
                  {roleHolders.SBU_HEAD.map(emp => (
                    <option key={emp.ecode} value={emp.ecode}>{emp.name}</option>
                  ))}
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
              <div className="relative mt-1">
                <select 
                  id="account_head_ecode"
                  value={formData.account_head_ecode}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full text-[11px] rounded border border-outline-variant bg-surface py-1.5 px-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="">Unassigned (Escalate)</option>
                  {roleHolders.ACCOUNT_HEAD.map(emp => (
                    <option key={emp.ecode} value={emp.ecode}>{emp.name}</option>
                  ))}
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
              <div className="relative mt-1">
                <select 
                  id="pm_ecode"
                  value={formData.pm_ecode}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full text-[11px] font-medium rounded border border-outline-variant bg-surface py-1.5 px-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="">Unassigned (Escalate)</option>
                  {roleHolders.PROJECT_MANAGER.map(emp => (
                    <option key={emp.ecode} value={emp.ecode}>{emp.name}</option>
                  ))}
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
            <button 
              type="button" 
              onClick={() => navigate('/registry')}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors duration-150 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={(e) => onSubmit(e, true)}
              disabled={isSubmitting || !formData.vertical_id}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-secondary-container bg-secondary-container/50 hover:bg-secondary-container border border-outline-variant rounded-lg transition-colors duration-150 disabled:opacity-50 cursor-pointer"
            >
              Save as Draft
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-on-primary bg-primary hover:bg-primary-dim shadow-sm rounded-lg transition-colors duration-150 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>{isSubmitting ? 'Creating...' : 'Create Process'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
