import React, { useState } from "react";
import { BellIcon } from "lucide-react";
import { format } from "date-fns";

// Mock data for notifications - In a real app, this would come from the API
const mockNotifications = [
  {
    id: 1,
    type: "mission",
    title: "New Mission Assigned",
    message: "You have been assigned a new mission: Frontend Development Task",
    date: new Date("2024-03-19T09:00:00"),
    read: false,
  },
  {
    id: 2,
    type: "meeting",
    title: "Meeting Scheduled",
    message:
      "Weekly progress review meeting scheduled for tomorrow at 10:00 AM",
    date: new Date("2024-03-19T11:30:00"),
    read: false,
  },
  {
    id: 3,
    type: "deadline",
    title: "Deadline Reminder",
    message: "The UI Design mission is due in 2 days",
    date: new Date("2024-03-18T15:00:00"),
    read: true,
  },
];

const InternNotifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
        <button
          type="button"
          className="text-sm text-blue-600 hover:text-blue-800"
          onClick={markAllAsRead}
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
              !notification.read ? "border-blue-200 bg-blue-50" : ""
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
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="text-sm text-gray-500">
                      {format(notification.date, "PP")}
                    </p>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {notification.message}
                </p>
                {!notification.read && (
                  <div className="mt-2">
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternNotifications;
