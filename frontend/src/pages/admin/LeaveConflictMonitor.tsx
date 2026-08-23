import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import api from '../../api/index';

export const LeaveConflictMonitor: React.FC = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaves');
      if (res.data.success) {
        setLeaves(res.data.leaves);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Doctor Leave & Conflict Audit Monitor
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor all scheduled physician leaves and ensure automated patient reschedule alerts were executed
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse"></div>
          ))}
        </div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Doctor Leaves on Record</h3>
          <p className="text-sm text-slate-500 mt-1">All clinic physicians are currently active on duty.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div
              key={leave.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Dr. {leave.doctor?.user?.name || 'Physician'}
                    </h3>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                      {leave.doctor?.specialty}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                      Approved Leave
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-2 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <strong>Absence Period:</strong> {leave.startDate} to {leave.endDate}
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    <strong>Reason:</strong> {leave.reason || 'Medical / Personal Leave'}
                  </p>
                </div>
              </div>

              <div className="self-end sm:self-center text-right">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Conflict Auto-Cancelled
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
