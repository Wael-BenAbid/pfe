import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { API_BASE_URL } from '../config/constants';

interface User {
  id: number;
  username: string;
  email: string;
  user_type: 'admin' | 'employee' | 'intern';
  leave_balance: number;
  is_approved: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  sessionId: number | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  checkUserApprovalStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [sessionId, setSessionId] = useState<number | null>(
    localStorage.getItem('session_id') ? parseInt(localStorage.getItem('session_id') || '0') : null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          // Essayer d'obtenir les informations de l'utilisateur avec le token actuel
          const userInfoResponse = await fetch(`${API_BASE_URL}/users/me/`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            // Ajouter cache: 'no-store' pour éviter les problèmes de cache lors du rafraîchissement
            cache: 'no-store',
          });

          if (userInfoResponse.ok) {
            // Le token est valide, récupérer les données utilisateur
            const userData = await userInfoResponse.json();
            console.log('User data:', userData);
            setUser(userData);

            // Stocker les données utilisateur dans le localStorage pour la persistance
            localStorage.setItem('user_data', JSON.stringify(userData));
          } else if (userInfoResponse.status === 401) {
            // Le token a expiré, essayer de le rafraîchir
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              try {
                console.log('Refreshing token...');
                const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token/`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ refresh: refreshToken }),
                  // Ajouter cache: 'no-store' pour éviter les problèmes de cache
                  cache: 'no-store',
                });

                if (refreshResponse.ok) {
                  // Token rafraîchi avec succès
                  const refreshData = await refreshResponse.json();
                  localStorage.setItem('access_token', refreshData.access);
                  setToken(refreshData.access);
                  console.log('Token refreshed successfully');

                  // Récupérer les informations utilisateur avec le nouveau token
                  const newUserInfoResponse = await fetch(`${API_BASE_URL}/users/me/`, {
                    method: 'GET',
                    headers: {
                      Authorization: `Bearer ${refreshData.access}`,
                    },
                    cache: 'no-store',
                  });

                  if (newUserInfoResponse.ok) {
                    const userData = await newUserInfoResponse.json();
                    setUser(userData);
                    localStorage.setItem('user_data', JSON.stringify(userData));
                  }
                } else {
                  console.error('Failed to refresh token, status:', refreshResponse.status);
                  // Essayer de récupérer les données utilisateur du localStorage
                  const storedUserData = localStorage.getItem('user_data');
                  if (storedUserData) {
                    try {
                      const parsedUserData = JSON.parse(storedUserData);
                      setUser(parsedUserData);
                      console.log('Using stored user data');
                    } catch (parseError) {
                      console.error('Error parsing stored user data:', parseError);
                      handleLogout();
                    }
                  } else {
                    handleLogout();
                  }
                }
              } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
                // Essayer de récupérer les données utilisateur du localStorage
                const storedUserData = localStorage.getItem('user_data');
                if (storedUserData) {
                  try {
                    const parsedUserData = JSON.parse(storedUserData);
                    setUser(parsedUserData);
                    console.log('Using stored user data after refresh error');
                  } catch (parseError) {
                    console.error('Error parsing stored user data:', parseError);
                    handleLogout();
                  }
                } else {
                  handleLogout();
                }
              }
            } else {
              // Pas de token de rafraîchissement, essayer d'utiliser les données stockées
              const storedUserData = localStorage.getItem('user_data');
              if (storedUserData) {
                try {
                  const parsedUserData = JSON.parse(storedUserData);
                  setUser(parsedUserData);
                  console.log('Using stored user data, no refresh token');
                } catch (parseError) {
                  console.error('Error parsing stored user data:', parseError);
                  handleLogout();
                }
              } else {
                handleLogout();
              }
            }
          }
        } catch (error) {
          console.error('Error validating token:', error);
          // En cas d'erreur réseau, essayer d'utiliser les données stockées
          const storedUserData = localStorage.getItem('user_data');
          if (storedUserData) {
            try {
              const parsedUserData = JSON.parse(storedUserData);
              setUser(parsedUserData);
              console.log('Using stored user data after network error');
            } catch (parseError) {
              console.error('Error parsing stored user data:', parseError);
            }
          }
        }
      } else {
        // Pas de token, essayer de récupérer les données utilisateur du localStorage
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          try {
            const parsedUserData = JSON.parse(storedUserData);
            setUser(parsedUserData);
            console.log('Using stored user data, no token');
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
          }
        }
      }
      setLoading(false);
    };

    // Fonction utilitaire pour la déconnexion
    const handleLogout = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('session_id');
      localStorage.removeItem('user_data');
      setToken(null);
      setUser(null);
      setSessionId(null);
    };

    validateToken();
  }, [token]);

  const login = async (username: string, password: string) => {
    try {
      // Try the login endpoint
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user_type', data.user?.user_type || '');

        // Store the session ID
        if (data.session_id) {
          localStorage.setItem('session_id', data.session_id.toString());
          setSessionId(data.session_id);
        }

        setToken(data.access);

        // Fetch user data
        const userResponse = await fetch(`${API_BASE_URL}/users/me/`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${data.access}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          // Stocker les données utilisateur dans le localStorage pour la persistance
          localStorage.setItem('user_data', JSON.stringify(userData));
        }
      } else {
        // Gérer les différents cas d'erreur
        try {
          const errorData = await response.json();

          if (response.status === 403) {
            // Candidature en attente ou rejetée
            if (errorData.status === 'pending') {
              throw new Error(`pending:${errorData.application_id}`);
            } else if (errorData.status === 'rejected') {
              throw new Error('rejected');
            }
          }

          // Si l'erreur contient un message détaillé, l'utiliser
          if (errorData.detail) {
            throw new Error(errorData.detail);
          } else if (errorData.error) {
            throw new Error(errorData.error);
          }
        } catch (parseError) {
          // Si l'erreur n'est pas au format JSON ou n'a pas les champs attendus
          console.error('Error parsing error response:', parseError);
        }

        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);

      // Propager l'erreur avec le message approprié
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Invalid credentials');
      }
    }
  };

  const logout = async () => {
    try {
      if (token) {
        // Send the session ID when logging out
        await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            refresh: localStorage.getItem('refresh_token'),
            session_id: sessionId
          })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('session_id');
      localStorage.removeItem('user_data');
      setToken(null);
      setUser(null);
      setSessionId(null);
    }
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const checkUserApprovalStatus = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return userData.is_approved;
      } else {
        console.error('Failed to fetch user approval status');
        return false;
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      return false;
    }
  };

  const value = {
    user,
    token,
    loading,
    sessionId,
    login,
    logout,
    isAuthenticated,
    checkUserApprovalStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook pour utiliser le contexte Auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
