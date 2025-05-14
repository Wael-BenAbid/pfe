import React, { useState, useEffect } from "react";
import { API_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import TextArea from "../../components/ui/TextArea";
import DateInput from "../../components/ui/DateInput";
import {
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AlertCircleIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  LinkIcon,
} from "lucide-react";
import { format } from "date-fns";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

interface Mission {
  id: number;
  title: string;
  description: string;
  deadline: string;
  completed: boolean;
  assigned_to: number;
  supervisor: number;
  created_at: string;
  assigned_to_name?: string;
  supervisor_name?: string;
}

interface Meeting {
  id: number;
  title: string;
  description: string;
  date_time: string;
  duration_minutes: number;
  location_type: string;
  location_details: string;
  meeting_link: string;
  organizer: number;
  organizer_name: string;
  status: string;
}

interface InternMissionManagementProps {
  internId: number;
  internName: string;
}

const InternMissionManagement: React.FC<InternMissionManagementProps> = ({
  internId,
  internName,
}) => {
  const { token, user } = useAuth();
  const { addNotification } = useNotifications();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [showNewMissionForm, setShowNewMissionForm] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [newMission, setNewMission] = useState({
    title: "",
    description: "",
    deadline: "",
  });

  useEffect(() => {
    fetchMissions();
    fetchMeetings();
  }, [token, internId]);

  const fetchMissions = async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Utiliser l'endpoint spécifique pour récupérer les missions supervisées
      const response = await fetch(`${API_URL}/missions/supervised/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch missions");
      }

      const data = await response.json();
      console.log("Missions supervisées récupérées:", data);

      // Filtrer pour ne montrer que les missions assignées à ce stagiaire
      const internMissions = data.filter((mission: Mission) => mission.assigned_to === internId);
      console.log(`Affichage des missions supervisées pour le stagiaire ${internId}:`, internMissions);
      setMissions(internMissions);
    } catch (error) {
      console.error("Error fetching missions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    if (!token) return;

    try {
      setLoadingMeetings(true);

      // Récupérer toutes les réunions organisées par l'utilisateur
      const response = await fetch(`${API_URL}/meetings/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch meetings");
      }

      const data = await response.json();

      // Filtrer pour ne montrer que les réunions avec ce stagiaire comme participant
      const internMeetings = data.filter((meeting: Meeting) => {
        // Vérifier si le stagiaire est un participant (nécessite une API qui retourne les détails des participants)
        // Pour l'instant, nous devons faire une supposition basée sur les données disponibles
        return meeting.participants && meeting.participants.includes(internId);
      });

      console.log(`Réunions avec le stagiaire ${internId}:`, internMeetings);
      setMeetings(internMeetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (editingMission) {
      setEditingMission({
        ...editingMission,
        [name]: value,
      });
    } else {
      setNewMission({
        ...newMission,
        [name]: value,
      });
    }
  };

  const resetForm = () => {
    setNewMission({
      title: "",
      description: "",
      deadline: "",
    });
    setEditingMission(null);
    setShowNewMissionForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Vérifier si la date limite est dans le passé
    const deadlineDate = new Date(newMission.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates

    if (deadlineDate < today) {
      alert("La date limite ne peut pas être dans le passé. Veuillez choisir une date future.");
      return;
    }

    try {
      const missionData = {
        title: newMission.title,
        description: newMission.description,
        deadline: newMission.deadline,
        assigned_to: internId,
        supervisor: user?.id, // Ajouter l'ID du superviseur (l'employé connecté)
      };

      console.log("Création d'une mission avec les données:", missionData);

      const response = await fetch(`${API_URL}/missions/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(missionData),
      });

      if (!response.ok) {
        throw new Error("Failed to create mission");
      }

      // Add notification for the intern
      addNotification({
        title: "New Mission Assigned",
        message: `You have been assigned a new mission: ${newMission.title}`,
        type: "info",
      });

      // Afficher un message de confirmation avec mention de l'email
      resetForm();
      fetchMissions();
      alert("Mission created successfully! An email notification has been sent to the intern.");
    } catch (error) {
      console.error("Error creating mission:", error);
      alert("Failed to create mission. Please try again.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingMission) return;

    // Vérifier si la date limite est dans le passé
    const deadlineDate = new Date(editingMission.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates

    if (deadlineDate < today) {
      alert("La date limite ne peut pas être dans le passé. Veuillez choisir une date future.");
      return;
    }

    try {
      // Récupérer d'abord les détails complets de la mission pour obtenir le supervisor_id
      const getResponse = await fetch(
        `${API_URL}/missions/${editingMission.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!getResponse.ok) {
        throw new Error("Failed to get mission details");
      }

      const missionDetails = await getResponse.json();

      // Si la mission est modifiée, elle doit revenir à l'état "en cours"
      // sauf si elle n'était pas complétée auparavant
      const wasCompleted = missionDetails.completed;

      // Maintenant, mettre à jour la mission avec tous les champs requis
      const response = await fetch(
        `${API_URL}/missions/${editingMission.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editingMission.title,
            description: editingMission.description,
            deadline: editingMission.deadline,
            assigned_to: internId,
            supervisor: missionDetails.supervisor, // Utiliser le supervisor existant
            completed: false, // Remettre la mission en cours après modification
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(`Failed to update mission: ${JSON.stringify(errorData)}`);
      }

      // Add notification for the intern
      addNotification({
        title: "Mission Updated",
        message: wasCompleted
          ? `Your mission "${editingMission.title}" has been updated and is now back in progress`
          : `Your mission "${editingMission.title}" has been updated`,
        type: "warning",
      });

      resetForm();
      fetchMissions();

      // Afficher un message différent selon que la mission était complétée ou non
      if (wasCompleted) {
        alert("Mission updated successfully! The mission has been set back to 'in progress' status. An email notification has been sent to the intern.");
      } else {
        alert("Mission updated successfully! An email notification has been sent to the intern.");
      }
    } catch (error) {
      console.error("Error updating mission:", error);
      alert("Failed to update mission. Please try again.");
    }
  };

  const handleDelete = async (missionId: number, missionTitle: string) => {
    if (!token) return;

    if (!confirm(`Are you sure you want to delete the mission "${missionTitle}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/missions/${missionId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete mission");
      }

      // Add notification for the intern
      addNotification({
        title: "Mission Deleted",
        message: `The mission "${missionTitle}" has been deleted`,
        type: "error",
      });

      fetchMissions();
      alert("Mission deleted successfully! An email notification has been sent to the intern.");
    } catch (error) {
      console.error("Error deleting mission:", error);
      alert("Failed to delete mission. Please try again.");
    }
  };

  const handleEdit = (mission: Mission) => {
    setEditingMission(mission);
    setShowNewMissionForm(true);
  };

  // Fonction pour afficher le lieu de la réunion en fonction du type
  const getLocationDisplay = (meeting: Meeting) => {
    switch (meeting.location_type) {
      case "online":
        return (
          <div className="flex items-center text-sm text-gray-500">
            <LinkIcon className="h-4 w-4 mr-2" />
            <a
              href={meeting.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Lien de réunion
            </a>
          </div>
        );
      case "office":
        return (
          <div className="flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-2" />
            Bureau: {meeting.location_details || "Non spécifié"}
          </div>
        );
      case "external":
        return (
          <div className="flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-2" />
            Lieu externe: {meeting.location_details || "Non spécifié"}
          </div>
        );
      default:
        return null;
    }
  };

  // Fonction pour afficher le badge de statut de la réunion
  const getStatusBadge = (meeting: Meeting) => {
    switch (meeting.status) {
      case "scheduled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Planifié
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Terminé
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Annulé
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Section des missions */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Missions assignées à {internName}
          </h2>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => {
              resetForm();
              setShowNewMissionForm(true);
            }}
          >
            New Mission
          </Button>
        </div>

        {showNewMissionForm && (
          <div className="p-4 border-b border-gray-200">
            <form onSubmit={editingMission ? handleUpdate : handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <TextInput
                  label="Title"
                  name="title"
                  value={editingMission ? editingMission.title : newMission.title}
                  onChange={handleInputChange}
                  required
                />
                <TextArea
                  label="Description"
                  name="description"
                  value={
                    editingMission
                      ? editingMission.description
                      : newMission.description
                  }
                  onChange={handleInputChange}
                  required
                />
                <DateInput
                  label="Deadline"
                  name="deadline"
                  value={
                    editingMission ? editingMission.deadline : newMission.deadline
                  }
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                >
                  {editingMission ? "Update Mission" : "Create Mission"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading missions...</div>
        ) : missions.length === 0 ? (
          <div className="p-6 text-center">
            <AlertCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No missions found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new mission for this intern.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {missions.map((mission) => (
              <li key={mission.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {mission.title}
                      </div>
                      <div>
                        {mission.completed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : new Date(mission.deadline) < new Date() ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">{mission.description}</p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      Deadline: {new Date(mission.deadline).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<PencilIcon className="h-4 w-4" />}
                      onClick={() => handleEdit(mission)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<TrashIcon className="h-4 w-4" />}
                      onClick={() => handleDelete(mission.id, mission.title)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Section des rendez-vous */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">
            Rendez-vous avec {internName}
          </h2>
        </div>

        {loadingMeetings ? (
          <div className="p-6 text-center text-gray-600">Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div className="p-6 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No meetings found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No meetings scheduled with this intern yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {meeting.title}
                    </h3>
                    {meeting.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {meeting.description}
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(new Date(meeting.date_time), "PPP")} at {format(new Date(meeting.date_time), "p")}
                        <span className="ml-2 text-gray-400">({meeting.duration_minutes} min)</span>
                      </div>
                      {getLocationDisplay(meeting)}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(meeting)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternMissionManagement;
