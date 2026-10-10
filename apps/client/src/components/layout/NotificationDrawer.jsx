import { useState, useRef, useEffect } from 'react';
import { Bell, CheckSquare, ArrowLeftRight, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../lib/api';

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

function getIconForNotificationType(type) {
  switch (type) {
    case 'APPROVAL_REQUIRED': return <CheckSquare className="w-4 h-4" />;
    case 'STATUS_CHANGE': return <ArrowLeftRight className="w-4 h-4" />;
    case 'WARNING': return <AlertTriangle className="w-4 h-4" />;
    case 'SECURITY': return <ShieldCheck className="w-4 h-4" />;
    case 'INFO': 
    default: return <Info className="w-4 h-4" />;
  }
}

function getColorClassesForType(type, isRead) {
  if (isRead) {
    return {
      border: 'border-transparent',
      bg: 'bg-surface-container-low/60',
      iconBg: 'bg-surface-container-high text-on-surface-variant',
      hover: 'hover:bg-surface-container',
      opacity: 'opacity-80'
    };
  }

  switch (type) {
    case 'APPROVAL_REQUIRED':
      return { border: 'border-primary', bg: 'bg-surface-container-lowest', iconBg: 'bg-secondary-container text-primary', hover: 'hover:bg-surface-container-low', opacity: '' };
    case 'STATUS_CHANGE':
      return { border: 'border-secondary', bg: 'bg-surface-container-lowest', iconBg: 'bg-surface-container-highest text-secondary', hover: 'hover:bg-surface-container-low', opacity: '' };
    case 'WARNING':
      return { border: 'border-amber-500', bg: 'bg-surface-container-lowest', iconBg: 'bg-amber-50 text-amber-700', hover: 'hover:bg-surface-container-low', opacity: '' };
    case 'SECURITY':
    case 'INFO':
    default:
      return { border: 'border-emerald-500', bg: 'bg-surface-container-lowest', iconBg: 'bg-emerald-50 text-emerald-700', hover: 'hover:bg-surface-container-low', opacity: '' };
  }
}

export function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL' or 'UNREAD'
  const containerRef = useRef(null);
  const queryClient = useQueryClient();

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

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => notificationApi.list({ unreadOnly: filter === 'UNREAD', pageSize: 15 }),
    refetchInterval: 60000, // Poll every minute
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const totalCount = data?.meta?.totalCount || 0;

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
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-surface shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-[358px] bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant z-50 overflow-hidden flex flex-col text-on-surface animate-in fade-in slide-in-from-top-2 duration-150">
          
          <div className="p-3.5 border-b border-surface-variant bg-surface flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-headline font-semibold text-on-surface text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-secondary-container text-on-secondary-container text-[11px] font-semibold px-2 py-0.5 rounded-full border border-primary-fixed">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs text-primary hover:text-primary-dim font-medium transition cursor-pointer disabled:opacity-50" 
                type="button"
              >
                {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all read'}
              </button>
            )}
          </div>
          
          <div className="px-3 pt-2 pb-1.5 bg-surface-container-low border-b border-surface-variant flex items-center gap-2">
            <button 
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md shadow-sm border transition ${filter === 'ALL' ? 'bg-surface-container-lowest text-primary border-outline-variant/40' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container'}`} 
              type="button"
            >
              All {filter === 'ALL' && `(${totalCount})`}
            </button>
            <button 
              onClick={() => setFilter('UNREAD')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md shadow-sm border transition ${filter === 'UNREAD' ? 'bg-surface-container-lowest text-primary border-outline-variant/40' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container'}`} 
              type="button"
            >
              Unread {filter === 'UNREAD' && `(${totalCount})`}
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-[420px] custom-scrollbar divide-y divide-surface-container">
            {isLoading ? (
              <div className="p-8 text-center text-on-surface-variant text-sm">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-sm flex flex-col items-center">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p>No notifications to display</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const styles = getColorClassesForType(notif.notification_type, notif.is_read);
                return (
                  <div 
                    key={notif.notification_id}
                    onClick={() => {
                      if (!notif.is_read) markAsReadMutation.mutate(notif.notification_id);
                    }}
                    className={`${styles.bg} ${notif.is_read ? '' : `border-l-[3px] ${styles.border}`} p-3 ${styles.hover} transition cursor-pointer flex items-start gap-3 ${styles.opacity}`}
                  >
                    <div className={`p-2 rounded-lg ${styles.iconBg} flex-shrink-0 mt-0.5`}>
                      {getIconForNotificationType(notif.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-xs text-on-surface leading-snug font-normal whitespace-pre-wrap">
                        {notif.message}
                      </p>
                      <span className="text-[11px] text-on-surface-variant font-medium mt-1 block">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>
                    {!notif.is_read && (
                      <div className="flex-shrink-0 mt-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary-container"></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
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
