import { BrowserRouter as Router, Routes, Route  } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AlertProvider, setGlobalShowAlert, useAlert } from './contexts/AlertContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import ApplicationForm from './pages/ApplicationForm';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import InternDashboard from './pages/intern/InternDashboard';
import PendingApproval from './pages/auth/PendingApproval';
import ApplicationRejected from './pages/auth/ApplicationRejected';
import Login from './pages/auth/Login';
import ApplicationSuccess from './pages/ApplicationSuccess';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import { useEffect } from 'react';

function AppWithAlerts() {
  const { showAlert } = useAlert();

  // Configurer l'alerte globale
  useEffect(() => {
    setGlobalShowAlert(showAlert);
  }, [showAlert]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/apply" element={<ApplicationForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/application-success" element={<ApplicationSuccess />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/application-rejected" element={<ApplicationRejected />} />
          <Route path="/not-found" element={<NotFound />} />

          {/* Routes protégées */}
          <Route path="/admine/*" element={<ProtectedRoute userType="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/employee/*" element={<ProtectedRoute userType="employee"><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/intern/*" element={<ProtectedRoute userType="intern"><InternDashboard /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AlertProvider>
          <AppWithAlerts />
        </AlertProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;