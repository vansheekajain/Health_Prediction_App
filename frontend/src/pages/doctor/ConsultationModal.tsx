import React, { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Heart,
  Pill,
  Plus,
  Sparkles,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react';
import api from '../../api/index';
import { Appointment, PrescriptionItem } from '../../types/index';

interface ConsultationModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  appointment,
  onClose,
  onSuccess,
}) => {
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      medication: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'Three times daily after meals',
      instructions: 'Complete full 7-day course with water',
      durationDays: 7,
    },
  ]);
  const [previewingAi, setPreviewingAi] = useState(false);
  const [aiFriendlySummary, setAiFriendlySummary] = useState('');
  const [followUpSteps, setFollowUpSteps] = useState<string[]>([]);
  const [lifestyleAdvice, setLifestyleAdvice] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      {
        medication: '',
        dosage: '',
        frequency: 'Twice daily',
        instructions: 'Take with food',
        durationDays: 7,
      },
    ]);
  };

  const handleRemovePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleConvertWithAi = async () => {
    if (!clinicalNotes.trim()) {
      alert('Please enter clinical notes first.');
      return;
    }

    setPreviewingAi(true);
    try {
      const res = await api.post('/consultations/preview-ai', {
        clinicalNotes,
        diagnosis,
      });

      if (res.data.success) {
        const out = res.data.summary;
        setAiFriendlySummary(out.patientFriendlySummary);
        setFollowUpSteps(out.followUpSteps || []);
        setLifestyleAdvice(out.lifestyleAdvice || []);
      }
    } catch (e) {
      console.error(e);
      alert('AI Preview generation failed.');
    } finally {
      setPreviewingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalNotes.trim()) {
      alert('Clinical notes are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/consultations/save', {
        appointmentId: appointment.id,
        clinicalNotes,
        diagnosis,
        prescriptions,
        aiPatientFriendlySummary: aiFriendlySummary || undefined,
        followUpSteps: followUpSteps.length > 0 ? followUpSteps : undefined,
        lifestyleAdvice: lifestyleAdvice.length > 0 ? lifestyleAdvice : undefined,
      });

      if (res.data.success) {
        onSuccess();
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to save consultation record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Record Clinical Consultation</h2>
              <p className="text-xs text-emerald-100">Patient: {appointment.patient.name} • {appointment.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Diagnosis */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Diagnosis / Clinical Impression
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute Bacterial Sinusitis with mild dyspnea"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Doctor's Clinical Notes & Assessment
              </label>
              <button
                type="button"
                onClick={handleConvertWithAi}
                disabled={previewingAi}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {previewingAi ? 'AI Converting...' : '1-Click AI Patient Summary'}
              </button>
            </div>
            <textarea
              required
              rows={4}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Detailed findings: Throat examination shows erythematous pharynx with tonsillar exudate. Vitals stable. Prescribing 7-day amoxicillin course..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
            />
          </div>

          {/* AI Converted Summary Box */}
          {aiFriendlySummary && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Generated Patient-Friendly Summary (Will be emailed)
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-sans">{aiFriendlySummary}</p>
            </div>
          )}

          {/* Digital Prescriptions Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Digital Prescriptions & Dosage
              </label>
              <button
                type="button"
                onClick={handleAddPrescription}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Drug
              </button>
            </div>

            <div className="space-y-3">
              {prescriptions.map((rx, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs relative"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Medication Name"
                      value={rx.medication}
                      onChange={(e) => {
                        const updated = [...prescriptions];
                        updated[idx].medication = e.target.value;
                        setPrescriptions(updated);
                      }}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      value={rx.dosage}
                      onChange={(e) => {
                        const updated = [...prescriptions];
                        updated[idx].dosage = e.target.value;
                        setPrescriptions(updated);
                      }}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="Frequency (e.g. 2 times/day)"
                      value={rx.frequency}
                      onChange={(e) => {
                        const updated = [...prescriptions];
                        updated[idx].frequency = e.target.value;
                        setPrescriptions(updated);
                      }}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Special Instructions (e.g. After meals with water)"
                      value={rx.instructions}
                      onChange={(e) => {
                        const updated = [...prescriptions];
                        updated[idx].instructions = e.target.value;
                        setPrescriptions(updated);
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        title="Duration in days"
                        placeholder="Days"
                        value={rx.durationDays}
                        onChange={(e) => {
                          const updated = [...prescriptions];
                          updated[idx].durationDays = parseInt(e.target.value) || 7;
                          setPrescriptions(updated);
                        }}
                        className="w-16 px-2 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-center font-bold"
                      />
                      <span className="text-[10px] text-slate-400">days</span>
                    </div>

                    {prescriptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePrescription(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Saving & Sending Summary...' : 'Save & Dispatch to Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

