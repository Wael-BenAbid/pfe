import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Clock } from 'lucide-react';

interface WorkHour {
  id: number;
  date: string;
  hours_worked: number;
  description?: string;
  created_at: string;
  user: number;
}

interface EmployeeWorkHoursProps {
  userId: number;
  userName?: string;
}

const EmployeeWorkHours: React.FC<EmployeeWorkHoursProps> = ({ userId, userName }) => {
  const { token } = useAuth();
  const [workHours, setWorkHours] = useState<WorkHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkHours = async () => {
      if (!token || !userId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/work-hours/?user=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch work hours');
        }

        const data = await response.json();
        setWorkHours(data);

        // Calculer le total des heures travaillées
        const total = data.reduce(
          (sum: number, entry: WorkHour) => sum + parseFloat(entry.hours_worked.toString()),
          0
        );
        setTotalHours(parseFloat(total.toFixed(2)));
      } catch (error) {
        console.error('Error fetching work hours:', error);
        setError('Failed to load work hours. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkHours();
  }, [token, userId]);

  if (loading) {
    return <LoadingSpinner message="Loading work hours..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">
          {userName ? `${userName}'s Work Hours` : 'Work Hours'}
        </h2>
        <div className="flex items-center text-blue-600">
          <Clock className="h-5 w-5 mr-2" />
          <span className="font-semibold">{totalHours} hours total</span>
        </div>
      </div>

      {workHours.length === 0 ? (
        <div className="p-6 text-center">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No work hours recorded</h3>
          <p className="mt-1 text-sm text-gray-500">
            No work hours have been recorded for this user yet.
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
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Hours Worked
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workHours.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.hours_worked} hours
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {entry.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeWorkHours;
