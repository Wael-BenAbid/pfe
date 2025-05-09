import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: AlertType;
  confirmLabel?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmLabel = 'OK',
}) => {
  // Icon and color based on type
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-6 h-6 text-blue-500" />,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
        };
    }
  };

  const { icon, bgColor, textColor } = getIconAndColor();

  // Default title based on type if not provided
  const defaultTitle = () => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
      default:
        return 'Information';
    }
  };

  const modalTitle = title || defaultTitle();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="sm"
      footer={
        <Button variant="primary" onClick={onClose} fullWidth>
          {confirmLabel}
        </Button>
      }
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 pt-0.5">
          <p className={`text-sm ${textColor}`}>{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default AlertModal;
