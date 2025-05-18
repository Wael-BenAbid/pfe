import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import { useAlert } from "../../contexts/AlertContext";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import { PlusIcon, CheckIcon, XIcon, ClipboardListIcon, AlertTriangleIcon, ArrowLeft } from "lucide-react";
import { updateMissionStatuses, isMissionLate, Mission as MissionType } from "../../utils/missionUtils";
import BackButton from "../../components/ui/BackButton";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

// Utiliser le type Mission importé de missionUtils
interface Mission extends MissionType {}

const MissionManagement: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [interns, setInterns] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMissionForm, setShowNewMissionForm] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [completingMission, setCompletingMission] = useState<Mission | null>(null);
  const [completionLink, setCompletionLink] = useState("");
  const [penaltyDays, setPenaltyDays] = useState(1);
  const [showPenaltyForm, setShowPenaltyForm] = useState(false);
  const [penaltyMission, setPenaltyMission] = useState<Mission | null>(null);
  const [activeTab, setActiveTab] = useState<'employees' | 'interns'>('employees');
  const [newMission, setNewMission] = useState({
    title: "",
    description: "",
    deadline: "",
    assigned_to: 0,
    attachment_link: "",
  });

  useEffect(() => {
    fetchMissions();
    fetchEmployees();
    fetchInterns();
  }, [token]);

  const fetchMissions = async () => {
    if (!token) return;

    try {
      // Appeler l'endpoint pour vérifier et mettre à jour les missions en retard dans le backend
      await fetch(`${API_BASE_URL}/missions/check_late_missions/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch(error => {
        console.warn("Failed to check late missions:", error);
        // Continuer même si cette requête échoue
      });

      const response = await fetch(`${API_BASE_URL}/missions/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch missions");
      }

      const data = await response.json();

      // Mettre à jour le statut des missions en fonction de leur date limite
      const updatedMissions = updateMissionStatuses(data);

      // Fetch user details for each mission
      const missionsWithUserDetails = await Promise.all(
        updatedMissions.map(async (mission: Mission) => {
          try {
            // Vérifier si mission.assigned_to existe avant de faire la requête
            const userId = mission.assigned_to || mission.user; // Utiliser assigned_to ou user (pour la compatibilité)
            if (userId) {
              const userResponse = await fetch(
                `${API_BASE_URL}/users/${userId}/`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (userResponse.ok) {
                const userData = await userResponse.json();
                // Déterminer le type d'utilisateur assigné
                const assignee_type = userData.user_type === 'intern' ? 'interns' : 'employees';

                return {
                  ...mission,
                  user_details: {
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    user_type: userData.user_type,
                  },
                  assignee_type: assignee_type,
                };
              }
            }

            return mission;
          } catch (error) {
            console.error(
              `Error fetching user details for mission ${mission.id}:`,
              error
            );
            return mission;
          }
        })
      );

      setMissions(missionsWithUserDetails);
    } catch (error) {
      console.error("Error fetching missions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/?user_type=employee`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchInterns = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/?user_type=intern`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch interns");
      }

      const data = await response.json();
      setInterns(data);
    } catch (error) {
      console.error("Error fetching interns:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewMission({
      ...newMission,
      [name]: name === "assigned_to" || name === "supervisor" ? parseInt(value) : value,
    });
  };

  const { showAlert } = useAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    // Vérifier si la date limite est dans le passé
    const deadlineDate = new Date(newMission.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates

    if (deadlineDate < today) {
      showAlert("La date limite ne peut pas être dans le passé. Veuillez choisir une date future.", "Erreur de date", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/missions/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMission),
      });

      if (!response.ok) {
        throw new Error("Failed to create mission");
      }

      // Reset form and fetch updated missions
      setNewMission({
        title: "",
        description: "",
        deadline: "",
        assigned_to: 0,
        attachment_link: "",
      });
      setShowNewMissionForm(false);
      fetchMissions();
    } catch (error) {
      console.error("Error creating mission:", error);
      showAlert("Échec de la création de la mission. Veuillez réessayer.", "Erreur", "error");
    }
  };

  const [viewingMission, setViewingMission] = useState<Mission | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const handleViewMission = (id: number) => {
    // Trouver la mission dans la liste
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;

    // Afficher les détails de la mission dans une modale
    setViewingMission(mission);
    setShowViewModal(true);
  };

  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const handleEditMission = async (id: number) => {
    if (!token) return;

    // Trouver la mission dans la liste
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;

    // Ouvrir le formulaire d'édition avec les données de la mission
    setEditingMission(mission);
    setShowEditForm(true);
  };

  const handleUpdateMission = async () => {
    if (!token || !editingMission) return;

    // Vérifier si la date limite est dans le passé
    const deadlineDate = new Date(editingMission.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates

    if (deadlineDate < today) {
      showAlert("La date limite ne peut pas être dans le passé. Veuillez choisir une date future.", "Erreur de date", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/missions/${editingMission.id}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editingMission.title,
          description: editingMission.description,
          deadline: editingMission.deadline,
          assigned_to: editingMission.assigned_to || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update mission");
      }

      // Fermer le formulaire et rafraîchir la liste
      setShowEditForm(false);
      setEditingMission(null);
      fetchMissions();
      showAlert("Mission mise à jour avec succès", "Succès", "success");
    } catch (error) {
      console.error("Error updating mission:", error);
      showAlert("Échec de la mise à jour de la mission. Veuillez réessayer.", "Erreur", "error");
    }
  };

  const [deletingMissionId, setDeletingMissionId] = useState<number | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const handleDeleteMission = (id: number) => {
    if (!token) return;

    // Afficher la modale de confirmation
    setDeletingMissionId(id);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteMission = async () => {
    if (!token || !deletingMissionId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/missions/${deletingMissionId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete mission");
      }

      // Fermer la modale et rafraîchir la liste
      setShowDeleteConfirmModal(false);
      setDeletingMissionId(null);
      fetchMissions();
      showAlert("Mission supprimée avec succès", "Succès", "success");
    } catch (error) {
      console.error("Error deleting mission:", error);
      showAlert("Échec de la suppression de la mission. Veuillez réessayer.", "Erreur", "error");
    }
  };

  const handleCompleteMission = (id: number) => {
    if (!token) return;

    // Trouver la mission dans la liste
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;

    // Ouvrir le formulaire de confirmation
    setCompletingMission(mission);
    setCompletionLink("");
    setShowCompletionForm(true);
  };

  const submitCompleteMission = async () => {
    if (!token || !completingMission) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/missions/${completingMission.id}/complete_mission/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completion_link: completionLink
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to complete mission");
      }

      const data = await response.json();

      // Fermer le formulaire et rafraîchir la liste
      setShowCompletionForm(false);
      setCompletingMission(null);
      setCompletionLink("");
      fetchMissions();

      // Afficher un message de succès avec les informations de durée et de congé
      let message = "Mission marquée comme complétée";
      if (data.work_duration) {
        message += `\nDurée de travail: ${data.work_duration}`;
      }
      if (data.leave_added) {
        message += "\nUn jour de congé a été ajouté à votre solde.";
      }

      showAlert(message, "Mission complétée", "success");
    } catch (error) {
      console.error("Error completing mission:", error);
      showAlert("Échec de la complétion de la mission. Veuillez réessayer.", "Erreur", "error");
    }
  };

  const handleApplyPenalty = async (id: number) => {
    if (!token) return;

    // Trouver la mission dans la liste
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;

    // S'assurer que la mission est marquée comme "late" dans le backend
    try {
      // Mettre à jour le statut de la mission dans le backend
      const updateResponse = await fetch(`${API_BASE_URL}/missions/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "late"
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update mission status");
      }

      // Ouvrir le formulaire de pénalité
      setPenaltyMission(mission);
      setPenaltyDays(1);
      setShowPenaltyForm(true);
    } catch (error) {
      console.error("Error updating mission status:", error);
      showAlert(
        "Échec de la mise à jour du statut de la mission. Veuillez réessayer.",
        "Erreur",
        "error"
      );
    }
  };

  const submitApplyPenalty = async () => {
    if (!token || !penaltyMission) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/missions/${penaltyMission.id}/apply_penalty/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            penalty_days: penaltyDays
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to apply penalty");
      }

      const data = await response.json();

      // Fermer le formulaire et rafraîchir la liste
      setShowPenaltyForm(false);
      setPenaltyMission(null);
      setPenaltyDays(1);
      fetchMissions();

      // Afficher un message de succès
      showAlert(
        `Pénalité de ${data.penalty_days} jour(s) appliquée avec succès. Nouveau solde de congés : ${data.new_leave_balance} jour(s).`,
        "Pénalité appliquée",
        "success"
      );
    } catch (error) {
      console.error("Error applying penalty:", error);
      showAlert(
        error instanceof Error ? error.message : "Échec de l'application de la pénalité. Veuillez réessayer.",
        "Erreur",
        "error"
      );
    }
  };

  const getMissionStatusBadge = (mission: Mission) => {
    if (mission.completed || mission.status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completed
        </span>
      );
    } else if (mission.status === 'late') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Late
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading missions..." />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <BackButton to="/admine" label="Back to Dashboard" />
        <h1 className="text-2xl font-semibold text-gray-900 ml-4">
          Mission Management
        </h1>
      </div>

      {/* Onglets pour filtrer les missions */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'employees'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('employees')}
        >
          Employee Missions
        </button>
        <button
          type="button"
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'interns'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('interns')}
        >
          Intern Missions
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            {activeTab === 'employees' ? 'Employee Missions' : 'Intern Missions'}
          </h2>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowNewMissionForm(true)}
          >
            New Mission
          </Button>
        </div>

        {missions.filter(mission => mission.assignee_type === activeTab).length === 0 ? (
          <div className="p-6 text-center">
            <ClipboardListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab === 'employees' ? 'employee' : 'intern'} missions found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new mission for {activeTab === 'employees' ? 'an employee' : 'an intern'}.
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
                    Title
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Assigned To
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Deadline
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
                {missions
                  .filter(mission => mission.assignee_type === activeTab)
                  .map((mission) => (
                  <tr key={mission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {mission.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {mission.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {mission.user_details
                          ? `${mission.user_details.first_name} ${mission.user_details.last_name}`
                          : mission.assigned_to
                          ? `User #${mission.assigned_to}`
                          : mission.user
                          ? `User #${mission.user}`
                          : "Non assigné"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(mission.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getMissionStatusBadge(mission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewMission(mission.id)}
                        >
                          View
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleEditMission(mission.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteMission(mission.id)}
                        >
                          Delete
                        </Button>
                        {(mission.status === "pending" || mission.status === "late") && !mission.completed && (
                          <Button
                            variant="success"
                            size="sm"
                            icon={<CheckIcon className="h-4 w-4" />}
                            onClick={() => handleCompleteMission(mission.id)}
                          >
                            Complete
                          </Button>
                        )}

                        {mission.status === "late" && !mission.completed && mission.user_details?.user_type === "employee" && (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<AlertTriangleIcon className="h-4 w-4" />}
                            onClick={() => handleApplyPenalty(mission.id)}
                          >
                            Penalty
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Mission Form Modal */}
      {showNewMissionForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">New Mission</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowNewMissionForm(false)}
                title="Close form"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <TextInput
                  label="Title"
                  name="title"
                  value={newMission.title}
                  onChange={handleInputChange}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newMission.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter mission description"
                    required
                  />
                </div>

                <TextInput
                  label="Deadline"
                  name="deadline"
                  type="date"
                  value={newMission.deadline}
                  onChange={handleInputChange}
                  required
                />

                <div>
                  <label
                    htmlFor="assigned-to-select"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Assign To
                  </label>
                  <select
                    id="assigned-to-select"
                    name="assigned_to"
                    value={newMission.assigned_to || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="">
                      {activeTab === 'employees' ? 'Select an employee' : 'Select an intern'}
                    </option>
                    {(activeTab === 'employees' ? employees : interns).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <TextInput
                  label="Attachment Link (Optional)"
                  name="attachment_link"
                  type="text"
                  value={newMission.attachment_link}
                  onChange={handleInputChange}
                  placeholder="Google Drive or GitHub link"
                  helperText="Add a link to a Google Drive document or GitHub repository"
                />
              </div>

              <div className="mt-5 sm:mt-6 flex space-x-2">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={() => setShowNewMissionForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  type="submit"
                >
                  Create Mission
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Mission Form Modal */}
      {showEditForm && editingMission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Mission</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowEditForm(false)}
                title="Close form"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <TextInput
                label="Title"
                name="title"
                value={editingMission.title}
                onChange={(e) => setEditingMission({...editingMission, title: e.target.value})}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editingMission.description}
                  onChange={(e) => setEditingMission({...editingMission, description: e.target.value})}
                  rows={3}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter mission description"
                  required
                />
              </div>

              <TextInput
                label="Deadline"
                name="deadline"
                type="date"
                value={editingMission.deadline}
                onChange={(e) => setEditingMission({...editingMission, deadline: e.target.value})}
                required
              />

              <div>
                <label
                  htmlFor="edit-assigned-to-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Assign To
                </label>
                <select
                  id="edit-assigned-to-select"
                  name="assigned_to"
                  value={editingMission.assigned_to || ""}
                  onChange={(e) => setEditingMission({...editingMission, assigned_to: parseInt(e.target.value)})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">
                    {activeTab === 'employees' ? 'Select an employee' : 'Select an intern'}
                  </option>
                  {(activeTab === 'employees' ? employees : interns).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 flex space-x-2">
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => setShowEditForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleUpdateMission}
              >
                Update Mission
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Mission Form Modal */}
      {showCompletionForm && completingMission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Complete Mission</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowCompletionForm(false)}
                title="Close form"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-gray-900">{completingMission.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{completingMission.description}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Deadline:</span>
                  <span className="text-sm text-gray-900">{new Date(completingMission.deadline).toLocaleDateString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Time to complete:</span>
                  <span className="text-sm text-gray-900">
                    {Math.ceil((new Date().getTime() - new Date(completingMission.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>

              <TextInput
                label="GitHub or Google Drive Link (Optional)"
                name="completion_link"
                type="text"
                value={completionLink}
                onChange={(e) => setCompletionLink(e.target.value)}
                placeholder="Enter link to your work"
                helperText="Provide a link to your GitHub repository or Google Drive folder"
              />

              {completingMission.user_details && completingMission.user_details.user_type === 'employee' && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Note:</span> Completing this mission will add 1 day to your leave balance.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 sm:mt-6 flex space-x-2">
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => setShowCompletionForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                size="md"
                className="w-full"
                onClick={submitCompleteMission}
              >
                Complete Mission
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Penalty Form Modal */}
      {showPenaltyForm && penaltyMission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Apply Penalty</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowPenaltyForm(false)}
                title="Close form"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-gray-900">{penaltyMission.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{penaltyMission.description}</p>
              </div>

              <div className="bg-red-50 p-3 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-red-700">Deadline:</span>
                  <span className="text-sm text-red-700">{new Date(penaltyMission.deadline).toLocaleDateString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium text-red-700">Status:</span>
                  <span className="text-sm text-red-700">
                    Late
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium text-red-700">Assigned to:</span>
                  <span className="text-sm text-red-700">
                    {penaltyMission.user_details ? `${penaltyMission.user_details.first_name} ${penaltyMission.user_details.last_name}` : 'Unknown'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Penalty Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={penaltyDays}
                  onChange={(e) => setPenaltyDays(parseInt(e.target.value) || 1)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter penalty days"
                  title="Penalty Days Input"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of leave days to deduct from the employee's balance
                </p>
              </div>

              <div className="bg-yellow-50 p-3 rounded-md">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Warning:</span> This action will deduct leave days from the employee's balance and cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 flex space-x-2">
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => setShowPenaltyForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                className="w-full"
                onClick={submitApplyPenalty}
              >
                Apply Penalty
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Mission Modal */}
      {showViewModal && viewingMission && (
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title="Détails de la mission"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Titre</h4>
              <p className="mt-1">{viewingMission.title}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1">{viewingMission.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Date d'échéance</h4>
              <p className="mt-1">{new Date(viewingMission.deadline).toLocaleDateString()}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Statut</h4>
              <p className="mt-1">{viewingMission.status || 'En attente'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Assigné à</h4>
              <p className="mt-1">
                {viewingMission.user_details
                  ? `${viewingMission.user_details.first_name} ${viewingMission.user_details.last_name}`
                  : 'Non assigné'}
              </p>
            </div>
            <div className="pt-4 flex justify-end">
              <Button variant="primary" onClick={() => setShowViewModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <Modal
          isOpen={showDeleteConfirmModal}
          onClose={() => setShowDeleteConfirmModal(false)}
          title="Confirmer la suppression"
          size="sm"
        >
          <div className="space-y-4">
            <p>Êtes-vous sûr de vouloir supprimer cette mission ?</p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                Annuler
              </Button>
              <Button variant="danger" onClick={confirmDeleteMission}>
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MissionManagement;
