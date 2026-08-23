const fs = require('fs');
const path = require('path');

console.log('Writing Part 2 files...');

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf-8');
  console.log(`✓ Wrote ${relPath} (${fs.statSync(fullPath).size} bytes)`);
}

// 1. frontend/src/types/index.ts
writeFile('frontend/src/types/index.ts', `
export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  doctorProfileId?: string | null;
}

export interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  isWorking: boolean;
  breaks: {
    startTime: string;
    endTime: string;
  }[];
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  specialty: string;
  bio?: string;
  qualification?: string;
  experienceYears: number;
  consultationFee: number;
  slotDurationMinutes: number;
  workingHours: DaySchedule[];
  rating: number;
  reviewCount: number;
  upcomingLeaves?: {
    id: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }[];
}

export interface SlotAvailability {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isHeld: boolean;
  holdExpiresAt?: string;
  reason?: string;
}

export interface PreVisitSummary {
  id: string;
  appointmentId: string;
  symptomsText: string;
  urgencyLevel: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
  triageNotes?: string;
  createdAt: string;
}

export interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  instructions: string;
  durationDays: number;
  scheduledTimes?: string[];
}

export interface PostVisitRecord {
  id: string;
  appointmentId: string;
  clinicalNotes: string;
  diagnosis?: string;
  prescriptions: PrescriptionItem[];
  aiPatientFriendlySummary: string;
  followUpSteps: string[];
  lifestyleAdvice: string[];
  createdAt: string;
}

export interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  symptomsText?: string;
  cancellationReason?: string;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  doctor: {
    id: string;
    name: string;
    email: string;
    specialty: string;
    consultationFee: number;
  };
  preVisitSummary?: PreVisitSummary | null;
  hasPostVisitRecord?: boolean;
  postVisitRecord?: PostVisitRecord | null;
}

export interface MedicationReminder {
  id: string;
  patientId: string;
  appointmentId?: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  scheduledTimes: string[];
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  logs: {
    id: string;
    scheduledDate: string;
    scheduledTime: string;
    status: 'PENDING' | 'TAKEN' | 'SKIPPED';
    takenAt?: string;
  }[];
}

export interface NotificationLog {
  id: string;
  recipientEmail: string;
  recipientId?: string;
  appointmentId?: string;
  type: string;
  title: string;
  message: string;
  htmlContent?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  retryCount: number;
  lastError?: string;
  sentAt?: string;
  createdAt: string;
}
`);

// 2. frontend/src/index.css
writeFile('frontend/src/index.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-slate-50 text-slate-900 antialiased font-sans;
  }
}
`);

// 3. frontend/index.html
writeFile('frontend/index.html', `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CuraPulse - Healthcare Appointment & Follow-up Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

// 4. frontend/tailwind.config.js
writeFile('frontend/tailwind.config.js', `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
`);

// 5. frontend/postcss.config.js
writeFile('frontend/postcss.config.js', `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`);

// 6. frontend/tsconfig.json
writeFile('frontend/tsconfig.json', `
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
`);

// 7. frontend/vite.config.ts
writeFile('frontend/vite.config.ts', `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
`);

// 8. backend/tsconfig.json
writeFile('backend/tsconfig.json', `
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
`);

// 9. backend/jest.config.js
writeFile('backend/jest.config.js', `
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
`);

// 10. frontend/src/main.tsx
writeFile('frontend/src/main.tsx', `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);

// 11. frontend/src/App.tsx
writeFile('frontend/src/App.tsx', `
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DoctorManagement } from './pages/admin/DoctorManagement';
import { LeaveConflictMonitor } from './pages/admin/LeaveConflictMonitor';
import { NotificationLogs } from './pages/admin/NotificationLogs';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorLeaveManager } from './pages/doctor/DoctorLeaveManager';
import { DoctorDirectory } from './pages/patient/DoctorDirectory';
import { MedicationTracker } from './pages/patient/MedicationTracker';
import { PatientAppointments } from './pages/patient/PatientAppointments';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading CuraPulse...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/patient/doctors" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Patient Routes */}
              <Route
                path="/patient/doctors"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                    <DoctorDirectory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/appointments"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                    <PatientAppointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/medications"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                    <MedicationTracker />
                  </ProtectedRoute>
                }
              />

              {/* Doctor Routes */}
              <Route
                path="/doctor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/leaves"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                    <DoctorLeaveManager />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/doctors"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DoctorManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/conflicts"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <LeaveConflictMonitor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/logs"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <NotificationLogs />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};
