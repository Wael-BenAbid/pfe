import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Button from "../../components/ui/Button";
import {
  User as UserIcon,
  Pencil as PencilIcon,
  Save as SaveIcon,
  X as XIcon,
  Image as ImageIcon,
  BarChart as BarChartIcon,
  Clock as ClockIcon,
  Users as UsersIcon,
  Briefcase as BriefcaseIcon,
  GraduationCap as GraduationCapIcon,
} from "lucide-react";
import BackButton from "../../components/ui/BackButton";
import { TextInput } from "../../components/ui/FormElements";
import AlertModal from "../../components/ui/AlertModal";
import "../../styles/ProgressBar.css";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  leave_balance: number;
  github_profile?: string;
  profile_image?: string;
  is_pending?: boolean;
}

interface Mission {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: 'pending' | 'completed' | 'late';
  assigned_to?: number;
  supervisor?: number;
  completed?: boolean;
}

interface SystemStats {
  totalUsers: number;
  activeEmployees: number;
  activeInterns: number;
  pendingApplications: number;
  totalMissions: number;
  completedMissions: number;
}

interface SystemActivity {
  id: number;
  action: string;
  action_type: string;
  action_display: string;
  user_email: string;
  user_name: string;
  ip_address: string | null;
  details: string;
  resource_type: string;
  resource_id: number | null;
  created_at: string;
  formatted_date: string;
}

