import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileQuestion,
  Heart,
  HelpCircle,
  Sparkles,
  Stethoscope,
  User,
  X,
} from 'lucide-react';
import { UrgencyBadge } from '../../components/common/UrgencyBadge';
import { Appointment } from '../../types/index';

interface PreVisitSummaryModalProps {
  appointment: Appointment;
  onClose: () => void;
}

export const PreVisitSummaryModal: React.FC<PreVisitSummaryModalProps> = ({
  appointment,
  onClose,
}) => {
  const summary = appointment.preVisitSummary;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Pre-Visit Clinical Summary</h2>
              <p className="text-xs text-indigo-100">Patient: {appointment.patient.name} • {appointment.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Urgency & Chief Complaint */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Calculated Triage Urgency
              </span>
              <div className="mt-1">
                <UrgencyBadge level={summary?.urgencyLevel || 'LOW'} size="lg" />
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Slot Time
              </span>
              <span className="text-sm font-bold text-slate-900">
                {appointment.startTime} - {appointment.endTime}
              </span>
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Chief Medical Concern
            </h4>
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs sm:text-sm font-semibold text-indigo-950">
              {summary?.chiefComplaint || appointment.symptomsText || 'General Consultation'}
            </div>
          </div>

          {/* Raw Reported Symptoms */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Patient-Reported Symptoms
            </h4>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed">
              {appointment.symptomsText || 'No prior symptoms submitted.'}
            </div>
          </div>

          {/* 3 Suggested Questions */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                3 AI-Suggested Diagnostic Questions for Doctor
              </h4>
            </div>
            <div className="space-y-2">
              {summary?.suggestedQuestions && summary.suggestedQuestions.length > 0 ? (
                summary.suggestedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl text-xs text-purple-950 flex items-start gap-2.5 font-medium"
                  >
                    <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span>{q}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No questions generated.</p>
              )}
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Close Triage Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
