import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { ClockIcon, AlertCircleIcon } from "lucide-react";
import { API_BASE_URL } from "../../config/constants";

interface ApplicationInfo {
  id: number;
  status: string;
  first_name: string;
  last_name: string;
  position: string;
  application_type: string;
  created_at: string;
}

const PendingApproval: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Récupérer l'ID de l'application depuis l'état de location ou les paramètres de recherche
  useEffect(() => {
    const fetchApplicationInfo = async () => {
      setLoading(true);
      setError("");

      // Essayer de récupérer l'ID de l'application depuis l'état de location
      const applicationId = location.state?.applicationId;

      if (!applicationId) {
        // Si pas d'ID spécifique, afficher juste la page générique
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/job-applications/${applicationId}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch application information");
        }

        const data = await response.json();
        setApplication(data);
      } catch (error) {
        console.error("Error fetching application:", error);
        setError("Failed to load application information");
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationInfo();
  }, [location.state]);

  // Si l'application est rejetée, rediriger vers une page 404
  useEffect(() => {
    if (application && application.status === "rejected") {
      navigate("/not-found", { replace: true });
    }
  }, [application, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading application information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
          <ClockIcon className="h-10 w-10 text-yellow-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          Account Pending Approval
        </h1>

        <p className="text-gray-600 mb-6 text-center">
          Your account is currently pending approval from the HR administrator.
          You'll receive an email notification once your account has been
          approved.
        </p>

        {application && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Application Details</h2>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">
                    {application.first_name} {application.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium text-gray-900">{application.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {application.application_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted On</p>
                  <p className="font-medium text-gray-900">
                    {new Date(application.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="flex items-center mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending Review
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
          <h3 className="text-md font-semibold text-blue-800 mb-2">
            What happens next?
          </h3>
          <p className="text-sm text-blue-700">
            1. The HR team will review your application
            <br />
            2. Once approved, you'll receive an email notification
            <br />
            3. You can then log in and access your account features
          </p>
        </div>

        <div className="space-y-3">
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

export default PendingApproval;
