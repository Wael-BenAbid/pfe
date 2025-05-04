import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import Button from "../../components/ui/Button";
import NotificationDropdown from "../../components/ui/NotificationDropdown";
import {
  LogOutIcon,
  BriefcaseIcon,
  CalendarIcon,
  BellIcon,
} from "lucide-react";
import InternMissions from "./InternMissions";
import InternMeetings from "./InternMeetings";
import NotificationsPage from "./NotificationsPage";

const InternDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("missions");
  const [missions, setMissions] = useState<
    Array<{
      id: number;
      title: string;
      description: string;
      deadline: string;
      completed: boolean;
      assigned_to_id: number;
      assigned_to_name: string;
      supervisor_id: number;
      supervisor_name: string;
      created_at: Date;
    }>
  >([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    const fetchMissions = async () => {
      if (user?.id) {
        try {
          // Importation dynamique pour éviter l'erreur de hook
          const { useMissions: getMissions } = await import(
            "../../lib/queries"
          );
          const missionsData = await getMissions(user.id, "assignee");
          setMissions(missionsData || []);
        } catch (error) {
          console.error("Error fetching missions:", error);
          setMissions([]);
        }
      }
    };

    fetchMissions();
  }, [user?.id]);

  useEffect(() => {
    // Count unread notifications (pending missions and upcoming meetings)
    const pendingMissions = missions.filter((m) => !m.completed).length;
    setUnreadNotifications(pendingMissions);
  }, [missions]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Intern Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <NotificationDropdown
                  notifications={useNotifications().notifications}
                  onMarkAsRead={useNotifications().markAsRead}
                  onMarkAllAsRead={useNotifications().markAllAsRead}
                />
              </div>
              <div className="flex items-center">
                <div className="mr-4">
                  <p className="text-sm text-gray-600">
                    Welcome, {user?.username}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<LogOutIcon className="h-4 w-4" />}
                  onClick={handleLogout}
                >
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab("missions")}
              className={`${
                activeTab === "missions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <BriefcaseIcon className="h-4 w-4 mr-2" />
              Missions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("meetings")}
              className={`${
                activeTab === "meetings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Meetings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`${
                activeTab === "notifications"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <BellIcon className="h-4 w-4 mr-2" />
              Notifications
              {unreadNotifications > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs rounded-full px-2 py-0.5">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white shadow rounded-lg p-6">
          {activeTab === "missions" && <InternMissions />}
          {activeTab === "meetings" && <InternMeetings />}
          {activeTab === "notifications" && <NotificationsPage />}
        </div>
      </main>
    </div>
  );
};

export default InternDashboard;
