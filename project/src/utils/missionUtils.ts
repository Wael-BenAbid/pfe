import { API_BASE_URL } from "../config/constants";

export interface Mission {
  id: number;
  title: string;
  description: string;
  status?: string;
  deadline: string;
  assigned_to: number;
  user?: number;
  user_details?: {
    first_name: string;
    last_name: string;
    user_type?: string;
  };
  created_at: string;
  completed: boolean;
  assignee_type?: 'employees' | 'interns';
}

/**
 * Vérifie si une mission est en retard
 * @param mission La mission à vérifier
 * @returns true si la mission est en retard, false sinon
 */
export const isMissionLate = (mission: Mission): boolean => {
  if (mission.completed || mission.status === 'completed') {
    return false;
  }

  const deadlineDate = new Date(mission.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates

  return deadlineDate < today;
};

/**
 * Met à jour le statut d'une mission en fonction de sa date limite
 * @param missions Liste des missions à mettre à jour
 * @returns Liste des missions avec le statut mis à jour
 */
export const updateMissionStatuses = (missions: Mission[]): Mission[] => {
  return missions.map(mission => {
    if (mission.completed || mission.status === 'completed') {
      return { ...mission, status: 'completed' };
    }

    if (isMissionLate(mission)) {
      return { ...mission, status: 'late' };
    }

    return { ...mission, status: 'pending' };
  });
};

/**
 * Récupère les missions depuis l'API et met à jour leur statut
 * @param token Token d'authentification
 * @returns Promise contenant la liste des missions avec le statut mis à jour
 */
export const fetchAndUpdateMissions = async (token: string): Promise<Mission[]> => {
  try {
    // Appeler d'abord l'endpoint pour vérifier les missions en retard
    try {
      await fetch(`${API_BASE_URL}/missions/check_late_missions/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Late missions check completed");
    } catch (error) {
      console.warn("Failed to check late missions:", error);
      // Continuer même si cette requête échoue
    }

    // Récupérer les missions
    const response = await fetch(`${API_BASE_URL}/missions/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch missions");
    }

    const data = await response.json();
    return updateMissionStatuses(data);
  } catch (error) {
    console.error("Error fetching and updating missions:", error);
    throw error;
  }
};
