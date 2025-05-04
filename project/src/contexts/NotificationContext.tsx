import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  // Récupérer les notifications du localStorage au démarrage
  const getInitialNotifications = (): Notification[] => {
    if (typeof window === 'undefined') return [];

    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        return JSON.parse(savedNotifications);
      } catch (error) {
        console.error('Failed to parse notifications from localStorage:', error);
        return [];
      }
    }
    return [];
  };

  const [notifications, setNotifications] = useState<Notification[]>(getInitialNotifications());
  const notificationsRef = useRef<Notification[]>(notifications);
  const { token, user } = useAuth();

  // Mettre à jour la référence lorsque les notifications changent
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Sauvegarder les notifications dans le localStorage à chaque changement
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Définir fetchNotifications avec useCallback pour éviter les recréations inutiles
  const fetchNotifications = useCallback(async (force = false) => {
    if (!token || !user) return;

    // Vérifier si nous avons récupéré les notifications récemment (moins de 5 minutes)
    const now = Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;
    const savedLastFetchTime = localStorage.getItem('lastNotificationFetchTime');
    const lastFetch = savedLastFetchTime ? parseInt(savedLastFetchTime, 10) : 0;

    // Si force est true, ignorer la vérification du temps
    // Vérifier également si nous avons des notifications en mémoire
    const currentNotifications = notificationsRef.current;
    const hasNotifications = currentNotifications && currentNotifications.length > 0;
    if (!force && now - lastFetch < fiveMinutesInMs && hasNotifications) {
      // Si nous avons récupéré les notifications récemment, ne pas les récupérer à nouveau
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

        // Sauvegarder dans le localStorage
        localStorage.setItem('notifications', JSON.stringify(formattedNotifications));
        localStorage.setItem('lastNotificationFetchTime', now.toString());
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);

      // En cas d'erreur, utiliser les notifications du localStorage si disponibles
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        try {
          const parsedNotifications = JSON.parse(savedNotifications);
          setNotifications(parsedNotifications);
        } catch (parseError) {
          console.error('Failed to parse saved notifications:', parseError);
        }
      }
    }
  }, [token, user, notificationsRef]);

  // Fetch notifications from API on mount and when user or token changes
  useEffect(() => {
    // Récupérer les notifications au montage du composant
    fetchNotifications();

    // Configurer un intervalle pour récupérer les notifications toutes les 5 minutes
    const intervalId = setInterval(() => {
      fetchNotifications(true); // Force refresh every 5 minutes
    }, 5 * 60 * 1000);

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
        const updatedNotifications = notifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        );
        setNotifications(updatedNotifications);

        // Mettre à jour le localStorage
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);

      // Fallback to local update if API call fails
      const updatedNotifications = notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      setNotifications(updatedNotifications);

      // Mettre à jour le localStorage même en cas d'échec de l'API
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
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
        const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
        setNotifications(updatedNotifications);

        // Mettre à jour le localStorage
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);

      // Fallback to local update if API call fails
      const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
      setNotifications(updatedNotifications);

      // Mettre à jour le localStorage même en cas d'échec de l'API
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
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
        const updatedNotifications = notifications.filter(notification => notification.id !== id);
        setNotifications(updatedNotifications);

        // Mettre à jour le localStorage
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);

      // Fallback to local update if API call fails
      const updatedNotifications = notifications.filter(notification => notification.id !== id);
      setNotifications(updatedNotifications);

      // Mettre à jour le localStorage même en cas d'échec de l'API
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
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


