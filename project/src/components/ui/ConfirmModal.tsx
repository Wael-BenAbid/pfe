import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isProcessing = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end space-x-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Traitement...' : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
