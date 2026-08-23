import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileEdit,
  FileText,
  Filter,
  Sparkles,
  Stethoscope,
  User,
} from 'lucide-react';
import api from '../../api/index';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UrgencyBadge } from '../../components/common/UrgencyBadge';
import { Appointment } from '../../types/index';
import { ConsultationModal } from './ConsultationModal';
import { PreVisitSummaryModal } from './PreVisitSummaryModal';

export const DoctorDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [activePreVisitAppt, setActivePreVisitAppt] = useState<Appointment | null>(null);
  const [activeConsultationAppt, setActiveConsultationAppt] = useState<Appointment | null>(null);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/doctors/schedule/view?date=${selectedDate}`);
      if (res.data.success) {
        setAppointments(res.data.appointments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedDate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Physician Daily Consultation Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Prioritize patients by AI clinical triage urgency and produce post-visit digital summaries
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
          />
        </div>
      </div>

      {/* Appointment Queue Table / Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse"></div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Patient Visits Scheduled for {selectedDate}</h3>
          <p className="text-sm text-slate-400 mt-1">Check another date or adjust your practicing hours.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-sm shrink-0">
                  {appt.startTime}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-extrabold text-slate-900 text-base">{appt.patient.name}</h3>
                    <span className="text-xs text-slate-400">{appt.patient.email}</span>
                    <StatusBadge status={appt.status} />
                    {appt.preVisitSummary && (
                      <UrgencyBadge level={appt.preVisitSummary.urgencyLevel} size="sm" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                    <strong>Chief Concern:</strong>{' '}
                    {appt.preVisitSummary?.chiefComplaint || appt.symptomsText || 'General Consultation'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {appt.preVisitSummary && (
                  <button
                    onClick={() => setActivePreVisitAppt(appt)}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    AI Triage & Questions
                  </button>
                )}

                {appt.status !== 'CANCELLED_DUE_TO_LEAVE' && appt.status !== 'CANCELLED_BY_PATIENT' && (
                  <button
                    onClick={() => setActiveConsultationAppt(appt)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    {appt.hasPostVisitRecord ? 'Edit Consultation' : 'Conduct Consultation'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pre-Visit Triage Modal */}
      {activePreVisitAppt && (
        <PreVisitSummaryModal
          appointment={activePreVisitAppt}
          onClose={() => setActivePreVisitAppt(null)}
        />
      )}

      {/* Post-Visit Consultation Modal */}
      {activeConsultationAppt && (
        <ConsultationModal
          appointment={activeConsultationAppt}
          onClose={() => setActiveConsultationAppt(null)}
          onSuccess={() => {
            setActiveConsultationAppt(null);
            fetchSchedule();
          }}
        />
      )}
    </div>
  );
};
