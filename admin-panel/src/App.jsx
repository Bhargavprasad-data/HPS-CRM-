import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './redux/store';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import EmployeesPage from './pages/Employees/EmployeesPage';
import AttendancePage from './pages/Attendance/AttendancePage';
import PayrollPage from './pages/Payroll/PayrollPage';
import CustomersPage from './pages/Customers/CustomersPage';
import ProjectsPage from './pages/Projects/ProjectsPage';
import TicketsPage from './pages/Tickets/TicketsPage';
import QuotationsPage from './pages/Quotations/QuotationsPage';
import InvoicesPage from './pages/Invoices/InvoicesPage';
import OfferLettersPage from './pages/OfferLetters/OfferLettersPage';
import IdCardsPage from './pages/IdCards/IdCardsPage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';
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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/quotations" element={<QuotationsPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/offer-letters" element={<OfferLettersPage />} />
                <Route path="/id-cards" element={<IdCardsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            duration: 4000,
          }}
        />
      </BrowserRouter>
    </Provider>
  );
}
