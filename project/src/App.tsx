import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import ApplicationForm from './pages/ApplicationForm';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import InternDashboard from './pages/intern/InternDashboard';
import PendingApproval from './pages/auth/PendingApproval';
import Login from './pages/auth/Login';
import ApplicationSuccess from './pages/ApplicationSuccess';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/apply" element={<ApplicationForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/application-success" element={<ApplicationSuccess />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            
            {/* Protected routes - Admin only */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute userType="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes - Employee only */}
            <Route 
              path="/employee/*" 
              element={
                <ProtectedRoute userType="employee">
                  <EmployeeDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes - Intern only */}
            <Route 
              path="/intern/*" 
              element={
                <ProtectedRoute userType="intern">
                  <InternDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;