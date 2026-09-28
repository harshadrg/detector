import { useAuth } from '../../context/useAuth.js';
import {
  LayoutDashboard,
  GitBranch,
  CheckSquare,
  ArrowRightLeft,
  FileSpreadsheet,
  Users,
  ScrollText,
  Database,
} from 'lucide-react';

export function Sidebar({ currentTab, onTabSelect }) {
  const { hasPermission, hasAnyPermission } = useAuth();

  // Navigation items defined with granular capability guards (ZERO role checks)
  const navItems = [
    {
      id: 'dashboard',
      label: 'Operational Overview',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      id: 'processes',
      label: 'Process Registry',
      icon: GitBranch,
      visible: hasPermission('BPMS.PROCESS.VIEW'),
    },
    {
      id: 'masters',
      label: 'Master Data',
      icon: Database,
      visible: hasAnyPermission(['BPMS.MASTER.VIEW', 'BPMS.MASTER.MANAGE', 'BPMS.PROCESS.VIEW']),
    },
    {
      id: 'reviews',
      label: 'Review Queue',
      icon: CheckSquare,
      visible: hasPermission('BPMS.CHANGE_REQUEST.APPROVE'),
    },
    {
      id: 'handovers',
      label: 'PM Handovers',
      icon: ArrowRightLeft,
      visible: hasAnyPermission(['BPMS.HANDOVER.REQUEST', 'BPMS.HANDOVER.APPROVE']),
    },
    {
      id: 'imports',
      label: 'Excel Ingestion',
      icon: FileSpreadsheet,
      visible: hasPermission('BPMS.IMPORT.STAGE'),
    },
    {
      id: 'employees',
      label: 'Employee Directory',
      icon: Users,
      visible: hasPermission('CORE.USER.VIEW'),
    },
    {
      id: 'audit',
      label: 'Audit Ledger',
      icon: ScrollText,
      visible: hasAnyPermission(['CORE.AUDIT.VIEW_GLOBAL', 'BPMS.AUDIT.VIEW']),
    },
  ];

  const visibleItems = navItems.filter((item) => item.visible);

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-[calc(100vh-65px)]">
      <div className="p-4 border-b border-slate-100">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Capability-Driven Navigation
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabSelect(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="text-[11px] text-slate-500">
          <span>Active Navigation Items: </span>
          <span className="font-semibold text-slate-700">
            {visibleItems.length} of {navItems.length}
          </span>
        </div>
      </div>
    </aside>
  );
}
