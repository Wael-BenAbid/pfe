import React, { useState } from "react";
import { format } from "date-fns";
import { BellIcon, CheckIcon, TrashIcon } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    await markAllAsRead();
    setIsLoading(false);
  };

  const handleMarkAsRead = async (id: number) => {
    setIsLoading(true);
    await markAsRead(id);
    setIsLoading(false);
  };

  const handleRemoveNotification = async (id: number) => {
    setIsLoading(true);
    await removeNotification(id);
    setIsLoading(false);
  };

  const getNotificationTypeStyles = (type: string) => {
    switch (type) {
      case "info":
        return "bg-blue-100 text-blue-800";
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPpp");
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement des notifications..." />;
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        {notifications.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleMarkAllAsRead}
            icon={<TrashIcon className="h-4 w-4" />}
          >
            Supprimer toutes les notifications
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Aucune notification
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Vous n'avez pas encore reçu de notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow ${
                !notification.read ? "border-l-4 border-blue-500" : ""
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <BellIcon
                    className={`h-6 w-6 ${
                      notification.read ? "text-gray-400" : "text-blue-500"
                    }`}
                  />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNotificationTypeStyles(
                          notification.type
                        )}`}
                      >
                        {notification.type}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        icon={<CheckIcon className="h-4 w-4" />}
                      >
                        Marquer comme lu
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveNotification(notification.id)}
                        icon={<TrashIcon className="h-4 w-4" />}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(notification.date)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
