import React from 'react';

// Text Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
}

export const TextInput: React.FC<InputProps> = ({ 
  label, 
  error, 
  helper,
  id,
  className = '',
  ...props 
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={inputId}
        className={`
          w-full px-3 py-2 border rounded-md 
          ${error ? 'border-red-500' : 'border-gray-300'} 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
    </div>
  );
};

// Text Area
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helper?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ 
  label, 
  error, 
  helper,
  id,
  className = '',
  ...props 
}) => {
  const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="mb-4">
      <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        id={textareaId}
        className={`
          w-full px-3 py-2 border rounded-md 
          ${error ? 'border-red-500' : 'border-gray-300'} 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${className}
        `}
        rows={4}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
    </div>
  );
};

// Select Input
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  options: SelectOption[];
  error?: string;
  helper?: string;
  onChange?: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({ 
  label, 
  options, 
  error, 
  helper,
  id,
  value,
  onChange,
  className = '',
  ...props 
}) => {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  
  return (
    <div className="mb-4">
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={selectId}
        className={`
          w-full px-3 py-2 border rounded-md 
          ${error ? 'border-red-500' : 'border-gray-300'} 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${className}
        `}
        value={value}
        onChange={handleChange}
        {...props}
      >
        <option value="" disabled>Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
    </div>
  );
};

// File Input
interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  error?: string;
  helper?: string;
  acceptedFileTypes?: string[];
  onChange?: (file: File | null) => void;
}

export const FileInput: React.FC<FileInputProps> = ({ 
  label, 
  error, 
  helper,
  id,
  acceptedFileTypes,
  onChange,
  className = '',
  ...props 
}) => {
  const fileInputId = id || `file-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const [fileName, setFileName] = React.useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFileName(file.name);
    } else {
      setFileName('');
    }
    if (onChange) {
      onChange(file);
    }
  };

  const acceptAttr = acceptedFileTypes ? acceptedFileTypes.join(',') : undefined;
  
  return (
    <div className="mb-4">
      <label htmlFor={fileInputId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className={`relative ${className}`}>
        <input
          id={fileInputId}
          type="file"
          className="sr-only"
          onChange={handleChange}
          accept={acceptAttr}
          {...props}
        />
        <label
          htmlFor={fileInputId}
          className="w-full flex items-center px-3 py-2 border border-gray-300 rounded-md 
                    cursor-pointer hover:bg-gray-50 focus-within:outline-none 
                    focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
        >
          <svg 
            className="w-5 h-5 mr-2 text-gray-500" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" 
            />
          </svg>
          <span className="flex-1 truncate">
            {fileName || 'Choose a file'}
          </span>
        </label>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
    </div>
  );
};

// Radio Group
interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  name: string;
  options: RadioOption[];
  error?: string;
  helper?: string;
  onChange?: (value: string) => void;
  direction?: 'horizontal' | 'vertical';
}

export const RadioGroup: React.FC<RadioGroupProps> = ({ 
  label, 
  name,
  options, 
  error, 
  helper,
  value,
  onChange,
  direction = 'vertical',
  ...props 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  
  return (
    <div className="mb-4">
      <p className="block text-sm font-medium text-gray-700 mb-1">{label}</p>
      <div className={`flex ${direction === 'vertical' ? 'flex-col space-y-2' : 'flex-row space-x-4'}`}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              id={`${name}-${option.value}`}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              {...props}
            />
            <label 
              htmlFor={`${name}-${option.value}`}
              className="ml-2 block text-sm text-gray-700"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
    </div>
  );
};