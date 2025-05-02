import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MenuIcon, LogOutIcon } from "lucide-react";
import NotificationDropdown from "../../components/ui/NotificationDropdown";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/constants";

interface User {
  id: number;
  username: string;
  email: string;
  user_type: string;
}

interface AdminHeaderProps {
  user: User;
  onMenuClick: () => void;
  onLogout: () => void;
  pendingApplicationsCount: number;
}

// Wrapper component for NotificationDropdown
const NotificationDropdownWrapper: React.FC<{ pendingCount: number }> = ({ pendingCount }) => {
  const { notifications, markAsRead, markAllAsRead, addNotification } = useNotifications();
  const { token } = useAuth();
  const [pendingLeaves, setPendingLeaves] = useState<number>(0);
  const [notificationsInitialized, setNotificationsInitialized] = useState<boolean>(false);

  // Fetch pending leave requests - only once on component mount
  React.useEffect(() => {
    const fetchPendingLeaves = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/leaves/?status=pending`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPendingLeaves(data.length);

          // Add notification for pending leaves only if we have some
          if (data.length > 0 && !notificationsInitialized) {
            addNotification({
              title: 'Demandes de congé en attente',
              message: `Vous avez ${data.length} demande(s) de congé en attente d'approbation`,
              type: 'info'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching pending leaves:', error);
      }
    };

    if (!notificationsInitialized) {
      fetchPendingLeaves();
    }
  }, [token, notificationsInitialized, addNotification]);

  // Add a notification for pending applications - only once on component mount
  React.useEffect(() => {
    if (pendingCount > 0 && !notificationsInitialized) {
      addNotification({
        title: 'Candidatures en attente',
        message: `Vous avez ${pendingCount} candidature(s) en attente d'examen`,
        type: 'warning'
      });

      // Mark notifications as initialized to prevent infinite loop
      setNotificationsInitialized(true);
    } else if (!notificationsInitialized) {
      setNotificationsInitialized(true);
    }
  }, [pendingCount, notificationsInitialized, addNotification]);

  return (
    <NotificationDropdown
      notifications={notifications}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
    />
  );
};

const AdminHeader: React.FC<AdminHeaderProps> = ({
  user,
  onMenuClick,
  onLogout,
  pendingApplicationsCount,
}) => {
  return (
    <header className="bg-white shadow">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <button
              type="button"
              className="lg:hidden px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <MenuIcon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex-shrink-0 flex items-center">
              <Link to="/admin" className="text-xl font-bold text-blue-600">
                HR Admin
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 relative">
              <NotificationDropdownWrapper pendingCount={pendingApplicationsCount} />
            </div>

            <div className="ml-3 relative">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-800 font-semibold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3 hidden md:block">
                  <div className="text-sm font-medium text-gray-700">
                    {user.username}
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
            </div>

            <div className="ml-3">
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOutIcon className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
