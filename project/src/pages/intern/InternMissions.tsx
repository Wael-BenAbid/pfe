import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import Button from "../../components/ui/Button";
import AlertModal from "../../components/ui/AlertModal";
import { API_URL } from "../../config/constants";
import {
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  Loader2Icon,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";

// Define Mission type to improve code readability
interface Mission {
  id: number;
  title: string;
  description: string;
  deadline: string;
  completed: boolean;
  assigned_to_id: number;
  assigned_to_name: string;
  supervisor_id: number;
  supervisor_name: string;
  supervisor_full_name: string;
  status: string;
  created_at: Date;
}

const InternMissions: React.FC = () => {
  const { user, token } = useAuth();
  const { notifications } = useNotifications();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
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

  // Function to fetch missions
  const fetchMissions = async () => {
    if (!user?.id || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Vérifier d'abord les missions en retard
      try {
        await fetch(`${API_URL}/missions/check_late_missions/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Vérification des missions en retard effectuée');
      } catch (checkError) {
        console.warn('Erreur lors de la vérification des missions en retard:', checkError);
        // Continuer même si cette requête échoue
      }

      // Vérifier les missions dont la date limite approche
      try {
        await fetch(`${API_URL}/missions/check_upcoming_deadlines/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Vérification des missions dont la date limite approche effectuée');
      } catch (checkError) {
        console.warn('Erreur lors de la vérification des missions dont la date limite approche:', checkError);
        // Continuer même si cette requête échoue
      }

      // Appeler directement l'API pour récupérer les missions
      const response = await fetch(`${API_URL}/missions/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const missionsData = await response.json();
        console.log('Missions récupérées:', missionsData);
        setMissions(missionsData || []);
      } else {
        throw new Error('Failed to fetch missions');
      }
    } catch (error) {
      console.error("Error fetching missions:", error);
      setError("Failed to load missions. Please try again later.");
      setMissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Check for mission-related notifications
  useEffect(() => {
    const missionNotifications = notifications.filter(
      n => n.title.includes("Mission") && !n.read
    );

    if (missionNotifications.length > 0) {
      // Refresh missions when there are new mission notifications
      fetchMissions();
    }
  }, [notifications, token, user?.id]);

  // Initial fetch of missions
  useEffect(() => {
    fetchMissions();
  }, [user?.id, token]);

  // Filter missions based on selected filter
  const filteredMissions = missions.filter((mission) => {
    if (filter === "pending") return !mission.completed;
    if (filter === "completed") return mission.completed;
    return true;
  });

  // Determine deadline status with visual indicator
  const getDeadlineStatus = (deadline: string, status?: string) => {
    const deadlineDate = new Date(deadline);

    // Si le statut est explicitement "late", afficher "Overdue" en rouge avec une icône d'alerte
    if (status === 'late') {
      return (
        <span className="text-red-600 font-medium flex items-center">
          <AlertCircleIcon className="h-4 w-4 mr-1" />
          Overdue
        </span>
      );
    }

    if (isPast(deadlineDate) && !isToday(deadlineDate)) {
      return (
        <span className="text-red-600 font-medium flex items-center">
          <AlertCircleIcon className="h-4 w-4 mr-1" />
          Overdue
        </span>
      );
    }
    if (isToday(deadlineDate)) {
      return (
        <span className="text-orange-600 font-medium flex items-center">
          <ClockIcon className="h-4 w-4 mr-1" />
          Due today
        </span>
      );
    }
    return (
      <span className="text-green-600 font-medium flex items-center">
        <ClockIcon className="h-4 w-4 mr-1" />
        Upcoming
      </span>
    );
  };

  // Handle mission completion
  const handleCompleteMission = async (missionId: number) => {
    try {
      // Update local state optimistically
      setMissions((prev) =>
        prev.map((m) => (m.id === missionId ? { ...m, completed: true } : m))
      );

      // Call the API to update the mission
      console.log(`Marking mission ${missionId} as complete`);

      const response = await fetch(`${API_URL}/missions/${missionId}/complete_mission/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Revert the state change if the API call fails
        setMissions((prev) =>
          prev.map((m) => (m.id === missionId ? { ...m, completed: false } : m))
        );
        throw new Error('Failed to update mission');
      }

      // Show success message
      setAlertModal({
        isOpen: true,
        title: 'Succès',
        message: 'Mission marquée comme terminée !',
        type: 'success'
      });

    } catch (error) {
      console.error("Error completing mission:", error);
      setAlertModal({
        isOpen: true,
        title: 'Erreur',
        message: 'Impossible de marquer la mission comme terminée. Veuillez réessayer.',
        type: 'error'
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2Icon className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading missions...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          type="button"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">My Missions</h2>
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
            variant={filter === "completed" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed
          </Button>
        </div>
      </div>

      {filteredMissions.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No missions found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "all"
              ? "You don't have any missions assigned yet."
              : filter === "pending"
              ? "You don't have any pending missions."
              : "You haven't completed any missions yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMissions.map((mission) => (
            <div
              key={mission.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                mission.status === 'late' ? 'border-red-500 bg-red-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {mission.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {mission.description}
                  </p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Deadline: {format(new Date(mission.deadline), "PPP")}
                    <span className="mx-2">•</span>
                    {getDeadlineStatus(mission.deadline, mission.status)}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Supervisor: {mission.supervisor_full_name || mission.supervisor_name || "Non assigné"}
                  </div>
                </div>
                <div className="ml-4">
                  {mission.completed ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Completed
                    </span>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      icon={<CheckCircleIcon className="h-4 w-4" />}
                      onClick={() => handleCompleteMission(mission.id)}
                    >
                      Mark as Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InternMissions;
