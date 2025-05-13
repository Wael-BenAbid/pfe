// API configuration
export const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000/api'
  : `http://${window.location.hostname}/api`;

// Media URL configuration (for images, files, etc.)
export const MEDIA_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5173'
  : `https://${window.location.hostname}`;

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
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
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

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Sample notifications for testing
export const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    title: 'New application',
    message: 'A new job application has been submitted',
    date: new Date().toISOString(),
    read: false,
    type: 'info'
  },
  {
    id: 2,
    title: 'Leave request approved',
    message: 'Your leave request has been approved',
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    read: true,
    type: 'success'
  },
  {
    id: 3,
    title: 'System maintenance',
    message: 'The system will be down for maintenance on Sunday',
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    read: false,
    type: 'warning'
  }
];