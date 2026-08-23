import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/index';
import { User, UserRole } from '../types/index';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  switchPersona: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (error) {
        // Only clear if 401
        console.warn('Session verification check failed');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password = 'DoctorPatient#2026Care!'): Promise<User> => {
    let res;
    try {
      res = await api.post('/auth/login', { email, password });
    } catch (e: any) {
      // Fallback passwords for backwards compatibility
      try {
        res = await api.post('/auth/login', { email, password: 'Password123!' });
      } catch (e2: any) {
        res = await api.post('/auth/login', { email, password: 'CuraPulse#2026!' });
      }
    }

    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }

    throw new Error('Authentication failed');
  };

  const register = async (userData: any): Promise<User> => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error('Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const switchPersona = async (role: UserRole) => {
    setLoading(true);
    let targetEmail = 'patient@cliniccare.com';
    if (role === 'DOCTOR') {
      targetEmail = 'doctor.jenkins@cliniccare.com';
    } else if (role === 'ADMIN') {
      targetEmail = 'admin@cliniccare.com';
    }

    try {
      await login(targetEmail);
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to switch persona:', error);
      alert('Persona switch failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
