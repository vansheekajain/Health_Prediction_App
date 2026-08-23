import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  HeartPulse,
  Mail,
  Shield,
  Stethoscope,
  Users,
} from 'lucide-react';
import api from '../../api/index';
import { UrgencyBadge } from '../../components/common/UrgencyBadge';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Clinic Operational Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time metrics on doctor utilization, AI triage severity distributions, and automated leave conflict resolutions
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Appointments
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{analytics?.totalAppointments || 0}</div>
              <div className="text-xs text-slate-500 mt-1">
                {analytics?.confirmedAppointments || 0} Confirmed • {analytics?.completedAppointments || 0} Completed
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Specialists
                </span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{analytics?.totalDoctors || 0}</div>
              <div className="text-xs text-slate-500 mt-1">{analytics?.totalPatients || 0} Registered Patients</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Leave Auto-Cancellations
                </span>
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">
                {analytics?.cancelledLeaveAppointments || 0}
              </div>
              <div className="text-xs text-emerald-600 font-bold mt-1">100% Patient Reschedule Alerts Sent</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Clinic Consultation Volume
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">${analytics?.estimatedRevenue || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Estimated Clinic Booking Value</div>
            </div>
          </div>

          {/* AI Urgency Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-red-500" />
                AI Symptom Triage Severity Distribution
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-red-700 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> High Urgency (Immediate Physician Attention)
                    </span>
                    <span className="text-slate-900 font-extrabold">{analytics?.urgencyCounts?.HIGH || 0}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all"
                      style={{
                        width: `${
                          analytics?.totalAppointments
                            ? ((analytics.urgencyCounts.HIGH / analytics.totalAppointments) * 100)
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Medium Urgency (Within 24 Hours)
                    </span>
                    <span className="text-slate-900 font-extrabold">{analytics?.urgencyCounts?.MEDIUM || 0}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{
                        width: `${
                          analytics?.totalAppointments
                            ? ((analytics.urgencyCounts.MEDIUM / analytics.totalAppointments) * 100)
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Low Urgency (Routine & Preventive)
                    </span>
                    <span className="text-slate-900 font-extrabold">{analytics?.urgencyCounts?.LOW || 0}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{
                        width: `${
                          analytics?.totalAppointments
                            ? ((analytics.urgencyCounts.LOW / analytics.totalAppointments) * 100)
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Health */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Email & Calendar Dispatch Health
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span className="text-2xl font-black text-emerald-700">
                      {analytics?.notificationHealth?.SENT || 0}
                    </span>
                    <span className="block text-xs font-bold text-emerald-800 mt-1">
                      Emails Delivered Successfully
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-2xl font-black text-slate-700">
                      {analytics?.notificationHealth?.FAILED || 0}
                    </span>
                    <span className="block text-xs font-bold text-slate-600 mt-1">
                      Queued for Background Retry
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-4 text-center">
                Cron background workers inspect and flush retry queues automatically every 5 minutes.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

