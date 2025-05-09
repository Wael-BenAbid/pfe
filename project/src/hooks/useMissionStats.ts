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
        // Essayer d'utiliser l'endpoint de statistiques des missions
        const response = await fetch(`${API_BASE_URL}/missions/stats/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Si l'endpoint n'est pas disponible, récupérer les missions manuellement
          console.warn("Mission stats endpoint not available, fetching missions manually");

          // Récupérer les missions assignées à l'utilisateur
          const missionsResponse = await fetch(`${API_BASE_URL}/missions/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (missionsResponse.ok) {
            const missions = await missionsResponse.json();

            // Calculer les statistiques manuellement
            const assigned = {
              total: missions.length,
              completed: missions.filter((m: any) => m.status === 'completed').length,
              pending: missions.filter((m: any) => m.status === 'pending').length,
              late: missions.filter((m: any) => m.status === 'late').length,
              completion_rate: 0
            };

            assigned.completion_rate = assigned.total > 0
              ? Math.round((assigned.completed / assigned.total) * 100)
              : 0;

            // Récupérer les missions supervisées (si possible)
            try {
              const supervisedResponse = await fetch(`${API_BASE_URL}/missions/supervised/`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (supervisedResponse.ok) {
                const supervisedMissions = await supervisedResponse.json();

                const supervised = {
                  total: supervisedMissions.length,
                  completed: supervisedMissions.filter((m: any) => m.status === 'completed').length,
                  pending: supervisedMissions.filter((m: any) => m.status === 'pending').length,
                  late: supervisedMissions.filter((m: any) => m.status === 'late').length,
                  completion_rate: 0
                };

                supervised.completion_rate = supervised.total > 0
                  ? Math.round((supervised.completed / supervised.total) * 100)
                  : 0;

                setStats({
                  assigned,
                  supervised
                });
              } else {
                // Si l'endpoint des missions supervisées n'est pas disponible
                setStats({
                  assigned,
                  supervised: { total: 0, completed: 0, pending: 0, late: 0, completion_rate: 0 }
                });
              }
            } catch (error) {
              console.error("Error fetching supervised missions:", error);
              setStats({
                assigned,
                supervised: { total: 0, completed: 0, pending: 0, late: 0, completion_rate: 0 }
              });
            }
          } else {
            // Si aucune donnée n'est disponible, utiliser des données fictives pour le développement
            console.warn("Using mock data for mission stats");
            setStats({
              assigned: { total: 5, completed: 2, pending: 2, late: 1, completion_rate: 40 },
              supervised: { total: 3, completed: 1, pending: 1, late: 1, completion_rate: 33 }
            });
          }
        }
      } catch (error) {
        console.error("Error fetching mission stats:", error);
        // Utiliser des données fictives en cas d'erreur
        setStats({
          assigned: { total: 5, completed: 2, pending: 2, late: 1, completion_rate: 40 },
          supervised: { total: 3, completed: 1, pending: 1, late: 1, completion_rate: 33 }
        });
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
