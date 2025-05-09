import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
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

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { token, user } = useAuth();

  // Définir fetchNotifications avec useCallback pour éviter les recréations inutiles
  const fetchNotifications = useCallback(async () => {
    if (!token || !user) {
      setNotifications([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Convert API notifications to our Notification format
        const formattedNotifications: Notification[] = data.map((n: {
          id: number;
          title: string;
          message: string;
          type: 'info' | 'warning' | 'success' | 'error';
          read: boolean;
          created_at: string;
        }) => ({
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
  }, [token, user]);

  // Fetch notifications from API on mount and when user or token changes
  useEffect(() => {
    // Récupérer les notifications au montage du composant
    fetchNotifications();

    // Configurer un intervalle pour récupérer les notifications toutes les 30 secondes
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30 * 1000); // Rafraîchir toutes les 30 secondes

    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

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
          user: user.id,
        }),
      });

      if (response.ok) {
        // Après avoir créé une notification, rafraîchir la liste
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
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
        // Rafraîchir les notifications après avoir marqué comme lu
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
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
        // Rafraîchir les notifications après avoir tout marqué comme lu
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
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
        // Rafraîchir les notifications après suppression
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification, // Ajout ici
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};


