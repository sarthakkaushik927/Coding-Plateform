import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store';
import { logout } from './store/authSlice';

import Home from './pages/Home';
import TestRoom from './pages/TestRoom';
import CodingTestRoom from './pages/CodingTestRoom';
import Dashboard from './pages/Dashboard';
import WaitingRoom from './pages/WaitingRoom';
import AdminDashboard from './pages/AdminDashboard';
import CreateTest from './pages/CreateTest';
import CreateCodingQuestion from './pages/Admin/CreateCodingQuestion';
import ResultsList from './pages/Admin/ResultsList';
import DetailedResult from './pages/Admin/DetailedResult';
import Signup from './pages/Auth/Signup';
import VerifyOTP from './pages/Auth/VerifyOTP';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  if (!token || !user) return <Navigate to="/login" replace />;
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  if (!token) return <Navigate to="/login" replace />;
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  if (token && localStorage.getItem('token')) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return <>{children}</>;
};

const AuthStorageSync = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token && !localStorage.getItem('token')) dispatch(logout());
  }, [dispatch, token]);

  useEffect(() => {
    const handle = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) dispatch(logout());
    };
    window.addEventListener('storage', handle);
    return () => window.removeEventListener('storage', handle);
  }, [dispatch]);

  return <>{children}</>;
};

const App: React.FC = () => (
  <Router>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1a1917',
          color: '#faf9f6',
          fontSize: '13px',
          fontWeight: 600,
          borderRadius: '2px',
          border: '1px solid #2a2926',
        },
      }}
    />
    <AuthStorageSync>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/signup"          element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/verify"          element={<PublicRoute><VerifyOTP /></PublicRoute>} />
        <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

        <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/test/wait/:id"   element={<ProtectedRoute><WaitingRoom /></ProtectedRoute>} />
        <Route path="/test/:id"        element={<ProtectedRoute><TestRoom /></ProtectedRoute>} />
        <Route path="/coding-test/:id" element={<ProtectedRoute><CodingTestRoom /></ProtectedRoute>} />

        <Route path="/admin"                              element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/create-test"                  element={<AdminRoute><CreateTest /></AdminRoute>} />
        <Route path="/admin/test/:testId/coding-questions" element={<AdminRoute><CreateCodingQuestion /></AdminRoute>} />
        <Route path="/admin/results/:testId"              element={<AdminRoute><ResultsList /></AdminRoute>} />
        <Route path="/admin/submission/:subId"            element={<AdminRoute><DetailedResult /></AdminRoute>} />

        <Route path="*" element={<div className="p-10 text-center">Page Not Found</div>} />
      </Routes>
    </AuthStorageSync>
  </Router>
);

export default App;
