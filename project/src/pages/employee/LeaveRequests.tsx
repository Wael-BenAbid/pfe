import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import AlertModal from "../../components/ui/AlertModal";
import { CalendarIcon, PlusIcon, ClockIcon, Paperclip, File } from "lucide-react";

interface LeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface NewLeaveRequest {
  start_date: string;
  end_date: string;
  reason: string;
  leave_type?: string;
  attachment?: File | null;
}

const LeaveRequests: React.FC = () => {
  const { token, user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [newRequest, setNewRequest] = useState<NewLeaveRequest>({
    start_date: "",
    end_date: "",
    reason: "",
    leave_type: "annual",
    attachment: null,
  });
  const [leaveBalance, setLeaveBalance] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) {
      fetchLeaveRequests();
      fetchUserDetails();
    }
  }, [token]);

  // Log l'utilisateur pour le débogage
  useEffect(() => {
    console.log("Current user:", user);
  }, [user]);

  const fetchUserDetails = async () => {
    if (!token) return;

    try {
      // Utiliser l'endpoint /users/me/ pour obtenir les détails de l'utilisateur connecté
      const response = await fetch(`${API_BASE_URL}/users/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("User details fetched:", userData);
        setLeaveBalance(userData.leave_balance);
      } else {
        console.error("Failed to fetch user details:", response.status);

        // Essayer de récupérer les détails de l'erreur
        try {
          const errorData = await response.json();
          console.error("Error details:", errorData);
        } catch {
          // Omettre complètement le paramètre d'erreur puisqu'il n'est pas utilisé
          console.error("Could not parse error response");
        }
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data);
      } else {
        console.warn("Failed to fetch leave requests:", response.status);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifier que les dates sont valides
    if (new Date(newRequest.start_date) > new Date(newRequest.end_date)) {
      setAlertModal({
        isOpen: true,
        title: 'Erreur de date',
        message: 'La date de début doit être antérieure à la date de fin',
        type: 'error'
      });
      return;
    }

    // Vérifier que les dates ne sont pas dans le passé
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates

    if (new Date(newRequest.start_date) < today) {
      setAlertModal({
        isOpen: true,
        title: 'Erreur de date',
        message: 'La date de début ne peut pas être dans le passé',
        type: 'error'
      });
      return;
    }

    // Récupérer l'ID de l'utilisateur actuel
    let userId = user?.id;

    // Si l'ID n'est pas disponible, essayer de le récupérer directement
    if (!userId) {
      try {
        const userResponse = await fetch(`${API_BASE_URL}/users/me/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log("Retrieved user data:", userData);
          userId = userData.id;
        } else {
          console.error("Failed to fetch user data:", userResponse.status);
          setAlertModal({
            isOpen: true,
            title: 'Erreur d\'authentification',
            message: 'Impossible de récupérer votre identifiant utilisateur. Veuillez vous reconnecter.',
            type: 'error'
          });
          return;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setAlertModal({
          isOpen: true,
          title: 'Erreur d\'authentification',
          message: 'Impossible de récupérer votre identifiant utilisateur. Veuillez vous reconnecter.',
          type: 'error'
        });
        return;
      }
    }

    // Vérifier que l'ID de l'utilisateur est disponible
    if (!userId) {
      console.error("User ID is not available");
      setAlertModal({
        isOpen: true,
        title: 'Erreur d\'authentification',
        message: 'Impossible de récupérer votre identifiant utilisateur. Veuillez vous reconnecter.',
        type: 'error'
      });
      return;
    }

    // Utiliser FormData pour envoyer à la fois les données textuelles et le fichier
    const formData = new FormData();
    formData.append('user', userId.toString());
    formData.append('start_date', newRequest.start_date);
    formData.append('end_date', newRequest.end_date);
    formData.append('reason', newRequest.reason);
    formData.append('leave_type', newRequest.leave_type || 'annual');

    // Ajouter le fichier s'il existe
    if (newRequest.attachment) {
      formData.append('attachment', newRequest.attachment);
    }

    console.log("Submitting leave request with attachment:", newRequest.attachment ? newRequest.attachment.name : "No attachment");

    try {
      // Utiliser une requête avec FormData
      const response = await fetch(`${API_BASE_URL}/leaves/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          // Ne pas définir Content-Type car FormData le fait automatiquement avec la boundary
        },
        body: formData,
        credentials: "include" // Inclure les cookies si nécessaire
      });

      // Log de la réponse pour le débogage
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      let responseData = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json().catch(() => ({}));
      } else {
        const text = await response.text().catch(() => "");
        console.log("Response text:", text);
      }

      console.log("Response data:", responseData);

      if (response.ok) {
        await fetchLeaveRequests();
        setShowNewRequestForm(false);
        setNewRequest({ start_date: "", end_date: "", reason: "", leave_type: "annual", attachment: null });
        setAlertModal({
          isOpen: true,
          title: 'Succès',
          message: 'Demande de congé soumise avec succès!',
          type: 'success'
        });
      } else {
        console.warn("Failed to submit request:", responseData);

        // Message d'erreur plus détaillé
        let errorMessage = "Échec de la soumission de la demande de congé.";
        if (typeof responseData === 'object' && responseData !== null) {
          const errors = Object.entries(responseData)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

          if (errors) {
            errorMessage += `\n\nDétails:\n${errors}`;
          }
        }

        setAlertModal({
          isOpen: true,
          title: 'Erreur',
          message: errorMessage,
          type: 'error'
        });
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
      setAlertModal({
        isOpen: true,
        title: 'Erreur',
        message: "Erreur lors de la soumission de la demande de congé: " + (error instanceof Error ? error.message : String(error)),
        type: 'error'
      });
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    const baseClass =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case "approved":
        return (
          <span className={`${baseClass} bg-green-100 text-green-800`}>
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className={`${baseClass} bg-red-100 text-red-800`}>
            Rejected
          </span>
        );
      default:
        return (
          <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Leave Requests</h2>
          <p className="text-sm text-gray-500">
            Your current leave balance:{" "}
            <span className="font-medium text-blue-600">
              {leaveBalance} days
            </span>
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() => setShowNewRequestForm(true)}
        >
          New Request
        </Button>
      </div>

      {showNewRequestForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                New Leave Request
              </h3>
              <Button
                variant="outline"
                size="sm"
                icon={<ClockIcon className="h-4 w-4" />}
              >
                {newRequest.start_date && newRequest.end_date
                  ? `${calculateDays(
                      newRequest.start_date,
                      newRequest.end_date
                    )} days`
                  : "Select dates"}
              </Button>
            </div>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  name="start_date"
                  type="date"
                  label="Start Date"
                  value={newRequest.start_date}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, start_date: e.target.value })
                  }
                  required
                />
                <TextInput
                  name="end_date"
                  type="date"
                  label="End Date"
                  value={newRequest.end_date}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, end_date: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="leave-type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type de congé
                </label>
                <select
                  id="leave-type"
                  name="leave_type"
                  aria-label="Type de congé"
                  value={newRequest.leave_type}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, leave_type: e.target.value })
                  }
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                >
                  <option value="annual">Congé annuel</option>
                  <option value="sick">Congé maladie</option>
                  <option value="personal">Congé personnel</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="leave-reason"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Reason
                </label>
                <textarea
                  id="leave-reason"
                  name="reason"
                  aria-label="Reason for leave"
                  placeholder="Please provide a reason for your leave request"
                  value={newRequest.reason}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, reason: e.target.value })
                  }
                  rows={3}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>

              {/* Champ pour télécharger un fichier */}
              <div>
                <label
                  htmlFor="attachment"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pièce jointe (optionnel)
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    id="attachment"
                    name="attachment"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewRequest({ ...newRequest, attachment: file });
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Paperclip className="h-4 w-4" />}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    Ajouter un fichier
                  </Button>
                  {newRequest.attachment && (
                    <div className="ml-3 flex items-center text-sm text-gray-500">
                      <File className="h-4 w-4 mr-1" />
                      <span className="truncate max-w-xs">{newRequest.attachment.name}</span>
                      <button
                        type="button"
                        className="ml-1 text-red-500 hover:text-red-700"
                        onClick={() => setNewRequest({ ...newRequest, attachment: null })}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Formats acceptés : Images, PDF, Word (.doc, .docx)
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewRequestForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={
                    !newRequest.start_date ||
                    !newRequest.end_date ||
                    !newRequest.reason
                  }
                >
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading leave requests..." />
      ) : leaveRequests.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No leave requests
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new leave request.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Period
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Days
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Reason
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {new Date(request.start_date).toLocaleDateString()} -{" "}
                        {new Date(request.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculateDays(request.start_date, request.end_date)} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LeaveRequests;
