import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

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

interface MissionStatsResponse {
  assigned: {
    total: number;
    completed: number;
    pending: number;
    late: number;
    completion_rate: number;
  };
  supervised: {
    total: number;
    completed: number;
    pending: number;
    late: number;
    completion_rate: number;
  };
}

/**
 * Hook personnalisé pour récupérer et calculer les statistiques des missions
 * @returns Statistiques des missions
 */
export const useMissionStats = (): MissionStats => {
  const { token } = useAuth();
  const [stats, setStats] = useState<MissionStatsResponse>({
    assigned: { total: 0, completed: 0, pending: 0, late: 0, completion_rate: 0 },
    supervised: { total: 0, completed: 0, pending: 0, late: 0, completion_rate: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMissionStats = async () => {
      if (!token) return;

      try {
        // Utiliser l'endpoint de statistiques des missions
        const response = await fetch(`${API_BASE_URL}/missions/stats/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching mission stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissionStats();
  }, [token]);

  return {
    total: stats.assigned.total,
    completed: stats.assigned.completed,
    pending: stats.assigned.pending,
    late: stats.assigned.late,
    completionRate: stats.assigned.completion_rate,
    assignedMissions: {
      total: stats.supervised.total,
      completed: stats.supervised.completed,
      pending: stats.supervised.pending,
      late: stats.supervised.late,
      completionRate: stats.supervised.completion_rate,
    },
    loading
  };
};
