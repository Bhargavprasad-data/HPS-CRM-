import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './redux/store';
import StaffLayout from './layouts/StaffLayout';
import LoginPage from './pages/Login/LoginPage';
import SignupPage from './pages/Login/SignupPage';
import Dashboard from './pages/Dashboard/Dashboard';

import AttendancePage from './pages/Attendance/AttendancePage';
import LeavesPage from './pages/Leaves/LeavesPage';
import ProjectsPage from './pages/Projects/ProjectsPage';
import TicketsPage from './pages/Tickets/TicketsPage';
import PayslipsPage from './pages/Payslips/PayslipsPage';
import ProfilePage from './pages/Profile/ProfilePage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <StaffLayout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/leaves" element={<LeavesPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/payslips" element={<PayslipsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </StaffLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '12px' } }} />
      </BrowserRouter>
    </Provider>
  );
}
