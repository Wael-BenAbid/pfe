import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { UsersIcon, UserIcon } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  leave_balance: number;
  profile_image?: string;
  total_hours_worked?: number;
}

interface WorkHour {
  id: number;
  date: string;
  hours_worked: number;
  description?: string;
  created_at: string;
  user: number;
}

const InternManagementAdmin: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("intern");

  useEffect(() => {
    // Check if there's a filter parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam && ['employee', 'intern', 'admin'].includes(filterParam)) {
      setFilterType(filterParam);
    } else {
      // Par défaut, afficher uniquement les stagiaires
      setFilterType('intern');
    }

    fetchUsers();
  }, [token, filterType]);

  const fetchUsers = async () => {
    if (!token) return;

    try {
      let url = `${API_BASE_URL}/api/users/`;
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

      // Les stagiaires n'ont pas d'heures de travail, donc on ajoute simplement 0 comme total
      const usersWithWorkHours = data.map((user: User) => {
        return {
          ...user,
          total_hours_worked: 0
        };
      });

      setUsers(usersWithWorkHours);
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

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading users..." />;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        {filterType === "employee"
          ? "Employee Management"
          : filterType === "intern"
            ? "Intern Management"
            : filterType === "admin"
              ? "Admin Management"
              : "User Management"}
      </h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h2 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">
              {filterType === "all"
                ? "All Users"
                : filterType === "employee"
                  ? "Employees"
                  : filterType === "intern"
                    ? "Interns"
                    : "Admins"}
            </h2>
            {/* Pas de boutons de filtrage ici */}
          </div>
        </div>

        {users.length === 0 ? (
          <div className="p-6 text-center">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No users found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {`No ${filterType}s found.`}
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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.profile_image ? (
                          <img
                            src={user.profile_image.startsWith('http') ? user.profile_image : `${API_BASE_URL}/media/${user.profile_image}`}
                            alt={`${user.first_name || user.username}'s profile`}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              // Fallback en cas d'erreur de chargement de l'image
                              e.currentTarget.onerror = null;
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.querySelector('.fallback-avatar')!.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center fallback-avatar">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<UserIcon className="h-4 w-4" />}
                          onClick={() =>
                            window.open(`/admine/user/${user.id}`, "_blank")
                          }
                        >
                          View Profile
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

export default InternManagementAdmin;
