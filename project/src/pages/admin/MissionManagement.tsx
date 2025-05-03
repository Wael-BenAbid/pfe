import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { PlusIcon, CheckIcon, XIcon, ClipboardListIcon } from "lucide-react";

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
  status?: string;
  deadline: string;
  assigned_to: number;
  user?: number; // Pour la compatibilité avec l'ancien code
  user_details?: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
  completed: boolean;
}

const MissionManagement: React.FC = () => {
  const { token } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMissionForm, setShowNewMissionForm] = useState(false);
  const [newMission, setNewMission] = useState({
    title: "",
    description: "",
    deadline: "",
    assigned_to: 0,
  });

  useEffect(() => {
    fetchMissions();
    fetchEmployees();
  }, [token]);

  const fetchMissions = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/missions/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch missions");
      }

      const data = await response.json();

      // Fetch user details for each mission
      const missionsWithUserDetails = await Promise.all(
        data.map(async (mission: Mission) => {
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
                return {
                  ...mission,
                  user_details: {
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                  },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

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
      });
      setShowNewMissionForm(false);
      fetchMissions();
    } catch (error) {
      console.error("Error creating mission:", error);
      alert("Failed to create mission. Please try again.");
    }
  };

  const handleViewMission = (id: number) => {
    // Trouver la mission dans la liste
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;

    // Afficher les détails de la mission dans une alerte (à remplacer par une modale)
    alert(`
      Titre: ${mission.title}
      Description: ${mission.description}
      Date d'échéance: ${new Date(mission.deadline).toLocaleDateString()}
      Statut: ${mission.status || 'En attente'}
      Assigné à: ${mission.user_details ? `${mission.user_details.first_name} ${mission.user_details.last_name}` : 'Non assigné'}
    `);
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
      alert("Mission mise à jour avec succès");
    } catch (error) {
      console.error("Error updating mission:", error);
      alert("Échec de la mise à jour de la mission. Veuillez réessayer.");
    }
  };

  const handleDeleteMission = async (id: number) => {
    if (!token) return;

    // Demander confirmation avant de supprimer
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette mission ?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/missions/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete mission");
      }

      // Fetch updated missions
      fetchMissions();
      alert("Mission supprimée avec succès");
    } catch (error) {
      console.error("Error deleting mission:", error);
      alert("Échec de la suppression de la mission. Veuillez réessayer.");
    }
  };

  const handleCompleteMission = async (id: number) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/missions/${id}/complete_mission/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to complete mission");
      }

      // Fetch updated missions
      fetchMissions();
      alert("Mission marquée comme complétée");
    } catch (error) {
      console.error("Error completing mission:", error);
      alert("Failed to complete mission. Please try again.");
    }
  };

  const getMissionStatusBadge = (mission: Mission) => {
    if (mission.completed) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completed
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
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Mission Management
      </h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">All Missions</h2>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowNewMissionForm(true)}
          >
            New Mission
          </Button>
        </div>

        {missions.length === 0 ? (
          <div className="p-6 text-center">
            <ClipboardListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No missions found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new mission.
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
                {missions.map((mission) => (
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
                          variant="info"
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
                        {mission.status === "pending" && (
                          <Button
                            variant="success"
                            size="sm"
                            icon={<CheckIcon className="h-4 w-4" />}
                            onClick={() => handleCompleteMission(mission.id)}
                          >
                            Complete
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
                    <option value="">Select an employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
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
                  <option value="">Select an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name}
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
    </div>
  );
};

export default MissionManagement;
