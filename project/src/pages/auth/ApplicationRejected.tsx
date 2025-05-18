import React from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import { XCircleIcon } from "lucide-react";
import logoImage from "../../assets/images/logo.png";
import BackButton from "../../components/ui/BackButton";

const ApplicationRejected: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <BackButton to="/" label="Back to Home" />
          <div className="flex justify-center flex-grow">
            <Link to="/">
              <img src={logoImage} alt="RH Management" className="h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
          </div>
          <div className="w-24"></div> {/* Espace pour équilibrer le bouton de retour */}
        </div>

        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <XCircleIcon className="h-10 w-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          Application Rejected
        </h1>

        <p className="text-gray-600 mb-6 text-center">
          We regret to inform you that your application has been rejected.
          Thank you for your interest in our company.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
          <h3 className="text-md font-semibold text-blue-800 mb-2">
            What can you do now?
          </h3>
          <p className="text-sm text-blue-700">
            1. You can submit a new application with updated information
            <br />
            2. You can contact our HR department for more details
            <br />
            3. You can explore other opportunities on our website
          </p>
        </div>

        <div className="space-y-3">
          <Link to="/apply">
            <Button variant="primary" fullWidth>
              Submit a New Application
            </Button>
          </Link>
          <Link to="/">
            <Button variant="secondary" fullWidth>
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ApplicationRejected;
