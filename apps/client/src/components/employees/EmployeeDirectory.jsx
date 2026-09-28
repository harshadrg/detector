import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { employeeApi } from '../../lib/api.js';
import { AddEmployeeModal } from './AddEmployeeModal.jsx';
import { RoleAssignmentModal } from './RoleAssignmentModal.jsx';
import { DeactivationGuardModal } from './DeactivationGuardModal.jsx';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  RefreshCw,
} from 'lucide-react';

const ROLE_BADGE_STYLES = {
  PLATFORM_ADMIN: 'bg-red-50 text-red-700 border-red-200',
  MODULE_ADMIN: 'bg-amber-50 text-amber-700 border-amber-200',
  ORGANIZATIONAL: 'bg-blue-50 text-blue-700 border-blue-200',
};

export function EmployeeDirectory() {
  const { hasPermission, hasAnyPermission, user: currentUser } = useAuth();

  // State
  const [employees, setEmployees] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [roleModalEmployee, setRoleModalEmployee] = useState(null);
  const [deactivationModalEmployee, setDeactivationModalEmployee] = useState(null);
  const [activatingEcode, setActivatingEcode] = useState(null);

  // Capability checks (ZERO hardcoded role names)
  const canManageUsers = hasPermission('CORE.USER.MANAGE');
  const canAssignAnyRole = hasAnyPermission(['CORE.ROLE.ASSIGN_ADMIN', 'CORE.ROLE.ASSIGN_ORG']);

  const [refreshIndex, setRefreshIndex] = useState(0);

  const reloadEmployees = useCallback(() => {
    setIsLoading(true);
    setRefreshIndex((idx) => idx + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const response = await employeeApi.list({
          page,
          pageSize: 10,
          status: statusFilter,
          search: appliedSearch,
        });
        if (isMounted) {
          setEmployees(response.employees || []);
          if (response.meta) {
            setMeta(response.meta);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to retrieve employee directory.');
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [page, statusFilter, appliedSearch, refreshIndex]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleStatusFilterChange = (status) => {
    setIsLoading(true);
    setStatusFilter(status);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setIsLoading(true);
    setPage(newPage);
  };

  const handleReactivate = async (ecode) => {
    setActivatingEcode(ecode);
    try {
      await employeeApi.updateStatus(ecode, 'ACTIVE');
      reloadEmployees();
    } catch (err) {
      setError(err.message || 'Failed to reactivate employee.');
    } finally {
      setActivatingEcode(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Corporate Employee Directory
              </h1>
              <p className="text-xs text-slate-500">
                Identity registry, operational dual-hatting roles & governance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={reloadEmployees}
            disabled={isLoading}
            className="p-2.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh directory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {canManageUsers && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit">
          {[
            { id: 'ALL', label: 'All Accounts' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'INACTIVE', label: 'Inactive' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleStatusFilterChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by code, name, email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Employee Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Roles</th>
                <th className="py-3 px-4">Process Ownership</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                    <span>Loading directory records...</span>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-medium">No employees found</p>
                    <p className="text-[11px] text-slate-400">
                      Try adjusting your search criteria or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isSelf = currentUser?.ecode === emp.ecode;
                  const isActive = emp.status === 'ACTIVE';

                  return (
                    <tr key={emp.ecode} className="hover:bg-slate-50/50 transition-colors">
                      {/* Identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-[11px] shrink-0">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                              <span>{emp.name}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-2">
                              <span>{emp.ecode}</span>
                              <span>•</span>
                              <span>{emp.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {emp.status}
                        </span>
                      </td>

                      {/* Roles */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {emp.roles && emp.roles.length > 0 ? (
                            emp.roles.map((r) => {
                              const style =
                                ROLE_BADGE_STYLES[r.role_category] ||
                                'bg-slate-100 text-slate-700 border-slate-200';
                              return (
                                <span
                                  key={r.role_code}
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${style}`}
                                  title={`${r.role_name} (${r.role_category})`}
                                >
                                  {r.role_code}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              No roles assigned
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Active Process Count */}
                      <td className="py-3 px-4">
                        {emp.activeProcessCount > 0 ? (
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-[11px] font-medium">
                            <GitBranch className="w-3.5 h-3.5 text-amber-600" />
                            <span>{emp.activeProcessCount} Active Process(es)</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {canAssignAnyRole && (
                            <button
                              type="button"
                              onClick={() => setRoleModalEmployee(emp)}
                              className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors flex items-center space-x-1 text-[11px] cursor-pointer"
                              title="Manage role assignments"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>Roles</span>
                            </button>
                          )}

                          {canManageUsers && !isSelf && (
                            isActive ? (
                              <button
                                type="button"
                                onClick={() => setDeactivationModalEmployee(emp)}
                                className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center space-x-1 text-[11px] cursor-pointer"
                                title="Deactivate employee"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Deactivate</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={activatingEcode === emp.ecode}
                                onClick={() => handleReactivate(emp.ecode)}
                                className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors flex items-center space-x-1 text-[11px] cursor-pointer disabled:opacity-50"
                                title="Reactivate employee"
                              >
                                {activatingEcode === emp.ecode ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5" />
                                )}
                                <span>Activate</span>
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Showing <span className="font-semibold text-slate-700">{employees.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{meta.totalCount}</span> total employees
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-slate-700 px-2">
              Page {page} of {meta.totalPages || 1}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(meta.totalPages, page + 1))}
              disabled={page >= meta.totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEmployeeAdded={reloadEmployees}
      />

      {roleModalEmployee && (
        <RoleAssignmentModal
          key={roleModalEmployee.ecode}
          isOpen={true}
          onClose={() => setRoleModalEmployee(null)}
          employee={roleModalEmployee}
          onRoleUpdated={reloadEmployees}
        />
      )}

      <DeactivationGuardModal
        isOpen={!!deactivationModalEmployee}
        onClose={() => setDeactivationModalEmployee(null)}
        employee={deactivationModalEmployee}
        onStatusUpdated={reloadEmployees}
      />
    </div>
  );
}
