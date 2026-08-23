import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  Pill,
  RefreshCw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import api from '../../api/index';
import { MedicationReminder } from '../../types/index';

export const MedicationTracker: React.FC = () => {
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toISOString().slice(0, 10);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/medications');
      if (res.data.success) {
        setReminders(res.data.reminders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleLogDose = async (reminderId: string, time: string, status: 'TAKEN' | 'SKIPPED') => {
    try {
      await api.post('/notifications/medications/log', {
        reminderId,
        scheduledDate: todayStr,
        scheduledTime: time,
        status,
      });
      fetchReminders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Daily Medication & Dosage Tracker</h1>
        <p className="text-sm text-slate-500 mt-1">
          Automated dose checkpoints generated directly from your physician post-visit prescriptions
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse"></div>
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Pill className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Active Prescriptions</h3>
          <p className="text-sm text-slate-400 mt-1">
            When your doctor completes a consultation with prescriptions, dosage checkpoints will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{rem.medicationName}</h3>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        {rem.dosage}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Active Regimen
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 my-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <p><strong>Frequency:</strong> {rem.frequency}</p>
                  <p><strong>Instructions:</strong> {rem.instructions || 'Take as directed'}</p>
                  <p><strong>Duration:</strong> {rem.startDate} to {rem.endDate}</p>
                </div>
              </div>

              {/* Today Dose Checkpoints */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Today's Scheduled Doses ({todayStr})
                </h4>
                <div className="space-y-2">
                  {rem.scheduledTimes.map((time) => {
                    const log = rem.logs.find(
                      (l) => l.scheduledDate === todayStr && l.scheduledTime === time
                    );

                    return (
                      <div
                        key={time}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-800">{time}</span>
                        </div>

                        {log?.status === 'TAKEN' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                          </span>
                        ) : log?.status === 'SKIPPED' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5" /> Skipped
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleLogDose(rem.id, time, 'TAKEN')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                            >
                              Mark Taken
                            </button>
                            <button
                              onClick={() => handleLogDose(rem.id, time, 'SKIPPED')}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                            >
                              Skip
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
