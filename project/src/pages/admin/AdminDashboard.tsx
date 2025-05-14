import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import ApplicationsReview from "./ApplicationsReview";
import EmployeeManagement from "./EmployeeManagement";
import InternManagementAdmin from "./InternManagementAdmin";
import AdminOverview from "./AdminOverview";
import UserProfile from "./UserProfile";
import UserWorkHours from "./UserWorkHours";
import MissionManagement from "./MissionManagement";
import InternshipManagement from "./InternshipManagement";
import LeaveManagement from "./LeaveManagement";
import NotificationsPage from "./NotificationsPage";
import UserManagement from "./UserManagement";
import AdminProfile from "./AdminProfile";
import NotFound from "../NotFound";
import CalendarView from "../common/CalendarView";
import EmbeddedCalendar from "../../components/calendar/EmbeddedCalendar";
import { API_BASE_URL } from "../../config/constants";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  application_type: string;
  position: string;
  status: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [pendingApplications, setPendingApplications] = useState<Application[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchPendingApplications = async () => {
      if (!token) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/job-applications/?status=pending`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pending applications");
        }

        const data = await response.json();
        setPendingApplications(data);
      } catch (error) {
        console.error("Error fetching pending applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingApplications();
  }, [token]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user || user.user_type !== "admin") {
    return <div>Unauthorized access. Please log in as an administrator.</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar for larger screens and conditionally shown sidebar for mobile */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingApplicationsCount={pendingApplications.length}
      />

      <div className="flex flex-col flex-1 w-full overflow-hidden lg:pl-64">
        <AdminHeader
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
          pendingApplicationsCount={pendingApplications.length}
        />

        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <AdminOverview
                    pendingApplicationsCount={pendingApplications.length}
                  />
                }
              />
              <Route path="applications" element={<ApplicationsReview />} />
              <Route path="employees" element={<EmployeeManagement />} />
              <Route path="interns" element={<InternManagementAdmin />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="missions" element={<MissionManagement />} />
              <Route path="internships" element={<InternshipManagement />} />
              <Route path="leaves" element={<LeaveManagement />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="embedded-calendar" element={<EmbeddedCalendar />} />
              <Route path="user/:userId" element={<UserProfile />} />
              <Route
                path="user/:userId/work-hours"
                element={<UserWorkHours />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
