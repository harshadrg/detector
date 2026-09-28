import { useAuth } from '../../context/useAuth.js';
import { Eye, ShieldAlert, Sparkles } from 'lucide-react';

export function RoleContextSwitcher() {
  const {
    canContextSwitch,
    activeContextRole,
    availableContextRoles,
    switchContextRole,
    isLoading,
  } = useAuth();

  if (!canContextSwitch) return null;

  const handleRoleChange = async (e) => {
    const val = e.target.value;
    await switchContextRole(val === '__REAL__' ? null : val);
  };

  const isSimulating = Boolean(activeContextRole);

  return (
    <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs">
      <div className="flex items-center space-x-1.5">
        {isSimulating ? (
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        )}
        <span className="font-semibold text-slate-700 hidden sm:inline">
          Context View:
        </span>
      </div>

      <div className="relative">
        <select
          value={activeContextRole || '__REAL__'}
          onChange={handleRoleChange}
          disabled={isLoading}
          className={`text-xs font-medium rounded-lg px-2.5 py-1 pr-7 border focus:outline-none cursor-pointer transition-colors ${
            isSimulating
              ? 'bg-amber-50 text-amber-900 border-amber-300 focus:border-amber-500'
              : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500'
          }`}
        >
          <option value="__REAL__">🛡️ Real Identity (Full Governance)</option>
          {availableContextRoles.map((role) => (
            <option key={role.role_code} value={role.role_code}>
              Simulate: {role.role_name || role.role_code} ({role.role_category})
            </option>
          ))}
        </select>
      </div>

      {isSimulating && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Eye className="w-2.5 h-2.5 mr-1" />
          Simulated
        </span>
      )}
    </div>
  );
}
