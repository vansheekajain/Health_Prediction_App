import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  Heart,
  Pill,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import api from '../../api/index';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UrgencyBadge } from '../../components/common/UrgencyBadge';
import { Appointment } from '../../types/index';

export const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/my');
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
    fetchAppointments();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.post(`/appointments/${id}/cancel`, { reason: 'Cancelled by patient from portal' });
      fetchAppointments();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Cancellation failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Medical Consultations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review booked appointments, pre-visit AI triage evaluations, and post-visit digital care plans
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse"></div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Appointments Booked Yet</h3>
          <p className="text-sm text-slate-400 mt-1">Search our specialists directory to book your first visit.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const isExpanded = expandedId === appt.id;
            return (
              <div
                key={appt.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
              >
                {/* Appointment Main Bar */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-extrabold text-slate-900 text-base">Dr. {appt.doctor.name}</h3>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                          {appt.doctor.specialty}
                        </span>
                        <StatusBadge status={appt.status} />
                        {appt.preVisitSummary && (
                          <UrgencyBadge level={appt.preVisitSummary.urgencyLevel} size="sm" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {appt.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {appt.startTime} - {appt.endTime}
                        </span>
                        <span>Fee: <strong>${appt.doctor.consultationFee}</strong></span>
                      </div>

                      {appt.cancellationReason && (
                        <p className="text-xs font-semibold text-red-600 mt-2 bg-red-50 px-2.5 py-1 rounded-lg">
                          Reason: {appt.cancellationReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <a
                      href={`/api/appointments/${appt.id}/ics`}
                      download
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                      title="Download .ics calendar file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      .ICS
                    </a>

                    {appt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancel(appt.id)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : appt.id)}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          Hide Details <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          View AI Care Plan <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-100 p-6 space-y-6">
                    {/* Pre-Visit AI Triage Box */}
                    {appt.preVisitSummary && (
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Pre-Visit AI Symptom Summary & Urgency
                          </h4>
                        </div>
                        <div className="space-y-2 text-xs">
                          <p><strong>Chief Complaint:</strong> {appt.preVisitSummary.chiefComplaint}</p>
                          <p><strong>Reported Symptoms:</strong> {appt.symptomsText}</p>
                          {appt.preVisitSummary.triageNotes && (
                            <p className="text-slate-500 italic">{appt.preVisitSummary.triageNotes}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Post-Visit Digital Prescription & Care Plan */}
                    {appt.postVisitRecord ? (
                      <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <FileText className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            Physician Post-Visit Summary & Care Plan
                          </h4>
                        </div>

                        <div className="p-3.5 bg-emerald-50 rounded-xl text-xs text-slate-800 leading-relaxed">
                          <strong className="text-emerald-900 block mb-1">Patient-Friendly AI Summary:</strong>
                          {appt.postVisitRecord.aiPatientFriendlySummary}
                        </div>

                        {appt.postVisitRecord.prescriptions.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-blue-600" />
                              Medication Schedule
                            </h5>
                            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                              {appt.postVisitRecord.prescriptions.map((rx, idx) => (
                                <div key={idx} className="p-2.5 bg-slate-50 flex items-center justify-between">
                                  <div>
                                    <span className="font-bold text-slate-900">{rx.medication}</span> ({rx.dosage})
                                    <div className="text-[11px] text-slate-500">{rx.instructions}</div>
                                  </div>
                                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                    {rx.frequency} • {rx.durationDays}d
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {appt.postVisitRecord.followUpSteps.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-slate-700 mb-1">Follow-up Instructions:</h5>
                            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                              {appt.postVisitRecord.followUpSteps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-400 bg-white rounded-xl border border-slate-100">
                        Post-visit care summary will appear here once Dr. {appt.doctor.name} concludes your consultation.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
