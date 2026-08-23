import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Lock,
  Mail,
  Shield,
  Sparkles,
  Stethoscope,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user || localStorage.getItem('token')) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleDirectLogin = async (targetEmail: string) => {
    setError('');
    setIsSubmitting(true);
    try {
      await login(targetEmail);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials or register.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-inner">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In to CuraPulse
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Healthcare Appointment, AI Triage & Prescription Platform
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Instant Direct Enter */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200 space-y-3">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
              1-Click Instant Enter
            </span>
            <p className="text-[11px] text-slate-600 mt-1.5">
              Click any role to enter instantly without typing passwords:
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDirectLogin('patient@cliniccare.com')}
              className="py-3 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex flex-col items-center gap-1 disabled:opacity-50"
            >
              <User className="w-5 h-5" />
              <span>Patient</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDirectLogin('doctor.jenkins@cliniccare.com')}
              className="py-3 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex flex-col items-center gap-1 disabled:opacity-50"
            >
              <Stethoscope className="w-5 h-5" />
              <span>Doctor</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDirectLogin('admin@cliniccare.com')}
              className="py-3 px-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 flex flex-col items-center gap-1 disabled:opacity-50"
            >
              <Shield className="w-5 h-5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Standard Manual Login Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. patient@cliniccare.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In Manually</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700">
              Register as Patient
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
