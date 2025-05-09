import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

interface Mission {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed" | "late";
  supervisor_name: string;
  created_at: string;
  assigned_to_id?: number;
  assigned_to_name?: string;
}

interface MissionStats {
  total: number;
  completed: number;
  pending: number;
  late: number;
  completionRate: number;
  assignedMissions: {
    total: number;
    completed: number;
    pending: number;
    late: number;
    completionRate: number;
  };
  loading: boolean;
}

/**
 * Hook personnalisé pour récupérer et calculer les statistiques des missions
 * @returns Statistiques des missions
 */
export const useMissionStats = (): MissionStats => {
  const { token, user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [assignedMissions, setAssignedMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMissions = async () => {
      if (!token) return;
      
      try {
        // Récupérer les missions assignées à l'employé
        const response = await fetch(`${API_BASE_URL}/missions/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMissions(data);
        }

        // Récupérer les missions assignées par l'employé (en tant que superviseur)
        if (user?.user_type === 'employee') {
          const supervisedResponse = await fetch(`${API_BASE_URL}/missions/supervised/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (supervisedResponse.ok) {
            const supervisedData = await supervisedResponse.json();
            setAssignedMissions(supervisedData);
          }
        }
      } catch (error) {
        console.error("Error fetching mission stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, [token, user]);

  // Calculer les statistiques des missions assignées à l'employé
  const total = missions.length;
  const completed = missions.filter(m => m.status === 'completed').length;
  const pending = missions.filter(m => m.status === 'pending').length;
  const late = missions.filter(m => m.status === 'late').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Calculer les statistiques des missions assignées par l'employé
  const assignedTotal = assignedMissions.length;
  const assignedCompleted = assignedMissions.filter(m => m.status === 'completed').length;
  const assignedPending = assignedMissions.filter(m => m.status === 'pending').length;
  const assignedLate = assignedMissions.filter(m => m.status === 'late').length;
  const assignedCompletionRate = assignedTotal > 0 ? Math.round((assignedCompleted / assignedTotal) * 100) : 0;

  return {
    total,
    completed,
    pending,
    late,
    completionRate,
    assignedMissions: {
      total: assignedTotal,
      completed: assignedCompleted,
      pending: assignedPending,
      late: assignedLate,
      completionRate: assignedCompletionRate,
    },
    loading
  };
};
