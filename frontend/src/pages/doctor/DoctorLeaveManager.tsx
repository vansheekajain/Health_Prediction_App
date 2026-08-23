import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  UserX,
} from 'lucide-react';
import api from '../../api/index';

export const DoctorLeaveManager: React.FC = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('Medical Conference / Continuing Education');
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

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

  const handlePreviewConflicts = async () => {
    if (!startDate || !endDate) return;
    setPreviewLoading(true);
    try {
      const res = await api.post('/leaves/preview', { startDate, endDate });
      if (res.data.success) {
        setConflicts(res.data.appointments);
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Preview failed.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setApplying(true);
    setSuccessBanner(null);
    try {
      const res = await api.post('/leaves/apply', {
        startDate,
        endDate,
        reason,
      });

      if (res.data.success) {
        setSuccessBanner(res.data.message);
        setConflicts([]);
        setStartDate('');
        setEndDate('');
        fetchLeaves();
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to submit leave.');
    } finally {
      setApplying(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!confirm('Cancel this scheduled leave?')) return;
    try {
      await api.delete(`/leaves/${id}`);
      fetchLeaves();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Physician Leave & Absence Manager</h1>
        <p className="text-sm text-slate-500 mt-1">
          Schedule time away with automatic patient conflict detection, instant cancellation, and email alerts
        </p>
      </div>

      {successBanner && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <span>✓ {successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} className="underline font-bold">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leave Request Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            Schedule New Leave
          </h2>

          <form onSubmit={handleApplyLeave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                min={startDate || new Date().toISOString().slice(0, 10)}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Medical Conference"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <button
              type="button"
              onClick={handlePreviewConflicts}
              disabled={!startDate || !endDate || previewLoading}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              {previewLoading ? 'Scanning Conflicts...' : '1. Scan Patient Conflicts'}
            </button>

            {/* Conflict Preview Box */}
            {conflicts.length > 0 && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{conflicts.length} Conflicting Appointment(s) Found!</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Submitting will automatically cancel these visits and email patients with reschedule links.
                </p>
                <div className="max-h-28 overflow-y-auto divide-y divide-red-100">
                  {conflicts.map((c) => (
                    <div key={c.id} className="py-1 text-[11px]">
                      <strong>{c.patientName}</strong> • {c.date} ({c.startTime})
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={applying || !startDate || !endDate}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {applying ? 'Applying & Notifying...' : '2. Confirm & Apply Leave'}
            </button>
          </form>
        </div>

        {/* Existing Leaves List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 mb-2">Scheduled Absence Periods</h2>

          {loading ? (
            <div className="h-32 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse"></div>
          ) : leaves.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 text-xs">
              No leave periods scheduled.
            </div>
          ) : (
            leaves.map((l) => (
              <div
                key={l.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {l.startDate} to {l.endDate}
                    </h4>
                    <p className="text-xs text-slate-500">{l.reason || 'Personal / Medical Leave'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCancelLeave(l.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Remove Leave"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
