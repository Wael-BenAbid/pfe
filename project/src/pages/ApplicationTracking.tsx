import React, { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import TextInput from "../components/ui/TextInput";
import { API_BASE_URL } from "../config/constants";
import { SearchIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "lucide-react";

interface ApplicationStatus {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  application_type: string;
  status: string;
  created_at: string;
  user?: number;
}

const ApplicationTracking: React.FC = () => {
  const [email, setEmail] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationStatus | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setApplication(null);
    setCredentials(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/job-applications/track/?email=${encodeURIComponent(
          email
        )}&id=${applicationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Application not found");
      }

      const data = await response.json();
      setApplication(data);

      // Si la candidature est approuvée et que l'utilisateur n'a pas encore accédé à son compte
      if (data.status === "approved" && !data.user_has_logged_in) {
        // Récupérer les informations de connexion temporaires
        const credentialsResponse = await fetch(
          `${API_BASE_URL}/api/job-applications/${data.id}/get_credentials/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (credentialsResponse.ok) {
          const credentialsData = await credentialsResponse.json();
          setCredentials(credentialsData);
        }
      }
    } catch (error) {
      console.error("Error tracking application:", error);
      setError("Application not found. Please check your email and application ID.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <SearchIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Track Your Application
          </h1>
          <p className="mt-2 text-gray-600">
            Enter your email and application ID to check the status of your application
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter the email you used in your application"
              required
            />

            <TextInput
              label="Application ID"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="Enter your application ID"
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
            >
              Track Application
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {application && (
            <div className="mt-6 border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Application Details
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <p className="text-gray-900">
                    {application.first_name} {application.last_name}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Position:</span>
                  <p className="text-gray-900">{application.position}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Type:</span>
                  <p className="text-gray-900 capitalize">{application.application_type}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Submitted on:</span>
                  <p className="text-gray-900">
                    {new Date(application.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <div className="mt-1">{getStatusBadge(application.status)}</div>
                </div>

                {application.status === "approved" && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
                    <h4 className="text-sm font-medium text-green-800 mb-1">
                      Congratulations! Your application has been approved.
                    </h4>
                    {credentials ? (
                      <div className="text-sm text-green-700">
                        <p className="mb-2">
                          You can now log in with the following credentials:
                        </p>
                        <div className="bg-white p-3 rounded border border-green-200 mb-2">
                          <p>
                            <strong>Username:</strong> {credentials.username}
                          </p>
                          <p>
                            <strong>Password:</strong> {credentials.password}
                          </p>
                        </div>
                        <p className="text-xs">
                          Please make sure to change your password after logging in.
                        </p>
                        <div className="mt-3">
                          <Link to="/login">
                            <Button variant="primary" size="sm" fullWidth>
                              Go to Login
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-green-700">
                        You should have received an email with your login credentials.
                        If you haven't received it, please contact our HR department.
                      </p>
                    )}
                  </div>
                )}

                {application.status === "rejected" && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                    <h4 className="text-sm font-medium text-red-800 mb-1">
                      We're sorry, your application has been rejected.
                    </h4>
                    <p className="text-sm text-red-700">
                      Thank you for your interest in our company. We encourage you
                      to apply for other positions that match your skills and experience.
                    </p>
                  </div>
                )}

                {application.status === "pending" && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">
                      Your application is currently under review.
                    </h4>
                    <p className="text-sm text-yellow-700">
                      Our HR team is reviewing your application. You will be notified
                      by email once a decision has been made.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-blue-600 hover:text-blue-800">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationTracking;
