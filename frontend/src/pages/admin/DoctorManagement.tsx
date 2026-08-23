import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  GraduationCap,
  Plus,
  Search,
  Star,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import api from '../../api/index';
import { Doctor } from '../../types/index';

export const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'CuraPulse#2026!',
    phone: '',
    specialty: 'Cardiology',
    qualification: 'MD, FACC',
    experienceYears: 10,
    consultationFee: 120,
    slotDurationMinutes: 30,
    bio: '',
  });

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors');
      if (res.data.success) {
        setDoctors(res.data.doctors);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/doctors', formData);
      if (res.data.success) {
        setIsCreateOpen(false);
        fetchDoctors();
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to create doctor.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Doctor Profile Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Onboard physicians, configure working hours, slot durations, and consultation pricing
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          Onboard New Physician
        </button>
      </div>

      {/* Doctor Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4 mb-3">
                  <img
                    src={doc.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=7c3aed&color=fff`}
                    alt={doc.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shrink-0"
                  />
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{doc.name}</h3>
                    <span className="inline-block text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full mt-0.5">
                      {doc.specialty}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-1">{doc.email}</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 my-4 border-t border-b border-slate-100 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Slot Duration:</span>
                    <span className="font-bold text-slate-800">{doc.slotDurationMinutes || 30} mins</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Consultation Fee:</span>
                    <span className="font-bold text-slate-800">${doc.consultationFee}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Rating:</span>
                    <span className="font-bold text-amber-500">★ {doc.rating.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-center">
                Profile active in patient search directory
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboard Doctor Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8">
            <div className="px-6 py-5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between">
              <h2 className="text-lg font-bold">Onboard New Physician</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Physician Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dr. Alexander Wright"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="doctor@cliniccare.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Specialty
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="Cardiology"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Fee ($)
                  </label>
                  <input
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e) =>
                      setFormData({ ...formData, consultationFee: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Slot Duration (Mins)
                  </label>
                  <select
                    value={formData.slotDurationMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, slotDurationMinutes: parseInt(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Qualifications
                </label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="MD, FACC"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save Physician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

