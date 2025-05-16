import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { CalendarIcon, CheckIcon, XIcon, Trash2Icon } from "lucide-react";
import ConfirmModal from "../../components/ui/ConfirmModal";

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  leave_balance: number;
}

interface LeaveRequest {
  id: number;
  user: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  user_details?: User;
}

const LeaveManagement: React.FC = () => {
  const { token } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<boolean>(false);
  const [deleteRequestId, setDeleteRequestId] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      console.log("Fetching leave requests with filter:", filter);
      fetchLeaveRequests();

      // Nettoyer les notifications de congé obsolètes
      cleanLeaveNotifications();
    }
  }, [token, filter]);

  // Effet pour récupérer les demandes de congés lorsque le filtre change
  useEffect(() => {
    console.log("Filter changed to:", filter);
  }, [filter]);

  // Fonction pour nettoyer les notifications de congé obsolètes
  const cleanLeaveNotifications = async () => {
    try {
      console.log('Tentative de nettoyage des notifications de congé...');

      // Récupérer toutes les notifications
      const notificationsResponse = await fetch(`${API_BASE_URL}/notifications/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (notificationsResponse.ok) {
        const notifications = await notificationsResponse.json();

        // Filtrer les notifications de congé
        const leaveNotifications = notifications.filter(
          (notification) => notification.title && notification.title.includes('Demandes de congé en attente')
        );

        console.log(`Trouvé ${leaveNotifications.length} notifications de congé à supprimer`);

        // Supprimer chaque notification individuellement
        for (const notification of leaveNotifications) {
          await fetch(`${API_BASE_URL}/notifications/${notification.id}/`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }

        console.log('Notifications de congé nettoyées avec succès');
      } else {
        console.error('Erreur lors de la récupération des notifications:', notificationsResponse.status, notificationsResponse.statusText);
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des notifications de congé:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les demandes de congés, puis filtrer côté client
      // pour éviter les problèmes avec les filtres côté serveur
      const url = `${API_BASE_URL}/leaves/`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Fetch user details for each leave request
        const requestsWithUserDetails = await Promise.all(
          data.map(async (request: LeaveRequest) => {
            try {
              const userResponse = await fetch(
                `${API_BASE_URL}/users/${request.user}/`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (userResponse.ok) {
                const userData = await userResponse.json();
                return {
                  ...request,
                  user_details: userData,
                };
              }

              return request;
            } catch (error) {
              console.error(
                `Error fetching user details for request ${request.id}:`,
                error
              );
              return request;
            }
          })
        );

        // Filtrer pour exclure les stagiaires
        const filteredRequests = requestsWithUserDetails.filter(
          (request) => !request.user_details || request.user_details.user_type !== 'intern'
        );

        console.log("Received leave requests:", filteredRequests);
        console.log("Current filter:", filter);
        setLeaveRequests(filteredRequests);
      } else {
        console.warn("Failed to fetch leave requests:", response.status);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await fetch(
        `${API_BASE_URL}/leaves/${id}/approve_leave/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        await fetchLeaveRequests();
        // Nettoyer les notifications après approbation
        await cleanLeaveNotifications();
      } else {
        console.warn("Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving leave request:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await fetch(
        `${API_BASE_URL}/leaves/${id}/reject_leave/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        await fetchLeaveRequests();
        // Nettoyer les notifications après rejet
        await cleanLeaveNotifications();
      } else {
        console.warn("Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting leave request:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteRequest = (id: number) => {
    setDeleteRequestId(id);
    setConfirmDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteRequestId) return;

    setProcessingId(deleteRequestId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/leaves/${deleteRequestId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchLeaveRequests();
      } else {
        console.warn("Failed to delete request:", response.status);
      }
    } catch (error) {
      console.error("Error deleting leave request:", error);
    } finally {
      setProcessingId(null);
      setConfirmDeleteModal(false);
      setDeleteRequestId(null);
    }
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

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading leave requests..." />;
  }

  return (
    <div className="container mx-auto py-6">
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDeleteModal}
        onClose={() => setConfirmDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirmation de suppression"
        message="Êtes-vous sûr de vouloir supprimer cette demande de congé ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isProcessing={processingId === deleteRequestId}
      />

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Leave Management
      </h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Leave Requests</h2>
          <div className="flex space-x-2">
            <Button
              variant={filter === "all" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "pending" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter("pending")}
            >
              Pending
            </Button>
            <Button
              variant={filter === "approved" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter("approved")}
            >
              Approved
            </Button>
            <Button
              variant={filter === "rejected" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter("rejected")}
            >
              Rejected
            </Button>
          </div>
        </div>

        {leaveRequests.length === 0 ? (
          <div className="p-6 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No leave requests found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === "all"
                ? "There are no leave requests in the system yet."
                : `No ${filter} leave requests found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Employee
                  </th>
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
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  const filteredRequests = leaveRequests.filter(request => filter === "all" || request.status === filter);
                  console.log("Filtered requests for display:", filteredRequests);
                  return filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-800 font-semibold">
                            {request.user_details
                              ? request.user_details.first_name.charAt(0)
                              : ""}
                            {request.user_details
                              ? request.user_details.last_name.charAt(0)
                              : ""}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.user_details
                              ? `${request.user_details.first_name} ${request.user_details.last_name}`
                              : `User #${request.user}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.user_details
                              ? `Balance: ${request.user_details.leave_balance} days`
                              : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.start_date).toLocaleDateString()} -{" "}
                      {new Date(request.end_date).toLocaleDateString()}
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {request.status === "pending" ? (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="success"
                            size="sm"
                            icon={<CheckIcon className="h-4 w-4" />}
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={processingId === request.id}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<XIcon className="h-4 w-4" />}
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={processingId === request.id}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Trash2Icon className="h-4 w-4" />}
                            onClick={() => handleDeleteRequest(request.id)}
                            disabled={processingId === request.id}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))})()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveManagement;
