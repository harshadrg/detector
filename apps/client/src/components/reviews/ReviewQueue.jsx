import { useState, useEffect } from 'react';
import { changeRequestApi } from '../../lib/api.js';
import { Loader2, AlertCircle, CheckCircle2, Ban } from 'lucide-react';

export function ReviewQueue() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    async function fetchReviews() {
      if (isMounted) {
        setIsLoading(true);
      }
      try {
        const res = await changeRequestApi.listPendingReviews();
        if (isMounted) {
          setReviews(res.reviews || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load review queue.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchReviews();

    return () => { isMounted = false; };
  }, []);

  const handleReviewAction = async (action) => {
    if (action === 'REJECT' && !reviewRemarks.trim()) {
      setActionError('Review remarks are mandatory when rejecting.');
      return;
    }
    
    setIsSubmitting(true);
    setActionError('');
    setActionSuccess('');
    
    try {
      await changeRequestApi.review(selectedReview.change_request_id, {
        action,
        review_remarks: reviewRemarks,
        version_num: selectedReview.version_num,
      });
      setActionSuccess(`Change request successfully ${action === 'APPROVE' ? 'approved' : 'rejected'}.`);
      setReviewRemarks('');
      
      // Reload reviews and deselect
      setTimeout(async () => {
        setSelectedReview(null);
        setActionSuccess('');
        try {
          const res = await changeRequestApi.listPendingReviews();
          setReviews(res.reviews || []);
        } catch {
          setError('Failed to reload review queue.');
        }
      }, 1500);
    } catch (err) {
      setActionError(err.message || `Failed to ${action} change request.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDiff = (review) => {
    const proposed = JSON.parse(review.proposed_data);
    if (review.change_type === 'PROCESS_DEACTIVATION') {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center space-x-2 text-red-800 font-semibold mb-2">
            <Ban className="w-5 h-5 text-red-600" />
            <span>Process Deactivation Request</span>
          </div>
          <p className="text-xs text-red-700 mb-1"><span className="font-semibold">Requested Closure Date:</span> {proposed.ended_on}</p>
          <p className="text-xs text-red-700"><span className="font-semibold">Reason:</span> {proposed.closure_remarks}</p>
        </div>
      );
    }

    // PROCESS_DETAILS_UPDATE
    // In a real scenario we'd diff against current Process details, but for now we'll just show the proposed data changes.
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Proposed Data</h4>
          <div className="space-y-2 text-xs">
            {Object.entries(proposed).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="font-semibold text-slate-700">{key}</span>
                <span className="text-slate-600">{value || <span className="text-slate-400 italic">Empty</span>}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-50">
      {/* List Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 sticky top-0">
          <h2 className="text-sm font-bold text-slate-900">Review Queue</h2>
          <p className="text-[11px] text-slate-500">{reviews.length} pending requests</p>
        </div>
        
        {reviews.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No pending reviews.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {reviews.map(r => (
              <button
                key={r.change_request_id}
                onClick={() => {
                  setSelectedReview(r);
                  setReviewRemarks('');
                  setActionError('');
                  setActionSuccess('');
                }}
                className={`w-full text-left p-4 border-b border-slate-100 transition-colors cursor-pointer ${
                  selectedReview?.change_request_id === r.change_request_id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-100 rounded-full">
                    {r.change_type.replace('PROCESS_', '')}
                  </span>
                  <span className="text-[10px] text-slate-400">#{r.change_request_id}</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-900 truncate">{r.process_name || r.process_code}</h4>
                <p className="text-[11px] text-slate-500 mt-1 truncate">Requested by {r.requested_by_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail View */}
      <div className="flex-1 bg-white overflow-y-auto">
        {!selectedReview ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <CheckSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Select a Request to Review</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Choose a pending change request from the queue to view its details and side-by-side diff.
            </p>
          </div>
        ) : (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-6 pb-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Review Change Request #{selectedReview.change_request_id}</h2>
              <p className="text-sm text-slate-500">
                Process: <span className="font-semibold text-slate-700">{selectedReview.process_code}</span> — {selectedReview.process_name}
              </p>
            </div>
            
            {actionError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-sm text-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
            
            {actionSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Visual Diff</h3>
              {renderDiff(selectedReview)}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Review Remarks <span className="text-slate-400 font-normal">(Required for rejection)</span></label>
              <textarea
                value={reviewRemarks}
                onChange={e => setReviewRemarks(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 h-24 resize-none"
                placeholder="Enter remarks for approval or rejection..."
              ></textarea>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleReviewAction('REJECT')}
                disabled={isSubmitting || !reviewRemarks.trim()}
                className="flex items-center space-x-2 px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                <span>Reject</span>
              </button>
              
              <button
                onClick={() => handleReviewAction('APPROVE')}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Approve & Apply</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Just add this so CheckSquare renders correctly
function CheckSquare(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
