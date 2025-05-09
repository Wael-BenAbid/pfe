import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, MEDIA_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Button from "../../components/ui/Button";
import {
  ArrowLeftIcon,
  UserIcon,
  PencilIcon,
  SaveIcon,
  XIcon,
  ImageIcon,
} from "lucide-react";
import TextInput from "../../components/ui/TextInput";
import AlertModal from "../../components/ui/AlertModal";

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

const InternProfile: React.FC = () => {
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

  useEffect(() => {
    if (token && authUser) {
      fetchUserDetails();
    }
  }, [token, authUser]);

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
          if (value !== undefined && value !== null) {
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
          throw new Error("Failed to update user");
        }

        updatedUser = await response.json();
      } else {
        // Pas de nouvelle image, on peut utiliser JSON
        const response = await fetch(`${API_BASE_URL}/users/${user.id}/`, {
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
        message: 'Profile updated successfully',
        type: 'success'
      });
    } catch (error) {
      console.error("Error updating user:", error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update profile',
        type: 'error'
      });
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading profile..." />;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-medium text-red-600">Profile not found</h2>
          <Button
            variant="primary"
            size="md"
            className="mt-4"
            onClick={() => navigate("/intern")}
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
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeftIcon className="h-4 w-4" />}
          onClick={() => navigate("/intern")}
        >
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900 ml-4">
          My Profile
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
                    <>
                      <div className="text-xs text-gray-500 mb-2">
                        Image URL: {user.profile_image.startsWith('http') ? user.profile_image : `/media/${user.profile_image}`}
                      </div>
                      <img
                        src={user.profile_image.startsWith('http') ? user.profile_image : `/media/${user.profile_image}`}
                        alt={`${user.first_name} ${user.last_name}`}
                        className="h-40 w-40 object-cover rounded-full border-2 border-blue-200 mb-2"
                      />
                    </>
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
                      src={user.profile_image.startsWith('http') ? user.profile_image : `/media/${user.profile_image}`}
                      alt={`${user.first_name} ${user.last_name}`}
                      className="h-40 w-40 object-cover rounded-full border-2 border-blue-200"
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternProfile;
