import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { ArrowLeftIcon, ClockIcon } from 'lucide-react';

interface WorkHour {
  id: number;
  date: string;
  hours_worked: number;
  description?: string;
  created_at: string;
  user: number;
}

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
  const [workHours, setWorkHours] = useState<WorkHour[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    if (token && userId) {
      fetchUserDetails();
      fetchWorkHours();
    }
  }, [token, userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchWorkHours = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/work-hours/?user=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch work hours');
      }

      const data = await response.json();
      setWorkHours(data);
      
      // Calculate total hours
      const total = data.reduce((sum: number, entry: WorkHour) => sum + parseFloat(entry.hours_worked.toString()), 0);
      setTotalHours(total);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching work hours:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading work hours..." />;
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

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Work Hours History
          </h2>
          <div className="text-sm font-medium text-gray-900">
            Total Hours: <span className="text-blue-600">{totalHours.toFixed(2)}</span>
          </div>
        </div>

        {workHours.length === 0 ? (
          <div className="p-6 text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No work hours recorded</h3>
            <p className="mt-1 text-sm text-gray-500">
              This user has not logged any work hours yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workHours.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.hours_worked} hours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.description && entry.description.includes('Automatic time tracking') ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Automatic
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Manual
                        </span>
                      )}
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

export default UserWorkHours;
