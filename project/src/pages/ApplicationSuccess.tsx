import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { CheckCircleIcon } from "lucide-react";

const ApplicationSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <CheckCircleIcon className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Application Submitted Successfully!
        </h1>

        <p className="text-gray-600 mb-6">
          Thank you for submitting your application. Our HR team will review it
          and get back to you soon.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
          <h3 className="text-md font-semibold text-blue-800 mb-2">
            What happens next?
          </h3>
          <p className="text-sm text-blue-700">
            1. Your application will be reviewed by our HR team
            <br />
            2. If approved, you'll receive login credentials via email
            <br />
            3. You can then login and access your account
          </p>
        </div>



        <div className="space-y-3">
          <Link to="/login">
            <Button variant="outline" fullWidth>
              Go to Login Page
            </Button>
          </Link>

          <Link to="/">
            <Button variant="primary" fullWidth>
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSuccess;
