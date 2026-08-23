import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  HeartPulse,
  Lock,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import api from '../../api/index';
import { Doctor, SlotAvailability } from '../../types/index';

interface BookAppointmentModalProps {
  doctor: Doctor;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  doctor,
  onClose,
  onSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);
  const [symptomsText, setSymptomsText] = useState('');
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [remainingSecs, setRemainingSecs] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const fetchSlots = async (date: string) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    setBookingError(null);
    try {
      const res = await api.get(`/appointments/slots?doctorId=${doctor.id}&date=${date}`);
      if (res.data.success) {
        setSlots(res.data.slots);
      }
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Failed to load doctor slots.');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!holdExpiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.floor((holdExpiresAt.getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingSecs(0);
        setHoldToken(null);
        setHoldExpiresAt(null);
        setSelectedSlot(null);
        setBookingError('Slot reservation expired. Please pick your slot again.');
        fetchSlots(selectedDate);
        clearInterval(interval);
      } else {
        setRemainingSecs(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt, selectedDate]);

  const handleSelectSlot = async (slot: SlotAvailability) => {
    if (!slot.isAvailable) return;
    setBookingError(null);

    try {
      const res = await api.post('/appointments/hold', {
        doctorId: doctor.id,
        date: selectedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });

      if (res.data.success) {
        setSelectedSlot(slot);
        setHoldToken(res.data.holdToken);
        setHoldExpiresAt(new Date(res.data.expiresAt));
      }
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Slot could not be held.');
      fetchSlots(selectedDate);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setBookingError('Please choose an available time slot.');
      return;
    }
    if (!symptomsText.trim()) {
      setBookingError('Please briefly describe your symptoms for pre-visit clinical triage.');
      return;
    }

    setSubmitting(true);
    setBookingError(null);

    try {
      const res = await api.post('/appointments/book', {
        doctorId: doctor.id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        symptomsText,
        holdToken,
      });

      if (res.data.success) {
        onSuccess();
      }
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Booking transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Book Appointment with Dr. {doctor.name}</h2>
              <p className="text-xs text-blue-100">{doctor.specialty} • ${doctor.consultationFee} Fee</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hold Countdown Banner */}
        {holdToken && remainingSecs > 0 && (
          <div className="bg-amber-500 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold animate-pulse">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Slot Locked For You: {selectedSlot?.startTime} - {selectedSlot?.endTime}</span>
            </div>
            <span className="bg-amber-700 px-2 py-0.5 rounded-full">
              Expires in {formatTimer(remainingSecs)}
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleBookAppointment} className="p-6 space-y-6">
          {bookingError && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Appointment Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Slots Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Available Time Slots ({doctor.slotDurationMinutes} mins)
              </label>
              <span className="text-xs text-slate-400 font-medium">Click to hold for 5 mins</span>
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 py-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No slots available on {selectedDate}. The doctor may not be practicing or is on scheduled leave.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                {slots.map((slot) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={!slot.isAvailable && !isSelected}
                      onClick={() => handleSelectSlot(slot)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-1'
                          : slot.isAvailable
                          ? 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200 hover:border-blue-300'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                      }`}
                    >
                      <span>{slot.startTime}</span>
                      <span className="text-[10px] font-normal opacity-80">{slot.endTime}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pre-Visit Symptoms Input with AI badge */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Share Symptoms in Advance
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                AI Pre-Visit Triage Enabled
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={symptomsText}
              onChange={(e) => setSymptomsText(e.target.value)}
              placeholder="e.g. Mild chest tightness and fatigue for 2 days, worse after climbing stairs..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Our clinical AI will analyze your symptoms to calculate urgency (Low/Medium/High) and prepare 3 diagnostic questions for Dr. {doctor.name} before you step in.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? 'Confirming with AI Triage...' : 'Confirm & Sync Calendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
