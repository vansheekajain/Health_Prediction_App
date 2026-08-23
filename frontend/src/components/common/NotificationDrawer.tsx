import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Clock, Mail, RefreshCw, X } from 'lucide-react';
import api from '../../api/index';
import { NotificationLog } from '../../types/index';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/my');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5" />
              <h2 className="text-lg font-bold">Notifications & Alerts</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                title="Refresh notifications"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No notification alerts yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="py-3.5 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-800">{n.title}</h4>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        n.type === 'LEAVE_CANCELLATION'
                          ? 'bg-red-100 text-red-700'
                          : n.type === 'POST_VISIT_SUMMARY'
                          ? 'bg-emerald-100 text-emerald-700'
                          : n.type === 'MEDICATION_REMINDER'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {n.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-2">{n.message}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Delivered
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
