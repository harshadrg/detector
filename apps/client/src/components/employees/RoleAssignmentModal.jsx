import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { rbacApi } from '../../lib/api.js';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Briefcase,
  AlertCircle,
  Loader2,
  Lock,
  CheckCircle2,
} from 'lucide-react';

const CATEGORY_META = {
  PLATFORM_ADMIN: {
    title: 'Platform Governance',
    subtitle: 'Full platform administration & corporate security authority',
    icon: ShieldAlert,
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
  },
  MODULE_ADMIN: {
    title: 'Module Governance',
    subtitle: 'Module configuration, batch approvals & data ingestion authority',
    icon: ShieldCheck,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  ORGANIZATIONAL: {
    title: 'Organizational Hierarchy',
    subtitle: 'Operational business management and project execution roles',
    icon: Briefcase,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
};

export function RoleAssignmentModal({ isOpen, onClose, employee, onRoleUpdated }) {
  const { hasPermission, hasAnyPermission } = useAuth();
  const [allRoles, setAllRoles] = useState([]);
  const [currentRoles, setCurrentRoles] = useState(() => employee?.roles || []);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canAssignAdmin = hasPermission('CORE.ROLE.ASSIGN_ADMIN');
  const canAssignOrg = hasAnyPermission(['CORE.ROLE.ASSIGN_ADMIN', 'CORE.ROLE.ASSIGN_ORG']);

  useEffect(() => {
    let isMounted = true;
    async function loadRoles() {
      try {
        const data = await rbacApi.getRoles();
        if (isMounted) {
          setAllRoles(data.roles || []);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setServerError(err.message || 'Failed to load system roles.');
          setIsLoading(false);
        }
      }
    }

    loadRoles();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isOpen || !employee) return null;

  const handleRoleToggle = async (roleCode, isAssigned) => {
    setServerError('');
    setSuccessMessage('');
    setActionInProgress(roleCode);

    const action = isAssigned ? 'REVOKE' : 'ASSIGN';

    try {
      const response = await rbacApi.assignRole({
        ecode: employee.ecode,
        role_code: roleCode,
        action,
      });

      setCurrentRoles(response.roles || []);
      setSuccessMessage(
        `Role ${roleCode} successfully ${action === 'ASSIGN' ? 'assigned to' : 'revoked from'} ${employee.name}.`
      );
      if (onRoleUpdated) {
        onRoleUpdated();
      }
    } catch (err) {
      setServerError(err.message || `Failed to ${action.toLowerCase()} role.`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Group roles by category
  const rolesByCategory = allRoles.reduce((acc, role) => {
    const cat = role.role_category || 'ORGANIZATIONAL';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(role);
    return acc;
  }, {});

  const categories = ['PLATFORM_ADMIN', 'MODULE_ADMIN', 'ORGANIZATIONAL'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Governance & Role Assignment
              </h3>
              <p className="text-[11px] text-slate-500">
                Target: <span className="font-semibold text-slate-800">{employee.name}</span> ({employee.ecode}) • {employee.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts */}
        {serverError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
              <span className="text-xs">Loading platform governance roles...</span>
            </div>
          ) : (
            categories.map((category) => {
              const meta = CATEGORY_META[category] || {
                title: category,
                subtitle: '',
                icon: Shield,
                badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
              };
              const Icon = meta.icon;
              const categoryRoles = rolesByCategory[category] || [];
              const isCategoryRestricted =
                (category === 'PLATFORM_ADMIN' || category === 'MODULE_ADMIN') && !canAssignAdmin;

              if (categoryRoles.length === 0) return null;

              return (
                <div
                  key={category}
                  className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/40"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-slate-600" />
                      <h4 className="text-xs font-bold text-slate-800">{meta.title}</h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badgeColor}`}
                      >
                        {category}
                      </span>
                    </div>

                    {isCategoryRestricted && (
                      <div className="flex items-center space-x-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Lock className="w-3 h-3" />
                        <span>Requires Platform Admin Authority</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">{meta.subtitle}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {categoryRoles.map((role) => {
                      const isAssigned = currentRoles.some(
                        (r) => r.role_code === role.role_code
                      );
                      const isWorking = actionInProgress === role.role_code;
                      const isDisabled = isCategoryRestricted || (!canAssignOrg && !canAssignAdmin) || isWorking;

                      return (
                        <div
                          key={role.role_code}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            isAssigned
                              ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="mr-3 truncate">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-semibold text-slate-900 truncate">
                                {role.role_name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">
                              {role.role_code}
                            </span>
                          </div>

                          <div className="shrink-0">
                            {isDisabled && isCategoryRestricted ? (
                              <button
                                disabled
                                className="px-2.5 py-1 text-[11px] font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-md cursor-not-allowed flex items-center space-x-1"
                              >
                                <Lock className="w-3 h-3" />
                                <span>Locked</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isDisabled}
                                onClick={() => handleRoleToggle(role.role_code, isAssigned)}
                                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                                  isAssigned
                                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {isWorking ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Updating...</span>
                                  </>
                                ) : isAssigned ? (
                                  <span>Revoke</span>
                                ) : (
                                  <span>Assign</span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Changes take effect immediately and refresh the target employee session version.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
