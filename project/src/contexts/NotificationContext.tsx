import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Notification } from '../components/ui/NotificationDropdown';
import { API_BASE_URL } from '../config/constants';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { token, user } = useAuth();

  // Fetch notifications from API on mount and when user or token changes
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token || !user) return;

      try {
        const response = await fetch(`${API_BASE_URL}/notifications/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Convert API notifications to our Notification format
          const formattedNotifications: Notification[] = data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            read: n.read,
            date: n.created_at,
          }));
          setNotifications(formattedNotifications);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, [token, user]);

  const addNotification = async (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    if (!token || !user) return;

    // Check if a similar notification already exists (same title and message)
    const existingSimilarNotification = notifications.find(
      n => n.title === notification.title && n.message === notification.message && !n.read
    );

    // If a similar unread notification exists, don't add a new one
    if (existingSimilarNotification) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
        }),
      });

      if (response.ok) {
        const newNotification = await response.json();
        // Convert API notification to our Notification format
        const formattedNotification: Notification = {
          id: newNotification.id,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          read: newNotification.read,
          date: newNotification.created_at,
        };

        setNotifications(prev => [formattedNotification, ...prev]);
      }
    } catch (error) {
      console.error('Failed to create notification:', error);

      // Fallback to local notification if API call fails
      const uniqueId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
      const fallbackNotification: Notification = {
        ...notification,
        id: uniqueId,
        date: new Date().toISOString(),
        read: false,
      };
      setNotifications(prev => [fallbackNotification, ...prev]);
    }
  };

  const markAsRead = async (id: number) => {
    if (!token || !user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/mark_as_read/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);

      // Fallback to local update if API call fails
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    }
  };

  const markAllAsRead = async () => {
    if (!token || !user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark_all_as_read/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);

      // Fallback to local update if API call fails
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    }
  };

  const removeNotification = async (id: number) => {
    if (!token || !user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.filter(notification => notification.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);

      // Fallback to local update if API call fails
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
