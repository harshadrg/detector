import { useState, useRef, useEffect } from 'react';
import { Bell, CheckSquare, ArrowLeftRight, AlertTriangle, CheckCircle, ShieldCheck, UserPlus } from 'lucide-react';

export function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-high text-primary hover:bg-surface-container-highest transition relative"
      >
        <Bell className="w-5 h-5" />
        {/* Unread badge */}
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-surface shadow-sm">
          5
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-[358px] bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant z-50 overflow-hidden flex flex-col text-on-surface animate-in fade-in slide-in-from-top-2 duration-150">
          
          <div className="p-3.5 border-b border-surface-variant bg-surface flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-headline font-semibold text-on-surface text-sm">Notifications</span>
              <span className="bg-secondary-container text-on-secondary-container text-[11px] font-semibold px-2 py-0.5 rounded-full border border-primary-fixed">
                5 unread
              </span>
            </div>
            <button className="text-xs text-primary hover:text-primary-dim font-medium transition cursor-pointer" type="button">
              Mark all read
            </button>
          </div>
          
          <div className="px-3 pt-2 pb-1.5 bg-surface-container-low border-b border-surface-variant flex items-center gap-2">
            <button className="px-2.5 py-1 text-xs font-semibold rounded-md bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/40" type="button">
              All (6)
            </button>
            <button className="px-2.5 py-1 text-xs font-medium rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition" type="button">
              Unread (5)
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-[420px] custom-scrollbar divide-y divide-surface-container">
            {/* Item 1 */}
            <div className="bg-surface-container-lowest border-l-[3px] border-primary p-3 hover:bg-surface-container-low transition cursor-pointer flex items-start gap-3">
              <div className="p-2 rounded-lg bg-secondary-container text-primary flex-shrink-0 mt-0.5">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs text-on-surface leading-snug font-normal">
                  Change request <code className="font-mono text-[11px] bg-surface-container px-1 py-0.5 rounded text-on-surface font-semibold">CR-0045</code> submitted for review on <code className="font-mono text-[11px] bg-surface-container px-1 py-0.5 rounded text-on-surface font-semibold">PRC-0128</code>
                </p>
                <span className="text-[11px] text-on-surface-variant font-medium mt-1 block">2 hours ago</span>
              </div>
              <div className="flex-shrink-0 mt-1.5">
                <div className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary-container"></div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="bg-surface-container-lowest border-l-[3px] border-secondary p-3 hover:bg-surface-container-low transition cursor-pointer flex items-start gap-3">
              <div className="p-2 rounded-lg bg-surface-container-highest text-secondary flex-shrink-0 mt-0.5">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs text-on-surface leading-snug font-normal">
                  PM Handover request submitted for <code className="font-mono text-[11px] bg-surface-container px-1 py-0.5 rounded text-on-surface font-semibold">PRC-0089</code> (<span className="text-secondary font-medium">PM_LEFT_COMPANY</span> scenario)
                </p>
                <span className="text-[11px] text-on-surface-variant font-medium mt-1 block">5 hours ago</span>
              </div>
              <div className="flex-shrink-0 mt-1.5">
                <div className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary-container"></div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="bg-surface-container-lowest border-l-[3px] border-amber-500 p-3 hover:bg-surface-container-low transition cursor-pointer flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs text-on-surface leading-snug font-normal">
                  Employee <code className="font-mono text-[11px] bg-surface-container px-1 py-0.5 rounded text-on-surface font-semibold">E1004</code> deactivated with 3 active process assignments requiring handover
                </p>
                <span className="text-[11px] text-on-surface-variant font-medium mt-1 block">1 day ago</span>
              </div>
              <div className="flex-shrink-0 mt-1.5">
                <div className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary-container"></div>
              </div>
            </div>

            {/* Item 4 */}
            <div className="bg-surface-container-lowest border-l-[3px] border-emerald-500 p-3 hover:bg-surface-container-low transition cursor-pointer flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs text-on-surface leading-snug font-normal">
                  Import batch <code className="font-mono text-[11px] bg-surface-container px-1 py-0.5 rounded text-on-surface font-semibold">B-003</code> committed successfully: 258 processes created
                </p>
                <span className="text-[11px] text-on-surface-variant font-medium mt-1 block">1 day ago</span>
              </div>
              <div className="flex-shrink-0 mt-1.5">
                <div className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary-container"></div>
              </div>
            </div>

            {/* Item 5 */}
            <div className="bg-surface-container-lowest border-l-[3px] border-emerald-500 p-3 hover:bg-surface-container-low transition cursor-pointer flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs text-on-surface leading-snug font-normal">
                  Role <code className="font-mono text-[11px] bg-surface-container px-1 py-0.5 rounded text-on-surface font-semibold">BPMS_ADMIN</code> assigned to Priya M (<code className="font-mono text-[11px] text-on-surface-variant">E1007</code>)
                </p>
                <span className="text-[11px] text-on-surface-variant font-medium mt-1 block">2 days ago</span>
              </div>
              <div className="flex-shrink-0 mt-1.5">
                <div className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary-container"></div>
              </div>
            </div>

            {/* Item 6 (Read) */}
            <div className="bg-surface-container-low/60 p-3 hover:bg-surface-container transition cursor-pointer flex items-start gap-3 opacity-80">
              <div className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant flex-shrink-0 mt-0.5">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs text-on-surface leading-snug font-normal">
                  Employee <code className="font-mono text-[11px] bg-surface-container px-1 py-0.5 rounded text-on-surface font-semibold">E1008</code> (Amit R) created successfully
                </p>
                <span className="text-[11px] text-on-surface-variant font-medium mt-1 block">3 days ago</span>
              </div>
              <div className="flex-shrink-0 mt-1.5 w-2 h-2"></div>
            </div>
          </div>

          <div className="border-t border-surface-variant bg-surface-container-low px-4 py-2.5 text-center">
            <a className="text-xs font-semibold text-primary hover:text-primary-dim inline-flex items-center justify-center gap-1 transition" href="#">
              <span>View All Notifications</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
