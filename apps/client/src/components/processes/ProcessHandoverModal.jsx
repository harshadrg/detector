import { useState, useEffect } from 'react';
import { X, Loader2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { handoverApi } from '../../lib/api.js';

// Reusing employee API to fetch PMs
import { employeeApi } from '../../lib/api.js';

export function ProcessHandoverModal({ isOpen, onClose, process, onSuccess }) {
  const [employees, setEmployees] = useState([]);
  const [isLoadingPMs, setIsLoadingPMs] = useState(false);
  const [formData, setFormData] = useState({
    to_pm_ecode: '',
    scenario: '',
    effective_date: new Date().toISOString().split('T')[0],
    reason: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const scenarios = [
    { value: 'PM_MOVED_PROJECT', label: 'PM Moved to another project' },
    { value: 'PM_ROLE_CHANGE', label: 'PM Role Change' },
    { value: 'PM_LEFT_COMPANY', label: 'PM Left Company' },
    { value: 'TEMPORARY_HANDOVER', label: 'Temporary Handover' },
    { value: 'ESCALATION', label: 'Escalation / Emergency' },
    { value: 'ADMIN_OVERRIDE', label: 'Admin Override' }
  ];

  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      setTimeout(() => { if (isMounted) setIsLoadingPMs(true); }, 0);
      employeeApi.getEmployees({ page: 1, pageSize: 500, activeOnly: true })
        .then(res => {
          if (isMounted) {
            setEmployees(res.employees || []);
          }
        })
        .catch(err => console.warn(err))
        .finally(() => {
          if (isMounted) setIsLoadingPMs(false);
        });
      
      return () => { isMounted = false; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.to_pm_ecode || !formData.scenario || !formData.effective_date || !formData.reason) {
      setError('All fields are required.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      await handoverApi.requestHandover(process.registry_id, formData);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit handover request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPM = process?.hierarchy?.PROJECT_MANAGER || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Request PM Handover</h2>
            <p className="text-xs text-slate-500 mt-1">Initiate a formal ownership transfer for {process.process_code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-sm text-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Current PM</span>
              <div className="font-semibold text-slate-900">{currentPM ? currentPM.name : 'Unassigned'}</div>
              {currentPM && <div className="text-xs text-slate-500">{currentPM.ecode}</div>}
            </div>
            <ArrowRight className="w-6 h-6 text-slate-300 mx-4 shrink-0" />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">Incoming PM</span>
              {isLoadingPMs ? (
                <div className="text-xs text-slate-500 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-2" /> Loading...</div>
              ) : (
                <select
                  value={formData.to_pm_ecode}
                  onChange={e => setFormData({ ...formData, to_pm_ecode: e.target.value })}
                  className="w-full px-2 py-1 text-sm bg-white border border-indigo-200 rounded text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select new PM</option>
                  {employees.filter(emp => emp.ecode !== currentPM?.ecode).map(emp => (
                    <option key={emp.ecode} value={emp.ecode}>{emp.name} ({emp.ecode})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <form id="handoverForm" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Handover Scenario <span className="text-red-500">*</span></label>
              <select
                value={formData.scenario}
                onChange={e => setFormData({ ...formData, scenario: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="">Select Scenario</option>
                {scenarios.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.effective_date}
                onChange={e => setFormData({ ...formData, effective_date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Justification / Reason <span className="text-red-500">*</span></label>
              <textarea
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 h-24 resize-none"
                placeholder="Detailed reason for this handover request..."
                required
              ></textarea>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="handoverForm"
            disabled={isSubmitting || !formData.to_pm_ecode || !formData.scenario || !formData.reason}
            className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Submit Handover</span>
          </button>
        </div>
      </div>
    </div>
  );
}
