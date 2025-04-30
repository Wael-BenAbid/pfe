import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import { CheckCircleIcon, ClockIcon } from 'lucide-react';

interface Mission {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  supervisor_name: string;
  created_at: string;
}

const Missions: React.FC = () => {
  const { token } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMissions();
  }, [token]);

  const fetchMissions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/missions/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMissions(data);
      }
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMission = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/missions/${id}/complete_mission/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchMissions();
      }
    } catch (error) {
      console.error('Error completing mission:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
    }
  };

  return (
    <>
      {loading ? (
        <div className="p-6 text-center text-gray-600">
          Loading missions...
        </div>
      ) : (
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">My Missions</h2>
  
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {missions.map((mission) => (
                <li key={mission.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">{mission.title}</div>
                        {getStatusBadge(mission.status)}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">{mission.description}</p>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            Deadline: {new Date(mission.deadline).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          Supervisor: {mission.supervisor_name}
                        </div>
                      </div>
                    </div>
                    {mission.status !== 'completed' && (
                      <div className="ml-4">
                        <Button
                          variant="success"
                          size="sm"
                          icon={<CheckCircleIcon className="h-4 w-4" />}
                          onClick={() => handleCompleteMission(mission.id)}
                        >
                          Complete
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}  
export default Missions;