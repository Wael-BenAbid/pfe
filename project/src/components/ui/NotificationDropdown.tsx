import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from 'lucide-react';

export interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  userType?: 'admin' | 'employee' | 'intern';
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  userType = 'employee'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getNotificationTypeStyles = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="relative p-1 text-gray-600 hover:text-gray-900 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="py-2 px-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-4 px-3 text-sm text-gray-500 text-center">
                No notifications
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`py-3 px-3 border-b border-gray-200 hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(notification.date)}
                        </p>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNotificationTypeStyles(
                            notification.type
                          )}`}
                        >
                          {notification.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="py-2 px-3 bg-gray-100 border-t border-gray-200 text-xs text-center text-gray-500">
            <a
              href={userType === 'admin' ? '/admin/notifications' :
                   userType === 'intern' ? '/intern/notifications' :
                   '/employee/notifications'}
              className="text-blue-600 hover:text-blue-800"
            >
              Voir toutes les notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
