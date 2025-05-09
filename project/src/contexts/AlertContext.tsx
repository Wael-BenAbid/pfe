import React, { createContext, useState, useContext, ReactNode } from 'react';
import AlertModal from '../components/ui/AlertModal';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertContextType {
  showAlert: (message: string, title?: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AlertType>('info');

  const showAlert = (
    message: string,
    title: string = '',
    type: AlertType = 'info'
  ) => {
    setMessage(message);
    setTitle(title);
    setType(type);
    setIsOpen(true);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        message={message}
        type={type}
      />
    </AlertContext.Provider>
  );
};

// Fonction globale pour afficher une alerte (à utiliser en dehors des composants React)
let globalShowAlert: ((message: string, title?: string, type?: AlertType) => void) | null = null;

export const setGlobalShowAlert = (
  showAlertFn: (message: string, title?: string, type?: AlertType) => void
) => {
  globalShowAlert = showAlertFn;
};

export const alert = (
  message: string,
  title?: string,
  type: AlertType = 'info'
) => {
  if (globalShowAlert) {
    globalShowAlert(message, title, type);
  } else {
    // Fallback to regular alert if globalShowAlert is not set
    window.alert(message);
  }
};
