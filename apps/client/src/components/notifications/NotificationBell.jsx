import { useState, useEffect, useRef, useCallback } from 'react';
import { notificationApi } from '../../lib/api.js';
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';

const TYPE_ICONS = {
  INFO: { icon: Info, color: 'text-blue-500 bg-blue-50 border-blue-100' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50 border-amber-100' },
  SECURITY: { icon: ShieldAlert, color: 'text-red-500 bg-red-50 border-red-100' },
  STATUS_CHANGE: { icon: RefreshCw, color: 'text-purple-500 bg-purple-50 border-purple-100' },
  APPROVAL_REQUIRED: { icon: CheckCircle2, color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
};

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay}d ago`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async (filterUnread = unreadOnly) => {
    try {
      const data = await notificationApi.list({
        page: 1,
        pageSize: 15,
        unreadOnly: filterUnread,
      });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Silently handle polling errors
    }
  }, [unreadOnly]);

  // Initial load and periodic polling every 30 seconds
  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      try {
        const data = await notificationApi.list({ page: 1, pageSize: 15, unreadOnly: false });
        if (isMounted) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // Silent polling error
      }
    }

    initialLoad();

    const interval = setInterval(() => {
      if (isMounted) {
        notificationApi
          .list({ page: 1, pageSize: 15, unreadOnly })
          .then((data) => {
            if (isMounted) {
              setNotifications(data.notifications || []);
              setUnreadCount(data.unreadCount || 0);
            }
          })
          .catch(() => {});
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [unreadOnly]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setIsLoading(true);
      fetchNotifications().finally(() => setIsLoading(false));
    }
  };

  const handleTabChange = (filterUnread) => {
    setUnreadOnly(filterUnread);
    setIsLoading(true);
    fetchNotifications(filterUnread).finally(() => setIsLoading(false));
  };

  const handleMarkAsRead = async (notification) => {
    if (notification.is_read) return;
    try {
      await notificationApi.markAsRead(notification.notification_id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notification.notification_id
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore failure
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // Ignore failure
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Open notifications feed"
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[520px]">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  title="Mark all as read"
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3 h-3" />
                  )}
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="p-2 border-b border-slate-100 flex items-center space-x-1 bg-white">
            <button
              type="button"
              onClick={() => handleTabChange(false)}
              className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
                !unreadOnly
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleTabChange(true)}
              className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
                unreadOnly
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mb-2" />
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-9 h-9 mx-auto bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-2">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {unreadOnly
                    ? 'No unread notifications at this time.'
                    : 'You have no notifications yet.'}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const typeConfig = TYPE_ICONS[n.notification_type] || TYPE_ICONS.INFO;
                const Icon = typeConfig.icon;
                const isUnread = !n.is_read;

                return (
                  <div
                    key={n.notification_id}
                    onClick={() => handleMarkAsRead(n)}
                    className={`p-3 transition-colors cursor-pointer flex items-start space-x-3 text-left ${
                      isUnread
                        ? 'bg-indigo-50/30 hover:bg-indigo-50/60'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${typeConfig.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {n.entity_type} • {n.entity_id}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>

                      <p
                        className={`text-xs leading-snug line-clamp-2 ${
                          isUnread ? 'text-slate-900 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        {n.message}
                      </p>

                      {n.action_url && (
                        <div className="mt-1.5 flex items-center space-x-1 text-[11px] text-indigo-600 font-medium">
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
