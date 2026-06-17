import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';

import Home from './pages/Home';
import TestRoom from './pages/TestRoom';
import Dashboard from './pages/Dashboard';
import WaitingRoom from './pages/WaitingRoom';
import AdminDashboard from './pages/AdminDashboard';
import CreateTest from './pages/CreateTest';
import ResultsList from './pages/Admin/ResultsList';
import DetailedResult from './pages/Admin/DetailedResult';
import Signup from './pages/Auth/Signup';
import VerifyOTP from './pages/Auth/VerifyOTP';
import Login from './pages/Auth/Login';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useSelector((state: RootState) => state.auth);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  if (token) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/verify" element={<PublicRoute><VerifyOTP /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/test/wait/:id" element={<ProtectedRoute><WaitingRoom /></ProtectedRoute>} />
        <Route path="/test/:id" element={<ProtectedRoute><TestRoom /></ProtectedRoute>} />

        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/create-test" element={<AdminRoute><CreateTest /></AdminRoute>} />
        <Route path="/admin/results/:testId" element={<AdminRoute><ResultsList /></AdminRoute>} />
        <Route path="/admin/submission/:subId" element={<AdminRoute><DetailedResult /></AdminRoute>} />

        <Route path="*" element={<div className="p-10 text-center">Page Not Found</div>} />
      </Routes>
    </Router>
  );
};

export default App;
