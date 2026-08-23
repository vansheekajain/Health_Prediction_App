import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  Bell,
  Calendar,
  ChevronDown,
  Clock,
  Heart,
  LogOut,
  Pill,
  Shield,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/index';
import { NotificationDrawer } from './NotificationDrawer';

export const Navbar: React.FC = () => {
  const { user, logout, switchPersona, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Top Quick Role Switcher Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-200">Instant Demo Persona Switcher:</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 my-0.5">
          <button
            onClick={() => switchPersona('PATIENT')}
            disabled={loading}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
              user?.role === 'PATIENT'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Patient Mode
          </button>
          <button
            onClick={() => switchPersona('DOCTOR')}
            disabled={loading}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
              user?.role === 'DOCTOR'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Doctor Mode
          </button>
          <button
            onClick={() => switchPersona('ADMIN')}
            disabled={loading}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
              user?.role === 'ADMIN'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin Mode
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                CuraPulse
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                Health Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links by Role */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {user.role === 'PATIENT' && (
                <>
                  <Link
                    to="/patient/doctors"
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      isActive('/patient/doctors')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    Book Doctor
                  </Link>
                  <Link
                    to="/patient/appointments"
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      isActive('/patient/appointments')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    My Appointments
                  </Link>
                  <Link
                    to="/patient/medications"
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      isActive('/patient/medications')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Pill className="w-4 h-4" />
                    Medication Tracker
                  </Link>
                </>
              )}

              {user.role === 'DOCTOR' && (
                <>
                  <Link
                    to="/doctor/dashboard"
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      isActive('/doctor/dashboard')
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Patient Queue & Schedule
                  </Link>
                  <Link
                    to="/doctor/leaves"
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      isActive('/doctor/leaves')
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Leave Management
                  </Link>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      isActive('/admin/dashboard')
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    Analytics Dashboard
                  </Link>
                  <Link
                    to="/admin/doctors"
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      isActive('/admin/doctors')
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Doctor Management
                  </Link>
                  <Link
                    to="/admin/conflicts"
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      isActive('/admin/conflicts')
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Leave Conflict Monitor
                  </Link>
                  <Link
                    to="/admin/logs"
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      isActive('/admin/logs')
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Notification Audit Logs
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setIsNotifOpen(true)}
                  className="p-2 rounded-full text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600"></span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-800 leading-tight">{user.name}</div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {user.role}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
