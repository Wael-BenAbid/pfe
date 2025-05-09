import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { UsersIcon, UserIcon, SearchIcon, ClockIcon, TrashIcon } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  leave_balance: number;
  profile_image?: string;
}

const UserManagement: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  useEffect(() => {
    // Check if there's a filter parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam && ['all', 'employee', 'intern', 'admin'].includes(filterParam)) {
      setFilterType(filterParam);
    } else {
      // Par défaut, afficher tous les utilisateurs
      setFilterType('all');
    }

    fetchUsers();
  }, [token, filterType]);

  // Effet pour filtrer les utilisateurs en fonction du terme de recherche
  useEffect(() => {
    if (!users) return;

    // Filtrer les utilisateurs en fonction du terme de recherche
    const filtered = users.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = user.email.toLowerCase();
      const username = user.username.toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      return fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             username.includes(searchLower);
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    if (!token) return;

    try {
      let url = `${API_BASE_URL}/users/`;
      if (filterType !== "all") {
        url += `?user_type=${filterType}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data); // Initialiser les utilisateurs filtrés avec tous les utilisateurs
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Admin
          </span>
        );
      case "employee":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Employee
          </span>
        );
      case "intern":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Intern
          </span>
        );
      default:
        return null;
    }
  };

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    // Update URL without reloading the page
    const url = new URL(window.location.href);
    url.searchParams.set('filter', type);
    window.history.pushState({}, '', url.toString());
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!token) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      return;
    }

    setDeletingUserId(userId);

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Supprimer l'utilisateur de la liste locale
        setUsers(users.filter(user => user.id !== userId));
        alert("Utilisateur supprimé avec succès");
      } else {
        const errorData = await response.json();
        alert(`Erreur lors de la suppression : ${errorData.detail || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Une erreur s'est produite lors de la suppression de l'utilisateur");
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading users..." />;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        User Management
      </h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">
              {filterType === "all"
                ? "All Users"
                : filterType === "employee"
                  ? "Employees"
                  : filterType === "intern"
                    ? "Interns"
                    : "Admins"}
            </h2>
            <div className="flex space-x-2">
              <Button
                variant={filterType === "all" ? "primary" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("all")}
              >
                All
              </Button>
              <Button
                variant={filterType === "employee" ? "primary" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("employee")}
              >
                Employees
              </Button>
              <Button
                variant={filterType === "intern" ? "primary" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("intern")}
              >
                Interns
              </Button>
              <Button
                variant={filterType === "admin" ? "primary" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("admin")}
              >
                Admins
              </Button>
            </div>
          </div>

          {/* Champ de recherche */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No users found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? `No users matching "${searchTerm}" found.`
                : filterType === "all"
                  ? "No users found in the system."
                  : `No ${filterType}s found.`}
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
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Leave Balance
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
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.profile_image ? (
                          <img
                            src={user.profile_image.startsWith('http') ? user.profile_image : `${API_BASE_URL}/media/${user.profile_image}`}
                            alt={`${user.first_name} ${user.last_name}`}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center';
                                fallback.innerHTML = `<span class="text-blue-800 font-semibold">
                                  ${user.first_name ? user.first_name.charAt(0) : user.username.charAt(0)}
                                  ${user.last_name ? user.last_name.charAt(0) : ""}
                                </span>`;
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-800 font-semibold">
                              {user.first_name
                                ? user.first_name.charAt(0)
                                : user.username.charAt(0)}
                              {user.last_name ? user.last_name.charAt(0) : ""}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUserTypeBadge(user.user_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.user_type === "intern" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          N/A
                        </span>
                      ) : (
                        `${user.leave_balance} days`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<UserIcon className="h-4 w-4" />}
                          onClick={() =>
                            window.open(`/admin/user/${user.id}`, "_blank")
                          }
                        >
                          View
                        </Button>
                        {user.user_type !== "intern" && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<ClockIcon className="h-4 w-4" />}
                            onClick={() =>
                              window.open(
                                `/admin/user/${user.id}/work-hours`,
                                "_blank"
                              )
                            }
                          >
                            Hours
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<TrashIcon className="h-4 w-4" />}
                          onClick={() => handleDeleteUser(user.id)}
                          isLoading={deletingUserId === user.id}
                          disabled={deletingUserId !== null}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
