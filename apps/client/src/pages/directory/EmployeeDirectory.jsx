import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  UserPlus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { employeeApi } from '../../lib/api.js';
import { useAuth } from '../../context/useAuth.js';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { AddEmployeeModal } from './AddEmployeeModal.jsx';
import { ManageEmployeeModal } from './ManageEmployeeModal.jsx';

export function EmployeeDirectory() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const canManageEmployees = hasPermission('CORE.USER.MANAGE');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetEmployee, setTargetEmployee] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // TanStack Query for employees list
  const { 
    data, 
    isLoading, 
    isFetching, 
    error: fetchError 
  } = useQuery({
    queryKey: ['employees', page, pageSize, statusFilter, debouncedSearch],
    queryFn: () => employeeApi.list({
      page,
      pageSize,
      status: statusFilter,
      search: debouncedSearch,
    }),
  });

  const employees = data?.employees || [];
  const meta = data?.meta || { totalCount: 0, totalPages: 1 };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setDebouncedSearch(searchQuery);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value === '') {
      setPage(1);
      setDebouncedSearch('');
    }
  };

  const openStatusConfirm = (emp) => {
    setActionError(null);
    setTargetEmployee(emp);
  };

  const getInitials = (name, ecode) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (ecode || 'EM').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface tracking-tight">
            Employee Directory
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Manage platform identity, authorization roles, and account lifecycle
          </p>
        </div>

        {canManageEmployees && (
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            icon={UserPlus}
            className="self-start sm:self-auto"
          >
            Add Employee
          </Button>
        )}
      </div>

      {/* Action feedback banners */}
      {actionSuccess && (
        <div 
          role="status" 
          className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div 
          role="alert" 
          className="p-3.5 rounded-lg bg-error/10 border border-error/20 text-error flex items-center gap-2.5 text-xs font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name, code, or email..."
              className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-xs rounded-lg pl-9 pr-3 py-2 border border-outline-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <Button type="submit" variant="secondary" className="px-3 py-2 text-xs">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-on-surface-variant">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-surface-container-low text-xs font-medium text-on-surface border border-outline-variant/40 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          <div className="text-xs text-on-surface-variant font-medium whitespace-nowrap pl-2 border-l border-outline-variant/30">
            Showing <span className="font-semibold text-on-surface">{meta.totalCount}</span> employees
          </div>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low/70 text-on-surface-variant font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-28">Employee Code</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 w-28">Status</th>
                <th className="py-3 px-4">Assigned Roles</th>
                <th className="py-3 px-4 text-center w-36">Active Processes</th>
                {canManageEmployees && (
                  <th className="py-3 px-4 text-right w-28">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={canManageEmployees ? 7 : 6} className="py-12 text-center text-on-surface-variant">
                    <div className="inline-flex items-center gap-2 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Loading employee directory...</span>
                    </div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={canManageEmployees ? 7 : 6} className="py-10 text-center text-error font-medium">
                    Failed to load employees: {fetchError.message}
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={canManageEmployees ? 7 : 6} className="py-12 text-center text-on-surface-variant">
                    No employees matching the current criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isSelf = user?.ecode === emp.ecode;
                  const hasDanglingProcesses = emp.status === 'INACTIVE' && emp.activeProcessCount > 0;

                  return (
                    <tr 
                      key={emp.ecode}
                      className="hover:bg-surface-container-low/40 transition-colors"
                    >
                      {/* Employee Code */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-on-surface">
                        {emp.ecode}
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary-container/40 text-on-primary-container font-semibold text-[11px] flex items-center justify-center shrink-0">
                            {getInitials(emp.name, emp.ecode)}
                          </div>
                          <span className="font-semibold text-on-surface">
                            {emp.name}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-on-surface-variant font-mono">
                        {emp.email}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {emp.status === 'ACTIVE' ? (
                          <Badge variant="success">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            ACTIVE
                          </Badge>
                        ) : (
                          <Badge variant="default">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                            INACTIVE
                          </Badge>
                        )}
                      </td>

                      {/* Assigned Roles */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {emp.roles && emp.roles.length > 0 ? (
                            emp.roles.map((r) => (
                              <span
                                key={r.role_code}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                                  r.role_category === 'PLATFORM_ADMIN' || r.role_category === 'MODULE_ADMIN'
                                    ? 'bg-primary-container/20 text-primary border-primary/20'
                                    : 'bg-surface-container-low text-on-surface border-outline-variant/30'
                                }`}
                              >
                                {r.role_code}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-outline italic">No roles</span>
                          )}
                        </div>
                      </td>

                      {/* Active Processes & Dangling Alert */}
                      <td className="py-3.5 px-4 text-center">
                        {hasDanglingProcesses ? (
                          <span 
                            title="Dangling active processes on inactive employee"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono font-semibold"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{emp.activeProcessCount}</span>
                          </span>
                        ) : (
                          <span className="font-mono text-on-surface font-medium">
                            {emp.activeProcessCount}
                          </span>
                        )}
                      </td>

                      {/* Action Menu / Toggle */}
                      {canManageEmployees && (
                        <td className="py-3.5 px-4 text-right">
                          {emp.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => openStatusConfirm(emp)}
                              disabled={isSelf}
                              title={isSelf ? 'Cannot deactivate your own account' : 'Deactivate employee'}
                              className="text-[11px] font-medium text-error hover:underline disabled:opacity-30 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openStatusConfirm(emp)}
                              className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-outline-variant/20 bg-surface-container-low/30 text-xs">
          <div className="text-on-surface-variant">
            Page <span className="font-semibold text-on-surface">{page}</span> of{' '}
            <span className="font-semibold text-on-surface">{meta.totalPages || 1}</span> ({meta.totalCount} total)
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-surface-container-lowest text-xs font-medium text-on-surface border border-outline-variant/40 rounded px-2 py-1 focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                className="px-2 py-1 text-xs"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </Button>
              <Button
                variant="outline"
                className="px-2 py-1 text-xs"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages || isFetching}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={(ecode) => {
          queryClient.invalidateQueries({ queryKey: ['employees'] });
          setActionSuccess(`Employee profile for ${ecode} was created successfully.`);
          setTimeout(() => setActionSuccess(null), 5000);
        }}
      />

      {/* Manage Employee Modal */}
      <ManageEmployeeModal
        isOpen={Boolean(targetEmployee)}
        onClose={() => setTargetEmployee(null)}
        employee={targetEmployee}
        onSuccess={(msg) => {
          queryClient.invalidateQueries({ queryKey: ['employees'] });
          setTargetEmployee(null);
          setActionSuccess(msg);
          setTimeout(() => setActionSuccess(null), 5000);
        }}
      />
    </div>
  );
}

export default EmployeeDirectory;