`);

// 12. frontend/src/pages/auth/Login.tsx
writeFile('frontend/src/pages/auth/Login.tsx', `
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, Lock, Mail, Shield, Stethoscope, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('patient@cliniccare.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mx-auto mb-4">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome to CuraPulse</h2>
          <p className="text-sm text-slate-500 mt-1.5">Sign in to manage appointments & AI care summaries</p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="mb-6 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
            Instant Demo Account Fill
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('patient@cliniccare.com')}
              className="px-2 py-1.5 bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold rounded-xl transition-all flex flex-col items-center gap-1 shadow-sm"
            >
              <User className="w-4 h-4 text-blue-600" />
              Patient
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('doctor.jenkins@cliniccare.com')}
              className="px-2 py-1.5 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold rounded-xl transition-all flex flex-col items-center gap-1 shadow-sm"
            >
              <Stethoscope className="w-4 h-4 text-indigo-600" />
              Doctor
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@cliniccare.com')}
              className="px-2 py-1.5 bg-white border border-slate-200 hover:border-purple-500 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-semibold rounded-xl transition-all flex flex-col items-center gap-1 shadow-sm"
            >
              <Shield className="w-4 h-4 text-purple-600" />
              Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                placeholder="name@cliniccare.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Register as Patient
          </Link>
        </p>
      </div>
    </div>
  );
};
`);

// 13. frontend/src/pages/auth/Register.tsx
writeFile('frontend/src/pages/auth/Register.tsx', `
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, Lock, Mail, Phone, User } from 'lucide-react';
import api from '../../api/index';
import { useAuth } from '../../context/AuthContext';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        phone,
        role: 'PATIENT',
      });

      if (res.data.success) {
        await login(email, password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mx-auto mb-4">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Patient Account</h2>
          <p className="text-sm text-slate-500 mt-1.5">Book consultations & access AI clinical care summaries</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                placeholder="Minimum 6 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>{isSubmitting ? 'Creating Account...' : 'Register'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
`);

// 14. frontend/src/pages/patient/BookAppointmentModal.tsx
writeFile('frontend/src/pages/patient/BookAppointmentModal.tsx', `
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
      const res = await api.get(\`/appointments/slots?doctorId=\${doctor.id}&date=\${date}\`);
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
    return \`\${mins}:\${secs.toString().padStart(2, '0')}\`;
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
                      className={\`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border \${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-1'
                          : slot.isAvailable
                          ? 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200 hover:border-blue-300'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                      }\`}
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
`);

// 15. frontend/src/pages/patient/DoctorDirectory.tsx
writeFile('frontend/src/pages/patient/DoctorDirectory.tsx', `
import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  GraduationCap,
  Heart,
  Search,
  Sparkles,
  Star,
  Stethoscope,
  Users,
} from 'lucide-react';
import api from '../../api/index';
import { Doctor } from '../../types/index';
import { BookAppointmentModal } from './BookAppointmentModal';

export const DoctorDirectory: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [bookingSuccessBanner, setBookingSuccessBanner] = useState(false);

  const specialties = [
    'All',
    'Cardiology',
    'Neurology',
    'Dermatology',
    'General Physician & Internal Medicine',
    'Pediatrics',
  ];

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors');
      if (res.data.success) {
        setDoctors(res.data.doctors);
      }
    } catch (e) {
      console.error('Failed to load doctors:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.bio && doc.bio.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpecialty =
      selectedSpecialty === 'All' || doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-blue-500/10 mb-8 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI-Augmented Healthcare Booking
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Consult Premier Medical Specialists
          </h1>
          <p className="text-blue-100 text-sm sm:text-base mt-2">
            Share symptoms beforehand for automated AI clinical triage, hold slots safely for 5 minutes, and sync directly with Google Calendar.
          </p>
        </div>
      </div>

      {bookingSuccessBanner && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-sm font-semibold">
          <span>🎉 Appointment booked successfully! Confirmation email and calendar invite dispatched.</span>
          <button
            onClick={() => setBookingSuccessBanner(false)}
            className="text-xs text-emerald-700 underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search physician by name, specialty, or condition..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          />
        </div>

        {/* Specialty Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={\`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all \${
                selectedSpecialty === spec
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }\`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse"></div>
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Specialists Found</h3>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria or specialty filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Doctor Avatar & Header */}
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={doc.avatarUrl || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(doc.name)}&background=2563eb&color=fff\`}
                    alt={doc.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md shadow-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                        {doc.specialty}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{doc.rating.toFixed(1)}</span>
                        <span className="text-slate-400 font-normal">({doc.reviewCount})</span>
                      </div>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1 truncate">{doc.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{doc.qualification}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">{doc.bio}</p>

                {/* Metadata Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>{doc.experienceYears}+ Yrs Exp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{doc.slotDurationMinutes || 30} Min Slot</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Consultation Fee
                  </span>
                  <span className="text-lg font-black text-slate-900">${doc.consultationFee}</span>
                </div>
                <button
                  onClick={() => setSelectedDoctorForBooking(doc)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  Book Visit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedDoctorForBooking && (
        <BookAppointmentModal
          doctor={selectedDoctorForBooking}
          onClose={() => setSelectedDoctorForBooking(null)}
          onSuccess={() => {
            setSelectedDoctorForBooking(null);
            setBookingSuccessBanner(true);
          }}
        />
      )}
    </div>
  );
};
`);

// 16. frontend/src/pages/patient/PatientAppointments.tsx
writeFile('frontend/src/pages/patient/PatientAppointments.tsx', `
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
      await api.post(\`/appointments/\${id}/cancel\`, { reason: 'Cancelled by patient from portal' });
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
                      href={\`/api/appointments/\${appt.id}/ics\`}
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
`);

// 17. frontend/src/pages/patient/MedicationTracker.tsx
writeFile('frontend/src/pages/patient/MedicationTracker.tsx', `
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
`);

// 18. frontend/src/pages/doctor/PreVisitSummaryModal.tsx
writeFile('frontend/src/pages/doctor/PreVisitSummaryModal.tsx', `
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
`);

// 19. frontend/src/pages/doctor/ConsultationModal.tsx
writeFile('frontend/src/pages/doctor/ConsultationModal.tsx', `
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
`);

// 20. frontend/src/pages/doctor/DoctorDashboard.tsx
writeFile('frontend/src/pages/doctor/DoctorDashboard.tsx', `
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
      const res = await api.get(\`/doctors/schedule/view?date=\${selectedDate}\`);
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
`);

// 21. frontend/src/pages/doctor/DoctorLeaveManager.tsx
writeFile('frontend/src/pages/doctor/DoctorLeaveManager.tsx', `
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
      await api.delete(\`/leaves/\${id}\`);
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
`);

// 22. frontend/src/pages/admin/AdminDashboard.tsx
writeFile('frontend/src/pages/admin/AdminDashboard.tsx', `
import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  HeartPulse,
  Mail,
  Shield,
  Stethoscope,
  Users,
} from 'lucide-react';
import api from '../../api/index';
import { UrgencyBadge } from '../../components/common/UrgencyBadge';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Clinic Operational Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time metrics on doctor utilization, AI triage severity distributions, and automated leave conflict resolutions
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Appointments
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{analytics?.totalAppointments || 0}</div>
              <div className="text-xs text-slate-500 mt-1">
                {analytics?.confirmedAppointments || 0} Confirmed • {analytics?.completedAppointments || 0} Completed
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Specialists
                </span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{analytics?.totalDoctors || 0}</div>
              <div className="text-xs text-slate-500 mt-1">{analytics?.totalPatients || 0} Registered Patients</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Leave Auto-Cancellations
                </span>
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">
                {analytics?.cancelledLeaveAppointments || 0}
              </div>
              <div className="text-xs text-emerald-600 font-bold mt-1">100% Patient Reschedule Alerts Sent</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Clinic Consultation Volume
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">${analytics?.estimatedRevenue || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Estimated Clinic Booking Value</div>
            </div>
          </div>

          {/* AI Urgency Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-red-500" />
                AI Symptom Triage Severity Distribution
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-red-700 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> High Urgency (Immediate Physician Attention)
                    </span>
                    <span className="text-slate-900 font-extrabold">{analytics?.urgencyCounts?.HIGH || 0}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all"
                      style={{
                        width: \`\${
                          analytics?.totalAppointments
                            ? ((analytics.urgencyCounts.HIGH / analytics.totalAppointments) * 100)
                            : 0
                        }%\`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Medium Urgency (Within 24 Hours)
                    </span>
                    <span className="text-slate-900 font-extrabold">{analytics?.urgencyCounts?.MEDIUM || 0}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{
                        width: \`\${
                          analytics?.totalAppointments
                            ? ((analytics.urgencyCounts.MEDIUM / analytics.totalAppointments) * 100)
                            : 0
                        }%\`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Low Urgency (Routine & Preventive)
                    </span>
                    <span className="text-slate-900 font-extrabold">{analytics?.urgencyCounts?.LOW || 0}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{
                        width: \`\${
                          analytics?.totalAppointments
                            ? ((analytics.urgencyCounts.LOW / analytics.totalAppointments) * 100)
                            : 0
                        }%\`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Health */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Email & Calendar Dispatch Health
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span className="text-2xl font-black text-emerald-700">
                      {analytics?.notificationHealth?.SENT || 0}
                    </span>
                    <span className="block text-xs font-bold text-emerald-800 mt-1">
                      Emails Delivered Successfully
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-2xl font-black text-slate-700">
                      {analytics?.notificationHealth?.FAILED || 0}
                    </span>
                    <span className="block text-xs font-bold text-slate-600 mt-1">
                      Queued for Background Retry
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-4 text-center">
                Cron background workers inspect and flush retry queues automatically every 5 minutes.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
`);

// 23. backend/src/__tests__/concurrency.test.ts
writeFile('backend/src/__tests__/concurrency.test.ts', `
import {
  acquireSlotHold,
  bookAppointment,
  cleanupExpiredSlotHolds,
  getDoctorAvailableSlots,
} from '../services/booking.service';
import { prisma } from '../utils/prisma';

describe('Slot Calculation & Concurrency Double-Booking Protection', () => {
  let doctor: any;
  let patientA: any;
  let patientB: any;
  const testDate = '2026-09-15';

  beforeAll(async () => {
    patientA = await prisma.user.create({
      data: {
        name: 'Test Patient A',
        email: \`testpatient_a_\${Date.now()}@cliniccare.com\`,
        passwordHash: 'hashed',
        role: 'PATIENT',
      },
    });

    patientB = await prisma.user.create({
      data: {
        name: 'Test Patient B',
        email: \`testpatient_b_\${Date.now()}@cliniccare.com\`,
        passwordHash: 'hashed',
        role: 'PATIENT',
      },
    });

    const docUser = await prisma.user.create({
      data: {
        name: 'Dr. Concurrency Test',
        email: \`testdoctor_\${Date.now()}@cliniccare.com\`,
        passwordHash: 'hashed',
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specialty: 'Cardiology',
            consultationFee: 100,
            slotDurationMinutes: 30,
            workingHours: JSON.stringify([
              {
                dayOfWeek: 2,
                dayName: 'Tuesday',
                startTime: '09:00',
                endTime: '12:00',
                isWorking: true,
                breaks: [{ startTime: '10:00', endTime: '10:30' }],
              },
            ]),
          },
        },
      },
      include: { doctorProfile: true },
    });

    doctor = docUser.doctorProfile;
  });

  afterAll(async () => {
    await prisma.slotHold.deleteMany({ where: { doctorId: doctor.id } });
    await prisma.appointment.deleteMany({ where: { doctorId: doctor.id } });
    await prisma.doctorProfile.deleteMany({ where: { id: doctor.id } });
    await prisma.user.deleteMany({ where: { id: { in: [patientA.id, patientB.id, doctor.userId] } } });
  });

  it('generates slots respecting working hours and excludes break intervals', async () => {
    const slots = await getDoctorAvailableSlots(doctor.id, testDate);
    expect(slots.length).toBe(5);

    const slotTimes = slots.map((s) => s.startTime);
    expect(slotTimes).toContain('09:00');
    expect(slotTimes).toContain('09:30');
    expect(slotTimes).not.toContain('10:00');
    expect(slotTimes).toContain('10:30');
    expect(slotTimes).toContain('11:00');
    expect(slotTimes).toContain('11:30');
  });

  it('allows Patient A to acquire a 5-minute hold on a slot', async () => {
    const hold = await acquireSlotHold(doctor.id, patientA.id, testDate, '09:00', '09:30');
    expect(hold.holdToken).toBeDefined();
    expect(hold.expiresAt.getTime()).toBeGreaterThan(Date.now());

    await expect(
      acquireSlotHold(doctor.id, patientB.id, testDate, '09:00', '09:30')
    ).rejects.toThrow();
  });

  it('prevents double-booking race condition under concurrent requests', async () => {
    const results = await Promise.allSettled([
      bookAppointment({
        doctorId: doctor.id,
        patientId: patientA.id,
        date: testDate,
        startTime: '11:00',
        endTime: '11:30',
        symptomsText: 'Patient A severe chest pain',
      }),
      bookAppointment({
        doctorId: doctor.id,
        patientId: patientB.id,
        date: testDate,
        startTime: '11:00',
        endTime: '11:30',
        symptomsText: 'Patient B migraine',
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });
});
`);

// 24. backend/src/__tests__/leave.test.ts
writeFile('backend/src/__tests__/leave.test.ts', `
import { applyDoctorLeave, previewLeaveConflicts } from '../services/leave.service';
import { prisma } from '../utils/prisma';

describe('Doctor Leave Conflict Management & Auto-Cancellation', () => {
  let doctor: any;
  let patient: any;
  let appointment: any;
  const leaveDate = '2026-10-20';

  beforeAll(async () => {
    patient = await prisma.user.create({
      data: {
        name: 'Leave Test Patient',
        email: \`leave_patient_\${Date.now()}@cliniccare.com\`,
        passwordHash: 'hashed',
        role: 'PATIENT',
      },
    });

    const docUser = await prisma.user.create({
      data: {
        name: 'Dr. Leave Test',
        email: \`leave_doctor_\${Date.now()}@cliniccare.com\`,
        passwordHash: 'hashed',
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specialty: 'Neurology',
            consultationFee: 150,
          },
        },
      },
      include: { doctorProfile: true },
    });
    doctor = docUser.doctorProfile;

    appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date: leaveDate,
        startTime: '10:00',
        endTime: '10:30',
        status: 'CONFIRMED',
        symptomsText: 'Chronic migraine review',
      },
    });
  });

  afterAll(async () => {
    await prisma.notificationLog.deleteMany({ where: { appointmentId: appointment.id } });
    await prisma.appointment.deleteMany({ where: { doctorId: doctor.id } });
    await prisma.doctorLeave.deleteMany({ where: { doctorId: doctor.id } });
    await prisma.doctorProfile.deleteMany({ where: { id: doctor.id } });
    await prisma.user.deleteMany({ where: { id: { in: [patient.id, doctor.userId] } } });
  });

  it('correctly previews conflicting patient bookings', async () => {
    const preview = await previewLeaveConflicts(doctor.id, leaveDate, leaveDate);
    expect(preview.count).toBe(1);
    expect(preview.appointments[0].id).toBe(appointment.id);
  });

  it('applies leave and cascades status to CANCELLED_DUE_TO_LEAVE', async () => {
    const result = await applyDoctorLeave({
      doctorId: doctor.id,
      startDate: leaveDate,
      endDate: leaveDate,
      reason: 'Medical Conference',
    });

    expect(result.affectedAppointmentsCount).toBe(1);

    const updated = await prisma.appointment.findUnique({
      where: { id: appointment.id },
    });

    expect(updated?.status).toBe('CANCELLED_DUE_TO_LEAVE');
    expect(updated?.cancellationReason).toContain('Medical Conference');
  });
});
`);

// 25. backend/src/__tests__/ai.test.ts
writeFile('backend/src/__tests__/ai.test.ts', `
import { generatePostVisitSummary, generatePreVisitSummary } from '../services/ai.service';

describe('AI Pre-Visit Triage & Post-Visit Summary Service', () => {
  it('generates high urgency score for critical cardiovascular symptoms', async () => {
    const symptoms = 'Experiencing severe crushing chest pain radiating to left arm and shortness of breath.';
    const result = await generatePreVisitSummary(symptoms);

    expect(result.urgencyLevel).toBe('HIGH');
    expect(result.chiefComplaint).toBeDefined();
    expect(result.suggestedQuestions.length).toBeGreaterThanOrEqual(1);
  });

  it('generates low urgency for routine wellness checkups', async () => {
    const symptoms = 'Routine annual physical examination and wellness checkup.';
    const result = await generatePreVisitSummary(symptoms);

    expect(result.urgencyLevel).toBe('LOW');
    expect(result.suggestedQuestions.length).toBeGreaterThanOrEqual(1);
  });

  it('converts doctor notes into patient-friendly summary and follow-up plan', async () => {
    const notes = 'Diagnosed with acute pharyngitis. Prescribed Amoxicillin 500mg TID for 7 days. Rest and hydration.';
    const result = await generatePostVisitSummary(notes, 'Acute Pharyngitis');

    expect(result.patientFriendlySummary).toBeDefined();
    expect(result.followUpSteps.length).toBeGreaterThan(0);
    expect(result.lifestyleAdvice.length).toBeGreaterThan(0);
  });
});
`);

console.log('✅ Part 2 files populated successfully!');
