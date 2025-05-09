import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import { useMissionStats } from "../../hooks/useMissionStats";
import Button from "../../components/ui/Button";
import NotificationDropdown from "../../components/ui/NotificationDropdown";
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import {
  LogOut as LogOutIcon,
  Calendar as CalendarIcon,
  Briefcase as BriefcaseIcon,
  GraduationCap as GraduationCapIcon,
  Clock as ClockIcon,
  Bell as BellIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  Clock as PendingIcon,
} from "lucide-react";
import Logo from "../../components/ui/Logo";
import LeaveRequests from "./LeaveRequests";
import Missions from "./Missions";
import SupervisedInterns from "./SupervisedInterns";
import WorkHours from "./WorkHours";
import NotificationsPage from "./NotificationsPage";
import EmployeeProfile from "./EmployeeProfile";

const EmployeeDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const missionStats = useMissionStats();

  useEffect(() => {
    console.log(`Active tab changed to: ${activeTab}`);
  }, [activeTab]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Routes>
      <Route path="profile" element={<EmployeeProfile />} />
      <Route path="*" element={
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Logo size="md" showText={false} />
                  <h1 className="text-2xl font-bold text-gray-900 ml-3">
                    Employee Dashboard
                  </h1>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <NotificationDropdown
                        notifications={useNotifications().notifications}
                        onMarkAsRead={useNotifications().markAsRead}
                        onMarkAllAsRead={useNotifications().markAllAsRead}
                        userType="employee"
                      />
                    </div>
                    <UserProfileDropdown
                      user={user}
                      onLogout={handleLogout}
                    />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "leave", label: "Leave Requests", icon: CalendarIcon },
                  { id: "missions", label: "Missions", icon: BriefcaseIcon },
                  {
                    id: "interns",
                    label: "Supervised Interns",
                    icon: GraduationCapIcon,
                  },
                  { id: "hours", label: "Work Hours", icon: ClockIcon },
                  { id: "notifications", label: "Notifications", icon: BellIcon },
                ].map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    {tab.icon && <tab.icon className="h-4 w-4 mr-2" />}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="bg-white shadow rounded-lg">
              {activeTab === "overview" && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Dashboard Overview
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                          <CalendarIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">
                            Leave Balance
                          </h3>
                          <p className="text-2xl font-semibold text-gray-700">
                            {user?.leave_balance} days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "leave" && <LeaveRequests />}
              {activeTab === "missions" && <Missions />}
              {activeTab === "interns" && <SupervisedInterns />}
              {activeTab === "hours" && <WorkHours />}
              {activeTab === "notifications" && <NotificationsPage />}
            </div>
          </div>
        </div>
      } />
    </Routes>
  );
};

export default EmployeeDashboard;
// Note: The above code is a simplified version of the Employee Dashboard component.
