import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  fullScreen = false,
  message = 'Loading...'
}) => {
  const getSizeClass = () => {
    switch(size) {
      case 'small': return 'w-6 h-6';
      case 'large': return 'w-12 h-12';
      default: return 'w-8 h-8';
    }
  };

  const spinner = (
    <div className="flex flex-col items-center">
      <div className={`${getSizeClass()} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
      {message && (
        <p className="mt-3 text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;