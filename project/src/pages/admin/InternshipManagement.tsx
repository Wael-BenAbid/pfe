import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { PlusIcon, CheckIcon, XIcon, GraduationCapIcon } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

interface Internship {
  id: number;
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  intern: number;
  supervisor: number;
  intern_details?: {
    first_name: string;
    last_name: string;
  };
  supervisor_details?: {
    first_name: string;
    last_name: string;
  };
}

const InternshipManagement: React.FC = () => {
  const { token } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [interns, setInterns] = useState<User[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewInternshipForm, setShowNewInternshipForm] = useState(false);
  const [newInternship, setNewInternship] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    intern: 0,
    supervisor: 0,
  });

  useEffect(() => {
    fetchInternships();
    fetchInterns();
    fetchEmployees();
  }, [token]);

  const fetchInternships = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/internships/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch internships");
      }

      const data = await response.json();

      // Fetch user details for each internship
      const internshipsWithUserDetails = await Promise.all(
        data.map(async (internship: Internship) => {
          try {
            // Fetch intern details
            const internResponse = await fetch(
              `${API_BASE_URL}/users/${internship.intern}/`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            let internDetails;
            if (internResponse.ok) {
              const internData = await internResponse.json();
              internDetails = {
                first_name: internData.first_name,
                last_name: internData.last_name,
              };
            }

            // Fetch supervisor details
            const supervisorResponse = await fetch(
              `${API_BASE_URL}/users/${internship.supervisor}/`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            let supervisorDetails;
            if (supervisorResponse.ok) {
              const supervisorData = await supervisorResponse.json();
              supervisorDetails = {
                first_name: supervisorData.first_name,
                last_name: supervisorData.last_name,
              };
            }

            return {
              ...internship,
              intern_details: internDetails,
              supervisor_details: supervisorDetails,
            };
          } catch (error) {
            console.error(
              `Error fetching user details for internship ${internship.id}:`,
              error
            );
            return internship;
          }
        })
      );

      setInternships(internshipsWithUserDetails);
    } catch (error) {
      console.error("Error fetching internships:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterns = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/?user_type=intern`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch interns");
      }

      const data = await response.json();
      setInterns(data);
    } catch (error) {
      console.error("Error fetching interns:", error);
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

    // Pour les champs intern et supervisor, vérifier que la valeur n'est pas vide
    if ((name === "intern" || name === "supervisor") && value === "") {
      setNewInternship({
        ...newInternship,
        [name]: 0, // Valeur par défaut
      });
    } else {
      setNewInternship({
        ...newInternship,
        [name]:
          name === "intern" || name === "supervisor" ? parseInt(value) : value,
      });
    }

    // Log pour le débogage
    console.log(`Field ${name} changed to:`, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    // Vérifier que les champs obligatoires sont remplis
    if (!newInternship.title || !newInternship.start_date || !newInternship.end_date ||
        !newInternship.intern || !newInternship.supervisor) {
      console.error("Missing required fields:", newInternship);
      alert("Please fill in all required fields");
      return;
    }

    // Log des données avant envoi
    console.log("Submitting internship data:", {
      ...newInternship,
      status: "ongoing",
    });

    try {
      const response = await fetch(`${API_BASE_URL}/internships/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newInternship,
          status: "ongoing",
        }),
      });

      // Log de la réponse
      console.log("Response status:", response.status);
      const responseData = await response.json().catch(() => ({}));
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(`Failed to create internship: ${JSON.stringify(responseData)}`);
      }

      // Reset form and fetch updated internships
      setNewInternship({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        intern: 0,
        supervisor: 0,
      });
      setShowNewInternshipForm(false);
      fetchInternships();

      // Afficher un message de succès
      alert("Internship created successfully!");
    } catch (error) {
      console.error("Error creating internship:", error);
      alert("Failed to create internship. Please try again.");
    }
  };

  const handleChangeStatus = async (id: number, status: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/internships/${id}/change_status/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to change internship status to ${status}`);
      }

      // Fetch updated internships
      fetchInternships();
    } catch (error) {
      console.error("Error changing internship status:", error);
      alert("Failed to change internship status. Please try again.");
    }
  };

  const getInternshipStatusBadge = (status: string) => {
    switch (status) {
      case "ongoing":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Ongoing
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading internships..." />;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Internship Management
      </h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">All Internships</h2>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowNewInternshipForm(true)}
          >
            New Internship
          </Button>
        </div>

        {internships.length === 0 ? (
          <div className="p-6 text-center">
            <GraduationCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No internships found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new internship.
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
                    Intern
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Supervisor
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
                {internships.map((internship) => (
                  <tr key={internship.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {internship.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {internship.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {internship.intern_details
                          ? `${internship.intern_details.first_name} ${internship.intern_details.last_name}`
                          : `Intern #${internship.intern}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {internship.supervisor_details
                          ? `${internship.supervisor_details.first_name} ${internship.supervisor_details.last_name}`
                          : `Supervisor #${internship.supervisor}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(internship.start_date).toLocaleDateString()} -{" "}
                      {new Date(internship.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getInternshipStatusBadge(internship.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {internship.status === "ongoing" && (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="success"
                            size="sm"
                            icon={<CheckIcon className="h-4 w-4" />}
                            onClick={() =>
                              handleChangeStatus(internship.id, "completed")
                            }
                          >
                            Complete
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<XIcon className="h-4 w-4" />}
                            onClick={() =>
                              handleChangeStatus(internship.id, "cancelled")
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Internship Form Modal */}
      {showNewInternshipForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                New Internship
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowNewInternshipForm(false)}
                aria-label="Close"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <TextInput
                  label="Title"
                  name="title"
                  value={newInternship.title}
                  onChange={handleInputChange}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newInternship.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter a description"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <TextInput
                    label="Start Date"
                    name="start_date"
                    type="date"
                    value={newInternship.start_date}
                    onChange={handleInputChange}
                    required
                  />

                  <TextInput
                    label="End Date"
                    name="end_date"
                    type="date"
                    value={newInternship.end_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="intern"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Intern
                  </label>
                  <select
                    id="intern"
                    name="intern"
                    value={newInternship.intern || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    required
                    aria-describedby="intern-help"
                  >
                    <option value="">Select an intern</option>
                    {interns.map((intern) => (
                      <option key={intern.id} value={intern.id}>
                        {intern.first_name} {intern.last_name}
                      </option>
                    ))}
                  </select>
                  <p id="intern-help" className="mt-1 text-xs text-gray-500">
                    Sélectionnez l'interne concerné
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supervisor
                  </label>
                  <label htmlFor="supervisor" className="sr-only">
                    Select a supervisor
                  </label>
                  <select
                    id="supervisor"
                    name="supervisor"
                    value={newInternship.supervisor || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    required
                    title="Select a supervisor"
                  >
                    <option value="">Select a supervisor</option>
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
                  onClick={() => setShowNewInternshipForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  type="submit"
                >
                  Create Internship
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipManagement;
