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

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user object in memory and no token in storage, redirect to login
  if (!user && !token && !storedUser) {
    return <Navigate to="/login" replace />;
  }

  const activeRole = user?.role || (storedUser ? JSON.parse(storedUser).role : null);

  if (activeRole && allowedRoles && !allowedRoles.includes(activeRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RoleDefaultDashboard() {
  const { user } = useAuth();
  const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
  const role = user?.role || storedUser?.role || 'PATIENT';

  if (role === 'DOCTOR') {
    return <DoctorDashboard />;
  }
  if (role === 'ADMIN') {
    return <AdminDashboard />;
  }
  return <DoctorDirectory />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Authentication */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Default Home Dashboard by Role */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RoleDefaultDashboard />
                  </ProtectedRoute>
                }
              />

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
                path="/admin/leaves"
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

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
