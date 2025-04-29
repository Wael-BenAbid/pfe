// API configuration
export const API_BASE_URL = 'http://localhost:8000/api';

// Application types
export const APPLICATION_TYPES = [
  { value: 'employee', label: 'Job Application (Employee)' },
  { value: 'intern', label: 'Internship Application' }
];

// Application statuses
export const APPLICATION_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Form validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PHONE_INVALID: 'Please enter a valid phone number',
  FILE_REQUIRED: 'Please upload your CV',
  FILE_SIZE_EXCEEDED: 'File size exceeds the maximum limit of 5MB',
  FILE_TYPE_INVALID: 'Please upload a PDF, DOC, or DOCX file'
};

// Accepted file types for CV   upload
export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Maximum file size for CV upload (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;