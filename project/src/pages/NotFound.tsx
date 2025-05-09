import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { AlertCircleIcon } from "lucide-react";
import logoImage from "../assets/images/logo.png";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <Link to="/">
            <img src={logoImage} alt="RH Management" className="h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>
        </div>

        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <AlertCircleIcon className="h-10 w-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h1>

        <p className="text-gray-600 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>

        <Link to="/">
          <Button variant="primary" fullWidth>
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
