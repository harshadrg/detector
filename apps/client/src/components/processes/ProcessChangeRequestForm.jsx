import { useState, useEffect } from 'react';
import { processApi, masterApi } from '../../lib/api.js';
import { Save, Send, Loader2, AlertCircle, FileEdit, Ban } from 'lucide-react';

export function ProcessChangeRequestForm({ process, capabilities, onNavigate }) {
  const [changeType, setChangeType] = useState('PROCESS_DETAILS_UPDATE'); // or 'PROCESS_DEACTIVATION'
  
  // Masters for dropdowns
  const [verticals, setVerticals] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Form State for Details Update
  const [formData, setFormData] = useState({
    wps_code: process.wps_code || '',
    process_name: process.process_name || '',
    vertical_id: process.vertical_id || '',
    sbu_id: process.sbu_id || '',
    client_id: process.client_id || '',
    client_type: process.client_type || '',
    location_id: process.location_id || '',
  });

  // Form State for Deactivation
  const [deactivationData, setDeactivationData] = useState({
    ended_on: new Date().toISOString().split('T')[0],
    closure_remarks: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      masterApi.getVerticals({ activeOnly: true }),
      masterApi.getSBUs({ activeOnly: true }),
      masterApi.getClients({ activeOnly: true }),
      masterApi.getLocations()
    ]).then(([v, s, c, l]) => {
      if (isMounted) {
        setVerticals(v.verticals || []);
        setSbus(s.sbus || []);
        setClients(c.clients || []);
        setLocations(l.locations || []);
      }
    }).catch(err => {
      console.warn("Failed to load masters:", err);
    });
    
    return () => { isMounted = false; };
  }, []);

  const handleAction = async (action) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const proposedData = changeType === 'PROCESS_DETAILS_UPDATE' ? formData : deactivationData;

    try {
      await processApi.submitChangeRequest(process.registry_id, {
        change_type: changeType,
        action: action, // 'DRAFT' or 'SUBMIT'
        proposed_data: proposedData,
        version_num: process.version_num, // Concurrency check
      });
      
      setSuccess(`Change request successfully ${action === 'SUBMIT' ? 'submitted' : 'saved as draft'}.`);
      if (action === 'SUBMIT') {
        // Optionally redirect or clear
        setTimeout(() => {
          onNavigate('processes');
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit change request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasDraftCap = capabilities.includes('BPMS.CHANGE_REQUEST.DRAFT');
  const hasSubmitCap = capabilities.includes('BPMS.CHANGE_REQUEST.SUBMIT');

  // Let's filter SBUs based on vertical selection
  const filteredSbus = formData.vertical_id 
    ? sbus.filter(s => String(s.vertical_id) === String(formData.vertical_id))
    : sbus;

  return (
    <div className="p-6">
      <div className="mb-6 flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setChangeType('PROCESS_DETAILS_UPDATE')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            changeType === 'PROCESS_DETAILS_UPDATE' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Update Details
        </button>
        {capabilities.includes('BPMS.PROCESS.DEACTIVATE') && (
          <button
            onClick={() => setChangeType('PROCESS_DEACTIVATION')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              changeType === 'PROCESS_DEACTIVATION' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Deactivate Process
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-xs text-emerald-800">
          <FileEdit className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {changeType === 'PROCESS_DETAILS_UPDATE' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Process Name</label>
              <input
                type="text"
                value={formData.process_name}
                onChange={e => setFormData({...formData, process_name: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WPS Code</label>
              <input
                type="text"
                value={formData.wps_code}
                onChange={e => setFormData({...formData, wps_code: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Type</label>
              <select
                value={formData.client_type}
                onChange={e => setFormData({...formData, client_type: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Type</option>
                <option value="INTERNAL">Internal</option>
                <option value="EXTERNAL">External</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client</label>
              <select
                value={formData.client_id}
                onChange={e => setFormData({...formData, client_id: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Client</option>
                {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.client_name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vertical</label>
              <select
                value={formData.vertical_id}
                onChange={e => {
                  setFormData({...formData, vertical_id: e.target.value, sbu_id: ''});
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Vertical</option>
                {verticals.map(v => <option key={v.vertical_id} value={v.vertical_id}>{v.vertical_code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SBU</label>
              <select
                value={formData.sbu_id}
                onChange={e => setFormData({...formData, sbu_id: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select SBU</option>
                {filteredSbus.map(s => <option key={s.sbu_id} value={s.sbu_id}>{s.sbu_code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <select
                value={formData.location_id}
                onChange={e => setFormData({...formData, location_id: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Location</option>
                {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.city} - {l.facility_name}</option>)}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-lg">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex space-x-3 text-red-800">
            <Ban className="w-6 h-6 text-red-600 shrink-0" />
            <p className="text-xs">
              Deactivating this process will mark it as INACTIVE and prevent future edits. 
              The process will remain in the registry for historical audit purposes.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Closure Date</label>
            <input
              type="date"
              value={deactivationData.ended_on}
              onChange={e => setDeactivationData({...deactivationData, ended_on: e.target.value})}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Closure Remarks (Required)</label>
            <textarea
              value={deactivationData.closure_remarks}
              onChange={e => setDeactivationData({...deactivationData, closure_remarks: e.target.value})}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 h-24 resize-none"
              placeholder="Provide reason for deactivating this process..."
            ></textarea>
          </div>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
        {hasDraftCap && (
          <button
            onClick={() => handleAction('DRAFT')}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Draft</span>
          </button>
        )}
        
        {hasSubmitCap && (
          <button
            onClick={() => handleAction('SUBMIT')}
            disabled={isSubmitting || (changeType === 'PROCESS_DEACTIVATION' && !deactivationData.closure_remarks)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Submit for Review</span>
          </button>
        )}
      </div>
    </div>
  );
}
