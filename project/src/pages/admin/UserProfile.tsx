import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Button from "../../components/ui/Button";
import {
  ArrowLeftIcon,
  UserIcon,
  TrashIcon,
  PencilIcon,
  SaveIcon,
  XIcon,
  ImageIcon,
} from "lucide-react";
import TextInput from "../../components/ui/TextInput";
import AlertModal from "../../components/ui/AlertModal";
import Modal from "../../components/ui/Modal";

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
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  useEffect(() => {
    if (token && userId) {
      fetchUserDetails();
    }
  }, [token, userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
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
          if (value !== undefined && value !== null) {
            formDataWithImage.append(key, value.toString());
          }
        });

        // Ajouter l'image
        formDataWithImage.append('profile_image', profileImage);

        const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataWithImage,
        });

        if (!response.ok) {
          throw new Error("Failed to update user");
        }

        updatedUser = await response.json();
      } else {
        // Pas de nouvelle image, on peut utiliser JSON
        const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to update user");
        }

        updatedUser = await response.json();
      }

      setUser(updatedUser);
      setProfileImage(null);
      setEditing(false);
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: 'User updated successfully',
        type: 'success'
      });
    } catch (error) {
      console.error("Error updating user:", error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update user',
        type: 'error'
      });
    }
  };

  const handleDeleteConfirmation = () => {
    if (!user) return;
    setConfirmDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!token || !user) return;
    setDeleting(true);
    setConfirmDeleteModal(false);

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: 'User deleted successfully',
        type: 'success'
      });

      // Navigate after a short delay to allow the user to see the success message
      setTimeout(() => {
        navigate("/admin/employees");
      }, 1500);
    } catch (error) {
      console.error("Error deleting user:", error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to delete user',
        type: 'error'
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading user profile..." />;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-medium text-red-600">User not found</h2>
          <Button
            variant="primary"
            size="md"
            className="mt-4"
            onClick={() => navigate("/admin/employees")}
          >
            Back to Employee Management
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={confirmDeleteModal}
        onClose={() => setConfirmDeleteModal(false)}
        title="Confirm Deletion"
        size="sm"
        footer={
          <div className="flex justify-end space-x-2 w-full">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-500">
          Are you sure you want to delete {user?.first_name} {user?.last_name}? This action cannot be undone.
        </p>
      </Modal>

      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeftIcon className="h-4 w-4" />}
          onClick={() => navigate("/admin/employees")}
        >
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900 ml-4">
          User Profile
        </h1>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
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
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<PencilIcon className="h-4 w-4" />}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<TrashIcon className="h-4 w-4" />}
                  onClick={handleDeleteConfirmation}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </>
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
                        e.currentTarget.style.display = 'none';
                        // Afficher l'icône utilisateur à la place
                        const iconContainer = document.createElement('div');
                        iconContainer.className = 'h-40 w-40 bg-blue-100 rounded-full flex items-center justify-center absolute top-0 left-0';
                        iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.appendChild(iconContainer);
                        }
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
                        e.currentTarget.style.display = 'none';
                        // Afficher l'icône utilisateur à la place
                        const iconContainer = document.createElement('div');
                        iconContainer.className = 'h-40 w-40 bg-blue-100 rounded-full flex items-center justify-center absolute top-0 left-0';
                        iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.appendChild(iconContainer);
                        }
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
                    label="Username"
                    name="username"
                    value={formData.username || ""}
                    onChange={handleInputChange}
                    disabled
                  />
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Type
                    </label>
                    <label
                      htmlFor="user_type"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      User Type
                    </label>
                    <select
                      id="user_type"
                      name="user_type"
                      value={formData.user_type || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, user_type: e.target.value })
                      }
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="admin">Admin</option>
                      <option value="employee">Employee</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>
                  <TextInput
                    label="Leave Balance"
                    name="leave_balance"
                    type="number"
                    value={formData.leave_balance?.toString() || "0"}
                    onChange={handleInputChange}
                  />
                  <TextInput
                    label="GitHub Profile"
                    name="github_profile"
                    type="url"
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
                        Email
                      </h3>
                      <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Username
                      </h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {user.username}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        User Type
                      </h3>
                      <p className="mt-1 text-sm text-gray-900">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.user_type === "admin"
                              ? "bg-gray-100 text-gray-800"
                              : user.user_type === "employee"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {user.user_type.charAt(0).toUpperCase() +
                            user.user_type.slice(1)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Leave Balance
                      </h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {user.leave_balance} days
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
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `/admin/user/${user.id}/work-hours`,
                          "_blank"
                        )
                      }
                    >
                      View Work Hours
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
