import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  LinkIcon,
  Loader2Icon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  XIcon
} from "lucide-react";
import { format } from "date-fns";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import { API_BASE_URL } from "../../config/constants";
import AlertModal from "../../components/ui/AlertModal";

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
  participants: number[];
  participants_details?: {
    id: number;
    username: string;
    full_name: string;
    user_type: string;
  }[];
}

interface RescheduleMeetingData {
  meetingId: number;
  title: string;
  date_time: string;
  duration_minutes: number;
  location_type: string;
  location_details: string;
  meeting_link: string;
  cancellation_reason: string;
  participants: number[];
}

const EmployeeMeetings: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past" | "cancelled">("all");

  // État pour les alertes modales
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

  // État pour le modal de reprogrammation
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [rescheduleData, setRescheduleData] = useState<RescheduleMeetingData>({
    meetingId: 0,
    title: "",
    date_time: "",
    duration_minutes: 60,
    location_type: "office",
    location_details: "",
    meeting_link: "",
    cancellation_reason: "",
    participants: []
  });

  useEffect(() => {
    if (token) {
      fetchMeetings();
    }
  }, [token]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/meetings/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Meetings fetched:", data);
        setMeetings(data);
      } else {
        throw new Error("Failed to fetch meetings");
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setError("Failed to load meetings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMeeting = async (meetingId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/change_status/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setMeetings(
          meetings.map((meeting) =>
            meeting.id === meetingId ? { ...meeting, status: "completed" } : meeting
          )
        );
        // Afficher une alerte modale au lieu d'une alerte standard
        setAlertModal({
          isOpen: true,
          title: 'Succès',
          message: 'Réunion marquée comme terminée avec succès !',
          type: 'success'
        });
      } else {
        setAlertModal({
          isOpen: true,
          title: 'Erreur',
          message: 'Échec de la mise à jour du statut de la réunion.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error("Error completing meeting:", error);
      setAlertModal({
        isOpen: true,
        title: 'Erreur',
        message: 'Une erreur s\'est produite lors de la mise à jour du statut.',
        type: 'error'
      });
    }
  };

  const handleCancelMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setRescheduleData({
      meetingId: meeting.id,
      title: meeting.title,
      date_time: "",
      duration_minutes: meeting.duration_minutes,
      location_type: meeting.location_type,
      location_details: meeting.location_details || "",
      meeting_link: meeting.meeting_link || "",
      cancellation_reason: "",
      participants: meeting.participants || []
    });
    setShowRescheduleModal(true);
  };

  const handleRescheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMeeting) return;

    try {
      // 1. Annuler la réunion actuelle
      const cancelResponse = await fetch(`${API_BASE_URL}/meetings/${selectedMeeting.id}/change_status/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
          cancellation_reason: rescheduleData.cancellation_reason
        }),
      });

      if (!cancelResponse.ok) {
        throw new Error("Échec de l'annulation de la réunion");
      }

      // 2. Créer une nouvelle réunion si une date a été spécifiée
      if (rescheduleData.date_time) {
        const meetingData = {
          title: rescheduleData.title,
          description: `Réunion reprogrammée. Ancienne réunion: ${selectedMeeting.title}. Raison de l'annulation: ${rescheduleData.cancellation_reason}`,
          date_time: rescheduleData.date_time,
          duration_minutes: rescheduleData.duration_minutes,
          location_type: rescheduleData.location_type,
          location_details: rescheduleData.location_details,
          meeting_link: rescheduleData.meeting_link,
        };

        const createResponse = await fetch(`${API_BASE_URL}/meetings/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(meetingData),
        });

        if (!createResponse.ok) {
          throw new Error("Échec de la création de la nouvelle réunion");
        }

        const newMeeting = await createResponse.json();

        // 3. Ajouter les participants à la nouvelle réunion
        for (const participantId of rescheduleData.participants) {
          await fetch(`${API_BASE_URL}/meetings/${newMeeting.id}/add_participant/`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ participant_id: participantId }),
          });
        }
      }

      // 4. Rafraîchir la liste des réunions
      fetchMeetings();
      setShowRescheduleModal(false);

      // Utiliser une alerte modale au lieu de window.alert
      setAlertModal({
        isOpen: true,
        title: 'Succès',
        message: "Réunion annulée avec succès" + (rescheduleData.date_time ? " et reprogrammée" : ""),
        type: 'success'
      });
    } catch (error) {
      console.error("Error rescheduling meeting:", error);

      // Utiliser une alerte modale au lieu de window.alert
      setAlertModal({
        isOpen: true,
        title: 'Erreur',
        message: `Une erreur s'est produite: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
    }
  };

  const getLocationDisplay = (meeting: Meeting) => {
    if (meeting.location_type === "online") {
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
    } else {
      return (
        <div className="flex items-center text-sm text-gray-500">
          <MapPinIcon className="h-4 w-4 mr-2" />
          {meeting.location_type === "office" ? "Bureau: " : "Lieu externe: "}
          {meeting.location_details}
        </div>
      );
    }
  };

  const getStatusBadge = (meeting: Meeting) => {
    switch (meeting.status) {
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
        const meetingDate = new Date(meeting.date_time);
        const now = new Date();
        if (meetingDate < now) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Passé
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            À venir
          </span>
        );
    }
  };

  // Filtrer les réunions en fonction du filtre sélectionné
  const filteredMeetings = meetings.filter((meeting) => {
    const meetingDate = new Date(meeting.date_time);
    const now = new Date();

    if (filter === "upcoming") {
      return meetingDate >= now && meeting.status !== "cancelled";
    }
    if (filter === "past") {
      return meetingDate < now || meeting.status === "completed";
    }
    if (filter === "cancelled") {
      return meeting.status === "cancelled";
    }
    return true;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2Icon className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Chargement des réunions...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Erreur</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          type="button"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => fetchMeetings()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Alerte modale */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Mes Réunions</h2>
        <div className="flex space-x-2">
          <Button
            variant={filter === "all" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Toutes
          </Button>
          <Button
            variant={filter === "upcoming" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("upcoming")}
          >
            À venir
          </Button>
          <Button
            variant={filter === "past" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("past")}
          >
            Passées
          </Button>
          <Button
            variant={filter === "cancelled" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("cancelled")}
          >
            Annulées
          </Button>
        </div>
      </div>

      {filteredMeetings.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Aucune réunion trouvée
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "all"
              ? "Vous n'avez pas de réunions programmées."
              : filter === "upcoming"
              ? "Vous n'avez pas de réunions à venir."
              : filter === "cancelled"
              ? "Vous n'avez pas de réunions annulées."
              : "Vous n'avez pas de réunions passées."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                meeting.status === "cancelled" ? "border-red-300 bg-red-50" : ""
              }`}
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
                      {format(new Date(meeting.date_time), "PPP")} à {format(new Date(meeting.date_time), "p")}
                      <span className="ml-2 text-gray-400">({meeting.duration_minutes} min)</span>
                    </div>
                    {getLocationDisplay(meeting)}
                    <div className="flex items-center text-sm text-gray-500">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Participants: {meeting.participants_details
                        ? meeting.participants_details.map(p => p.full_name || p.username).join(", ")
                        : "Aucun participant"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {getStatusBadge(meeting)}

                  {meeting.status === "scheduled" && (
                    <div className="flex space-x-2 mt-2">
                      <Button
                        variant="success"
                        size="sm"
                        icon={<CheckCircleIcon className="h-4 w-4" />}
                        onClick={() => handleCompleteMeeting(meeting.id)}
                      >
                        Valider
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<XCircleIcon className="h-4 w-4" />}
                        onClick={() => handleCancelMeeting(meeting)}
                      >
                        Annuler
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de reprogrammation */}
      {showRescheduleModal && selectedMeeting && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Annuler la réunion
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowRescheduleModal(false)}
                aria-label="Fermer"
                title="Fermer"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleRescheduleMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison de l'annulation
                </label>
                <textarea
                  value={rescheduleData.cancellation_reason}
                  onChange={(e) => setRescheduleData({...rescheduleData, cancellation_reason: e.target.value})}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  rows={3}
                  required
                  placeholder="Veuillez indiquer la raison de l'annulation"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Reprogrammer la réunion (optionnel)
                </h4>

                <TextInput
                  label="Titre"
                  value={rescheduleData.title}
                  onChange={(e) => setRescheduleData({...rescheduleData, title: e.target.value})}
                />

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nouvelle date et heure
                  </label>
                  <input
                    type="datetime-local"
                    value={rescheduleData.date_time}
                    onChange={(e) => setRescheduleData({...rescheduleData, date_time: e.target.value})}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    title="Nouvelle date et heure"
                    aria-label="Nouvelle date et heure"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée (minutes)
                  </label>
                  <select
                    value={rescheduleData.duration_minutes}
                    onChange={(e) => setRescheduleData({...rescheduleData, duration_minutes: parseInt(e.target.value)})}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    title="Durée en minutes"
                    aria-label="Durée en minutes"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 heure</option>
                    <option value="90">1h30</option>
                    <option value="120">2 heures</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-5">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                >
                  Confirmer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeMeetings;
