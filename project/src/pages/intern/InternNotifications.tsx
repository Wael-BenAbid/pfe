import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { BellIcon, CheckIcon, TrashIcon, ArrowLeft, AlertCircle, Info, CheckCircle } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import AlertModal from "../../components/ui/AlertModal";
import ConfirmModal from "../../components/ui/ConfirmModal";

const InternNotifications: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, removeNotification, removeAllNotifications } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const navigate = useNavigate();

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    try {
      await markAllAsRead();
      setAlertModal({
        isOpen: true,
        title: 'Succès',
        message: 'Toutes les notifications ont été marquées comme lues',
        type: 'success'
      });
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Erreur',
        message: 'Impossible de marquer toutes les notifications comme lues',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    setIsLoading(true);
    try {
      await markAsRead(id);
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Erreur',
        message: 'Impossible de marquer la notification comme lue',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveNotification = async (id: number) => {
    setIsLoading(true);
    try {
      await removeNotification(id);
      setAlertModal({
        isOpen: true,
        title: 'Succès',
        message: 'Notification supprimée avec succès',
        type: 'success'
      });
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Erreur',
        message: 'Impossible de supprimer la notification',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleRemoveAllNotifications = async () => {
    if (notifications.length === 0) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirmation',
      message: 'Êtes-vous sûr de vouloir supprimer toutes vos notifications ?',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await removeAllNotifications();
          setAlertModal({
            isOpen: true,
            title: 'Succès',
            message: 'Toutes les notifications ont été supprimées',
            type: 'success'
          });
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Erreur',
            message: 'Impossible de supprimer toutes les notifications',
            type: 'error'
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
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

  const getNotificationIcon = (type: string, read: boolean) => {
    if (read) {
      return <BellIcon className="h-6 w-6 text-gray-400" />;
    }

    switch (type) {
      case "info":
        return <Info className="h-6 w-6 text-blue-500" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-blue-500" />;
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
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          confirmModal.onConfirm();
        }}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/intern')}
            icon={<ArrowLeft className="h-4 w-4" />}
            className="mr-4"
          >
            Retour
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        </div>
        <div className="flex space-x-2">
          {notifications.filter(n => !n.read).length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarkAllAsRead}
              icon={<CheckIcon className="h-4 w-4" />}
            >
              Tout marquer comme lu
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleRemoveAllNotifications}
              icon={<TrashIcon className="h-4 w-4" />}
            >
              Tout supprimer
            </Button>
          )}
        </div>
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
                  {getNotificationIcon(notification.type, notification.read)}
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
                      {!notification.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          icon={<CheckIcon className="h-4 w-4" />}
                        >
                          Marquer comme lu
                        </Button>
                      )}
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

export default InternNotifications;
