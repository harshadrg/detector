import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ShieldAlert, Loader2, KeyRound } from 'lucide-react';
import { employeeApi } from '../../../lib/api.js';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';

export function ManageEmployeeModal({ isOpen, onClose, employee, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const isDeactivating = employee?.status === 'ACTIVE';

  // Fetch active assignments when deactivating
  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['employeeAssignments', employee?.ecode],
    queryFn: () => employeeApi.getAssignments(employee.ecode),
    enabled: isOpen && isDeactivating,
  });

  const statusMutation = useMutation({
    mutationFn: ({ ecode, newStatus, pwd }) => employeeApi.updateStatus(ecode, newStatus, pwd),
    onSuccess: (data, variables) => {
      onSuccess(data.message || `Employee ${variables.ecode} status successfully changed to ${variables.newStatus}.`);
    },
    onError: (err) => {
      setError(err.message || 'Failed to update employee status.');
    },
  });

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setPassword('');
        setError(null);
      }, 0);
    }
  }, [isOpen]);

  if (!employee) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const newStatus = isDeactivating ? 'INACTIVE' : 'ACTIVE';
    
    if (isDeactivating && !password) {
      setError('Password confirmation is required to deactivate an employee.');
      return;
    }

    statusMutation.mutate({ 
      ecode: employee.ecode, 
      newStatus, 
      pwd: isDeactivating ? password : undefined 
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDeactivating ? 'Manage Employee (Deactivate)' : 'Manage Employee (Activate)'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error flex items-start gap-2.5 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 mb-4">
           <div className="flex justify-between items-center mb-1">
             <span className="text-xs font-semibold text-on-surface">{employee.name}</span>
             <span className="text-xs font-mono text-outline">{employee.ecode}</span>
           </div>
           <div className="text-xs text-on-surface-variant">{employee.email}</div>
        </div>

        {isDeactivating ? (
          <>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to deactivate <strong className="text-on-surface">{employee.name}</strong> ({employee.ecode})? This will immediately revoke active access tokens and prevent further console login.
            </p>

            {loadingAssignments ? (
               <div className="flex items-center gap-2 text-xs text-on-surface-variant py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading active assignments...</span>
               </div>
            ) : assignments && assignments.length > 0 && (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-2.5 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-1">Offboarding Process Safeguard</span>
                    <span>
                      This user is currently assigned to <strong className="font-mono">{assignments.length}</strong> active/transition process(es). Deactivating will flag these processes as dangling assignments until handed over.
                    </span>
                  </div>
                </div>
                
                <div className="bg-surface-container-low/50 rounded-lg border border-outline-variant/30 max-h-40 overflow-y-auto">
                   <table className="w-full text-left border-collapse text-xs">
                     <thead className="bg-surface-container-low sticky top-0">
                       <tr>
                         <th className="py-2 px-3 font-medium text-on-surface-variant">Process Code</th>
                         <th className="py-2 px-3 font-medium text-on-surface-variant">Role Type</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-outline-variant/20">
                        {assignments.map(a => (
                          <tr key={a.ownership_id}>
                             <td className="py-2 px-3 font-mono">{a.process_code}</td>
                             <td className="py-2 px-3">{a.role_type}</td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
               <label className="block text-xs font-medium text-on-surface">
                 Administrator Password Confirmation <span className="text-error">*</span>
               </label>
               <Input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="Enter your password to confirm..."
                 required
                 icon={KeyRound}
               />
            </div>
          </>
        ) : (
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Activate user <strong className="text-on-surface">{employee.name}</strong> ({employee.ecode})? This will restore their authorization and allow them to sign in.
          </p>
        )}

        <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={statusMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isDeactivating ? 'danger' : 'primary'}
            disabled={statusMutation.isPending || (isDeactivating && !password)}
            icon={statusMutation.isPending ? Loader2 : null}
          >
            {statusMutation.isPending 
              ? 'Updating...' 
              : isDeactivating 
                ? 'Confirm Deactivation' 
                : 'Confirm Activation'
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
}
