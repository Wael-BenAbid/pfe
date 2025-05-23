import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import AlertModal from "../../components/ui/AlertModal";
import { CheckCircleIcon, ClockIcon, PlusIcon } from "lucide-react";

interface Mission {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed";
  supervisor_name: string;
  supervisor_full_name?: string;
  supervisor: number;
  created_at: string;
}

const Missions: React.FC = () => {
  const { token } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    fetchMissions();
  }, [token]);



  const fetchMissions = async () => {
    try {
      // Vérifier d'abord les missions en retard
      try {
        await fetch(`${API_BASE_URL}/missions/check_late_missions/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        console.log("Vérification des missions en retard effectuée");
      } catch (error) {
        console.warn("Erreur lors de la vérification des missions en retard:", error);
        // Continuer même si cette requête échoue
      }

      // Récupérer les missions assignées à l'employé
      const response = await fetch(`${API_BASE_URL}/missions/assigned/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Missions assignées récupérées:', data);
        console.log('Nombre total de missions assignées:', data.length);

        // Mettre à jour le statut des missions en fonction de leur date limite
        const updatedMissions = data.map((mission: Mission) => {
          if (mission.status === 'completed') {
            return mission;
          }

          // Vérifier si la mission est en retard
          const deadlineDate = new Date(mission.deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (deadlineDate < today && mission.status !== 'late') {
            return { ...mission, status: 'late' };
          }

          return mission;
        });

        setMissions(updatedMissions);
      }
    } catch (error) {
      console.error("Error fetching missions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMission = async (id: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/missions/${id}/complete_mission/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );

      if (response.ok) {
        fetchMissions();
        setAlertModal({
          isOpen: true,
          title: 'Succès',
          message: "Mission marquée comme complétée avec succès!",
          type: 'success'
        });
      } else {
        const errorData = await response.json();
        console.error("Failed to complete mission:", errorData);
        setAlertModal({
          isOpen: true,
          title: 'Erreur',
          message: "Échec de la complétion de la mission. Veuillez réessayer.",
          type: 'error'
        });
      }
    } catch (error) {
      console.error("Error completing mission:", error);
      setAlertModal({
        isOpen: true,
        title: 'Erreur',
        message: "Une erreur s'est produite lors de la complétion de la mission.",
        type: 'error'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            In Progress
          </span>
        );
      case "late":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Late
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
    }
  };

  // Fonction pour vérifier si une mission est en retard
  const isMissionLate = (mission: Mission) => {
    if (mission.status === 'late') return true;

    const deadlineDate = new Date(mission.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates

    return deadlineDate < today;
  };

  return (
    <>
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {loading ? (
        <div className="p-6 text-center text-gray-600">Loading missions...</div>
      ) : (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Missions assignées par l'administrateur
            </h2>
          </div>



          {missions.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
              <p className="text-gray-500">Aucune mission assignée par l'administrateur n'a été trouvée.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {missions.map((mission) => {
                  // Vérifier si la mission est en retard
                  const isLate = isMissionLate(mission);
                  // Si la mission est en retard mais n'a pas le statut 'late', on force l'affichage en rouge
                  const displayStatus = isLate && mission.status !== 'late' ? 'late' : mission.status;

                  return (
                    <li key={mission.id} className={`px-4 py-4 sm:px-6 ${isLate ? 'bg-red-50 border-l-4 border-red-500' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className={`text-sm font-medium ${isLate ? 'text-red-700' : 'text-gray-900'}`}>
                              {mission.title}
                            </div>
                            {getStatusBadge(displayStatus)}
                          </div>
                          <div className="mt-2">
                            <p className={`text-sm ${isLate ? 'text-red-600' : 'text-gray-500'}`}>
                              {mission.description}
                            </p>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className={`flex items-center text-sm ${isLate ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                <ClockIcon className={`flex-shrink-0 mr-1.5 h-4 w-4 ${isLate ? 'text-red-500' : 'text-gray-400'}`} />
                                Deadline:{" "}
                                {new Date(mission.deadline).toLocaleDateString()}
                                {isLate && ' (EN RETARD)'}
                              </p>
                            </div>
                            <div className={`mt-2 flex items-center text-sm ${isLate ? 'text-red-600' : 'text-gray-500'} sm:mt-0`}>
                              Supervisor: {mission.supervisor_full_name || mission.supervisor_name || "Non assigné"}
                            </div>
                          </div>
                        </div>
                        {mission.status !== "completed" && (
                          <div className="ml-4">
                            <Button
                              variant="success"
                              size="sm"
                              icon={<CheckCircleIcon className="h-4 w-4" />}
                              onClick={() => handleCompleteMission(mission.id)}
                            >
                              Complete
                            </Button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
          )}
        </div>
      )}
    </>
  );
};
export default Missions;