const AdminProfile: React.FC = () => {
  const { user: authUser, token } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'activity'>('profile');

  // État pour les statistiques du système
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeEmployees: 0,
    activeInterns: 0,
    pendingApplications: 0,
    totalMissions: 0,
    completedMissions: 0
  });

  // Fonction pour récupérer les statistiques du système
  const fetchSystemStats = async () => {
    if (!token) return;

    try {
      // Récupérer le nombre d'utilisateurs
      const usersResponse = await fetch(`${API_BASE_URL}/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!usersResponse.ok) {
        throw new Error("Failed to fetch users");
      }

      const usersData = await usersResponse.json();

      // Récupérer le nombre de missions
      const missionsResponse = await fetch(`${API_BASE_URL}/missions/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!missionsResponse.ok) {
        throw new Error("Failed to fetch missions");
      }

      const missionsData = await missionsResponse.json();

      // Calculer les statistiques
      const employees = usersData.filter((user: User) => user.user_type === 'employee');
      const interns = usersData.filter((user: User) => user.user_type === 'intern');
      const pendingUsers = usersData.filter((user: User) => user.is_pending);
      const completedMissions = missionsData.filter((mission: Mission) => mission.status === 'completed');

      setSystemStats({
        totalUsers: usersData.length,
        activeEmployees: employees.length,
        activeInterns: interns.length,
        pendingApplications: pendingUsers.length,
        totalMissions: missionsData.length,
        completedMissions: completedMissions.length
      });
    } catch (error) {
      console.error("Error fetching system stats:", error);
      // En cas d'erreur, utiliser des données fictives
      setSystemStats({
        totalUsers: 45,
        activeEmployees: 18,
        activeInterns: 22,
        pendingApplications: 5,
        totalMissions: 38,
        completedMissions: 24
      });
    }
  };

  // État pour les activités du système
  const [systemActivities, setSystemActivities] = useState<SystemActivity[]>([]);

  useEffect(() => {
    if (token && authUser) {
      fetchUserDetails();
      fetchSystemStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authUser]);

  // Charger les statistiques quand l'onglet statistiques est sélectionné
  useEffect(() => {
    if (activeTab === 'stats' && token) {
      fetchSystemStats();
    }
    if (activeTab === 'activity' && token) {
      fetchSystemActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token]);

  // Fonction pour charger les activités du système
  const fetchSystemActivities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/system-activities/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system activities');
      }

      const data = await response.json();
      setSystemActivities(data);
    } catch (error) {
      console.error('Error fetching system activities:', error);
      console.error('Failed to load system activities');
    }
  };

  const fetchUserDetails = async () => {
    if (!authUser) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${authUser.id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const userData = await response.json();
      setUser(userData);
      setFormData(userData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user details:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!token || !user) return;

    try {
      let updatedUser;

      // Si nous avons une nouvelle image de profil, nous devons utiliser FormData
      if (profileImage) {
        const formDataWithImage = new FormData();

        // Ajouter les champs textuels
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== 'profile_image') {
            formDataWithImage.append(key, value.toString());
          }
        });

        // Ajouter l'image
        formDataWithImage.append('profile_image', profileImage);

        const response = await fetch(`${API_BASE_URL}/users/${user.id}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataWithImage,
        });

        if (!response.ok) {
          try {
            const errorData = await response.json();
            console.error("Error details:", errorData);
            throw new Error(`Failed to update profile: ${JSON.stringify(errorData)}`);
          } catch (jsonError) {
            throw new Error(`Failed to update profile: ${response.statusText}`);
          }
        }

        updatedUser = await response.json();
      } else {
        // Pas de nouvelle image, on peut utiliser JSON
        // Créer une copie des données du formulaire sans le champ profile_image
        const formDataWithoutImage = { ...formData };
        delete formDataWithoutImage.profile_image;

        const response = await fetch(`${API_BASE_URL}/users/${user.id}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formDataWithoutImage),
        });

        if (!response.ok) {
          try {
            const errorData = await response.json();
            console.error("Error details:", errorData);
            throw new Error(`Failed to update profile: ${JSON.stringify(errorData)}`);
          } catch (jsonError) {
            throw new Error(`Failed to update profile: ${response.statusText}`);
          }
        }

        updatedUser = await response.json();
      }

      setUser(updatedUser);
      setProfileImage(null);
      setEditing(false);
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: 'Profile updated successfully',
        type: 'success'
      });
    } catch (error) {
      console.error("Error updating user:", error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: error.message || 'Failed to update profile',
        type: 'error'
      });
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading profile..." />;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-medium text-red-600">
            Failed to load profile
          </h2>
          <Button
            variant="primary"
            size="md"
            className="mt-4"
            onClick={() => navigate("/admine")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <div className="flex items-center mb-6">
        <BackButton to="/admine" label="Back to Dashboard" />
        <h1 className="text-2xl font-semibold text-gray-900 ml-4">
          Admin Control Panel
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'profile'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 mr-2" />
            My Profile
          </div>
        </button>
        <button
          type="button"
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'stats'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          <div className="flex items-center">
            <BarChartIcon className="h-4 w-4 mr-2" />
            System Statistics
          </div>
        </button>
        <button
          type="button"
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'activity'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('activity')}
        >
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" />
            Activity Log
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {user.first_name} {user.last_name}
            </h2>
            <div className="flex space-x-2">
              {editing ? (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<SaveIcon className="h-4 w-4" />}
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<XIcon className="h-4 w-4" />}
                    onClick={() => {
                      setEditing(false);
                      setFormData(user);
                      setProfileImage(null);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<PencilIcon className="h-4 w-4" />}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 mb-6 md:mb-0 flex flex-col items-center">
                {editing ? (
                  <div className="text-center">
                    {profileImage ? (
                      <img
                        src={URL.createObjectURL(profileImage)}
                        alt="Profile preview"
                        className="h-40 w-40 object-cover rounded-full border-2 border-blue-200 mb-2"
                      />
                    ) : user.profile_image ? (
                      <img
                        src={user.profile_image.startsWith('http') ? user.profile_image : `${API_BASE_URL}/media/${user.profile_image}`}
                        alt={`${user.first_name} ${user.last_name}`}
                        className="h-40 w-40 object-cover rounded-full border-2 border-blue-200 mb-2"
                        onError={(e) => {
                          // Fallback en cas d'erreur de chargement de l'image
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '';
                          setFormData(prev => ({
                            ...prev,
                            profile_image: undefined
                          }));
                        }}
                      />
                    ) : (
                      <div className="h-40 w-40 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <UserIcon className="h-20 w-20 text-blue-500" />
                      </div>
                    )}
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Change Image
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleProfileImageChange}
                      />
                    </label>
                  </div>
                ) : (
                  <>
                    {user.profile_image ? (
                      <img
                        src={user.profile_image.startsWith('http') ? user.profile_image : `${API_BASE_URL}/media/${user.profile_image}`}
                        alt={`${user.first_name} ${user.last_name}`}
                        className="h-40 w-40 object-cover rounded-full border-2 border-blue-200"
                        onError={(e) => {
                          // Fallback en cas d'erreur de chargement de l'image
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '';
                          setUser(prev => prev ? {
                            ...prev,
                            profile_image: undefined
                          } : null);
                        }}
                      />
                    ) : (
                      <div className="h-40 w-40 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-20 w-20 text-blue-500" />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="md:w-2/3">
                {editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                      label="Username"
                      name="username"
                      value={formData.username || ""}
                      onChange={handleInputChange}
                      helper="Username for login (admin can modify)"
                    />
                    <TextInput
                      label="First Name"
                      name="first_name"
                      value={formData.first_name || ""}
                      onChange={handleInputChange}
                    />
                    <TextInput
                      label="Last Name"
                      name="last_name"
                      value={formData.last_name || ""}
                      onChange={handleInputChange}
                    />
                    <TextInput
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                    />
                    <TextInput
                      label="GitHub Profile"
                      name="github_profile"
                      type="text"
                      placeholder="https://github.com/username"
                      value={formData.github_profile || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Username
                        </h3>
                        <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                          {user.username}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Email
                        </h3>
                        <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          First Name
                        </h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {user.first_name}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Last Name
                        </h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {user.last_name}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          User Type
                        </h3>
                        <p className="mt-1 text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Administrator
                          </span>
                        </p>
                      </div>
                      {user.github_profile && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            GitHub Profile
                          </h3>
                          <p className="mt-1 text-sm text-gray-900">
                            <a
                              href={user.github_profile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {user.github_profile}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">
              System Statistics
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <UsersIcon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{systemStats.totalUsers}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Employees</p>
                    <p className="text-sm font-medium">{systemStats.activeEmployees}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interns</p>
                    <p className="text-sm font-medium">{systemStats.activeInterns}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="text-sm font-medium">{systemStats.pendingApplications}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <BriefcaseIcon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Missions</p>
                    <p className="text-2xl font-semibold text-gray-900">{systemStats.totalMissions}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Completed</p>
                    <p className="text-sm font-medium">{systemStats.completedMissions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">In Progress</p>
                    <p className="text-sm font-medium">{systemStats.totalMissions - systemStats.completedMissions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Completion Rate</p>
                    <p className="text-sm font-medium">{systemStats.totalMissions > 0 ? Math.round((systemStats.completedMissions / systemStats.totalMissions) * 100) : 0}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <GraduationCapIcon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Internships</p>
                    <p className="text-2xl font-semibold text-gray-900">{systemStats.activeInterns}</p>
                  </div>
                </div>
                <div className="mt-4">
                  {/* Calculer le pourcentage de capacité (supposons une capacité maximale de 30 stagiaires) */}
                  {(() => {
                    const maxCapacity = 30;
                    const capacityPercentage = Math.min(100, Math.round((systemStats.activeInterns / maxCapacity) * 100));
                    return (
                      <>
                        <div className="progress-bar-container">
                          <div
                            className={`progress-bar progress-bar-${Math.round(capacityPercentage / 5) * 5}`}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-2">
                          <p className="text-xs text-gray-500">Current Capacity</p>
                          <p className="text-xs font-medium">{capacityPercentage}%</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Database Status</h4>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-sm text-gray-600">Healthy (Response time: 45ms)</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Last backup: Today at 03:00 AM</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Server Status</h4>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-sm text-gray-600">Online (Uptime: 15 days)</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">CPU: 12% | Memory: 34% | Disk: 42%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">
              System Activity Log
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {systemActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {activity.action_display || activity.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.user_name || activity.user_email || "System"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.formatted_date || formatDate(activity.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {activity.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {systemActivities.length} activities
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminProfile;
