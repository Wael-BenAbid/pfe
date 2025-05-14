import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Button from "../../components/ui/Button";
import { ArrowLeftIcon } from "lucide-react";
import EmployeeWorkHours from "../../components/employee/EmployeeWorkHours";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

const UserWorkHours: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { token } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && userId) {
      fetchUserDetails();
    }
  }, [token, userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const userData = await response.json();
      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user details:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading user details..." />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeftIcon className="h-4 w-4" />}
          onClick={() => window.history.back()}
        >
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900 ml-4">
          Work Hours for {user?.first_name} {user?.last_name}
        </h1>
      </div>

      {userId && user && user.user_type !== 'intern' ? (
        <EmployeeWorkHours
          userId={parseInt(userId)}
          userName={user ? `${user.first_name} ${user.last_name}` : undefined}
        />
      ) : user && user.user_type === 'intern' ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Stagiaires n'ont pas d'heures de travail</h3>
          <p className="text-gray-500">
            Les stagiaires ne sont pas soumis au suivi des heures de travail dans le système.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default UserWorkHours;
