import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { ClockIcon } from 'lucide-react';

const PendingApproval: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
          <ClockIcon className="h-10 w-10 text-yellow-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Account Pending Approval</h1>
        
        <p className="text-gray-600 mb-6">
          Your account is currently pending approval from the HR administrator. You'll receive an email notification once your account has been approved.
        </p>
        
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
          <h3 className="text-md font-semibold text-blue-800 mb-2">What happens next?</h3>
          <p className="text-sm text-blue-700">
            1. The HR team will review your application<br />
            2. Once approved, you'll receive an email notification<br />
            3. You can then log in and access your account features
          </p>
        </div>
        
        <div className="space-y-3">
          <Link to="/login">
            <Button variant="outline" fullWidth>
              Return to Login
            </Button>
          </Link>
          
          <Link to="/">
            <Button variant="primary" fullWidth>
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;