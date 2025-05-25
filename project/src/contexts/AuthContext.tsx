import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { API_BASE_URL, API_URL } from '../config/constants';
import { traceAuthentication } from '../services/zipkinService';

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

  // Fonction pour rafraîchir le token
  const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    try {
      console.log('Refreshing token...');
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
        cache: 'no-store',
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        localStorage.setItem('access_token', refreshData.access);
        console.log('Token refreshed successfully');
        return refreshData.access;
      } else {
        console.error('Failed to refresh token, status:', refreshResponse.status);

        // Essayer d'obtenir des détails sur l'erreur
        try {
          const errorData = await refreshResponse.json();
          console.error('Refresh token error details:', errorData);
        } catch (e) {
          console.error('Could not parse refresh token error response');
        }

        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  // Fonction pour récupérer les informations de l'utilisateur
  const fetchUserInfo = async (accessToken: string): Promise<User | null> => {
    try {
      const userInfoResponse = await fetch(`${API_BASE_URL}/users/me/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      });

      if (userInfoResponse.ok) {
        const userData = await userInfoResponse.json();
        console.log('User data fetched successfully');
        return userData;
      } else {
        console.error('Failed to fetch user info, status:', userInfoResponse.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  };

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          // Essayer d'obtenir les informations de l'utilisateur avec le token actuel
          const userData = await fetchUserInfo(token);

          if (userData) {
            // Le token est valide, mettre à jour l'état utilisateur
            setUser(userData);
            localStorage.setItem('user_data', JSON.stringify(userData));
          } else if (userData === null) {
            // Le token a expiré, essayer de le rafraîchir
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const newToken = await refreshAccessToken(refreshToken);

              if (newToken) {
                // Token rafraîchi avec succès, mettre à jour l'état
                setToken(newToken);

                // Récupérer les informations utilisateur avec le nouveau token
                const newUserData = await fetchUserInfo(newToken);

                if (newUserData) {
                  setUser(newUserData);
                  localStorage.setItem('user_data', JSON.stringify(newUserData));
                } else {
                  // Impossible de récupérer les informations utilisateur même avec le nouveau token
                  console.error('Failed to fetch user data with new token');
                  handleLogout();
                }
              } else {
                // Échec du rafraîchissement du token
                console.error('Token refresh failed');
                handleLogout();
              }
            } else {
              // Pas de token de rafraîchissement disponible
              console.error('No refresh token available');
              handleLogout();
            }
          }
        } catch (error) {
          console.error('Error in token validation process:', error);
          handleLogout();
        }
      } else {
        // Pas de token d'accès, vérifier si l'utilisateur a un token de rafraîchissement
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Essayer de rafraîchir le token
          const newToken = await refreshAccessToken(refreshToken);
          if (newToken) {
            setToken(newToken);
            // Les informations utilisateur seront récupérées lors du prochain cycle useEffect
          } else {
            handleLogout();
          }
        }
      }

      setLoading(false);
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

          // Tracer la connexion réussie
          traceAuthentication('login', true, userData.email);
          console.log('✅ Connexion tracée dans Zipkin pour:', userData.email);
        }
      } else {
        // Gérer les différents cas d'erreur
        try {
          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);

          // Cloner la réponse pour pouvoir la lire plusieurs fois
          const responseClone = response.clone();

          // Essayer de lire le corps de la réponse comme texte d'abord
          const responseText = await responseClone.text();
          console.log('Raw response text:', responseText);

          // Puis essayer de le parser comme JSON
          let errorData;
          try {
            errorData = JSON.parse(responseText);
            console.log('Parsed error data:', errorData);
          } catch (jsonError) {
            console.error('Failed to parse response as JSON:', jsonError);
            errorData = { detail: responseText };
          }

          console.log('Login error response:', response.status, errorData);

          if (response.status === 403) {
            // Candidature en attente ou rejetée
            console.log('Detected 403 status, checking for pending or rejected application');
            console.log('Error data received:', errorData);

            if (errorData.status === 'pending') {
              console.log('Pending application detected, ID:', errorData.application_id);
              throw new Error(`pending:${errorData.application_id}`);
            } else if (errorData.status === 'rejected') {
              console.log('Rejected application detected');
              throw new Error('rejected');
            } else if (errorData.detail && errorData.detail.includes("en attente")) {
              // Cas où le message contient "en attente" mais pas de status explicite
              console.log('Pending application detected from detail message');
              const appId = errorData.application_id || '';
              throw new Error(`pending:${appId}`);
            } else {
              // Cas où le statut n'est pas explicitement défini mais la réponse est 403
              console.log('403 response without explicit status, assuming pending');
              const appId = errorData.application_id || '';
              throw new Error(`pending:${appId}`);
            }
          }

          // Si l'erreur contient un message détaillé, l'utiliser
          if (errorData.detail) {
            console.log('Error detail:', errorData.detail);
            throw new Error(errorData.detail);
          } else if (errorData.error) {
            console.log('Error message:', errorData.error);
            throw new Error(errorData.error);
          }
        } catch (parseError) {
          // Si l'erreur n'est pas au format JSON ou n'a pas les champs attendus
          console.error('Error parsing error response:', parseError);
          if (response.status === 403) {
            // Si c'est une erreur 403, supposer que c'est une candidature en attente
            console.log('Assuming pending application due to 403 status');
            throw new Error('pending');
          }
        }

        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);

      // Tracer l'échec de connexion
      traceAuthentication('login', false, username, error instanceof Error ? error.message : 'Invalid credentials');

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
        const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
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

        if (response.ok) {
          const data = await response.json();
          console.log('Logout successful:', data);

          // Afficher les heures travaillées si disponibles
          if (data.hours_worked) {
            console.log(`Hours worked this session: ${data.hours_worked}`);
          }
        } else {
          console.error('Logout failed with status:', response.status);
          try {
            const errorData = await response.json();
            console.error('Logout error details:', errorData);
          } catch (e) {
            console.error('Could not parse logout error response');
          }
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Tracer la déconnexion
      const currentUser = user;
      traceAuthentication('logout', true, currentUser?.email);

      // Toujours nettoyer le stockage local et l'état, même en cas d'erreur
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
