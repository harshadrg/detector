import { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Shield, 
  ArrowRight, User, Briefcase, RefreshCw, AlertCircle
} from 'lucide-react';
import { handoverApi } from '../../lib/api.js';
import { useAuth } from '../../context/useAuth.js';

export function HandoverReviewQueue() {
  const { capabilities } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchReviews = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await handoverApi.listPendingHandovers();
      setRequests(res.handovers || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch handover queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleReviewAction = async (action) => {
    if (!selectedHandover) return;
    
    if (action === 'REJECT' && !remarks.trim()) {
      setSubmitError('Remarks are required when rejecting a handover.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await handoverApi.review(selectedHandover.handover_id, {
        action,
        review_remarks: remarks
      });
      
      setSelectedHandover(null);
      setRemarks('');
      await fetchReviews();
    } catch (err) {
      setSubmitError(err.message || `Failed to ${action.toLowerCase()} handover.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatShortDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (!capabilities.includes('BPMS.HANDOVER.APPROVE')) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Shield className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900">Access Denied</h3>
        <p className="mt-1">You do not have permission to review handover requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">PM Handover Queue</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve project manager transfer requests.</p>
        </div>
        <button
          onClick={fetchReviews}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: List */}
        <div className="lg:col-span-5 flex flex-col h-[calc(100vh-220px)] border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Pending Requests</h3>
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {requests.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading && !requests.length ? (
              <div className="py-12 flex justify-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm">
                <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-400" />
                <p>No pending handovers</p>
                <p className="text-xs">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {requests.map(req => (
                  <button
                    key={req.handover_id}
                    onClick={() => { setSelectedHandover(req); setRemarks(''); setSubmitError(''); }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedHandover?.handover_id === req.handover_id
                        ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-500 ring-inset'
                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded text-indigo-700 bg-indigo-100/50 border border-indigo-100">
                        {req.process_code}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 text-sm truncate mb-3">
                      {req.process_name}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex flex-col max-w-[40%]">
                        <span className="text-slate-500 truncate">{req.from_pm_name || 'Unassigned'}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 mx-1 shrink-0" />
                      <div className="flex flex-col max-w-[40%] text-right">
                        <span className="font-medium text-slate-900 truncate">{req.to_pm_name}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detail Viewer */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-220px)] border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
          {selectedHandover ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Detail Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">
                      {selectedHandover.process_name}
                    </h2>
                    <div className="flex items-center mt-2 space-x-3 text-sm">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {selectedHandover.process_code}
                      </span>
                      <span className="text-slate-500">
                        Requested by <strong>{selectedHandover.requested_by_name}</strong> on {formatDate(selectedHandover.created_at)}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider bg-amber-100 text-amber-800 rounded-full uppercase border border-amber-200 shadow-sm">
                    {selectedHandover.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                    <span className="absolute -top-2.5 left-3 bg-white px-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outgoing PM</span>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {selectedHandover.from_pm_name || 'Unassigned'}
                        </div>
                        {selectedHandover.from_pm_ecode && (
                          <div className="text-xs text-slate-500">{selectedHandover.from_pm_ecode}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm ring-1 ring-indigo-50 relative">
                    <span className="absolute -top-2.5 left-3 bg-white px-1 text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Incoming PM</span>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {selectedHandover.to_pm_name}
                        </div>
                        <div className="text-xs text-slate-500">{selectedHandover.to_pm_ecode}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Handover Details</h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 block mb-1">Scenario</span>
                      <span className="font-semibold text-slate-900">{selectedHandover.scenario.replace(/_/g, ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Effective Date</span>
                      <span className="font-semibold text-slate-900">{formatShortDate(selectedHandover.effective_date)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Justification</h4>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedHandover.reason}
                  </div>
                </div>
              </div>

              {/* Review Actions */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                {submitError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                    {submitError}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Review Remarks <span className="text-slate-400 font-normal">(required for rejection)</span>
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter approval conditions or rejection reasons..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-20 transition-shadow"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleReviewAction('REJECT')}
                    disabled={isSubmitting || !remarks.trim()}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleReviewAction('APPROVE')}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Handover</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <Briefcase className="w-12 h-12 mb-4 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">Select a handover request to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
