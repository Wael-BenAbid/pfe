import React from 'react';

interface TextInputProps {
  label?: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'password' | 'email' | 'number' | 'date' | 'time';
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  className = '',
  required = false,
  disabled = false,
  error = '',
  helperText = '',
  icon,
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={name}
          className={`block text-sm font-medium mb-1 ${
            error ? 'text-red-600' : 'text-gray-700'
          }`}
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      
      <div className="relative rounded-md shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`block w-full rounded-md border ${
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          } ${
            icon ? 'pl-10' : 'pl-3'
          } pr-3 py-2 text-sm shadow-sm`}
        />
      </div>
      
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default TextInput;