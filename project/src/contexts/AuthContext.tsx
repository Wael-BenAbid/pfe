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
          const response = await fetch(`${API_BASE_URL}/auth/verify-token/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });

          if (response.ok) {
            const userInfoResponse = await fetch(`${API_BASE_URL}/users/me/`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (userInfoResponse.ok) {
              const userData = await userInfoResponse.json();
              console.log('User data:', userData); // Vérifiez les données utilisateur
              setUser(userData);
            }
          } else {
            localStorage.removeItem('access_token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Error validating token:', error);
          localStorage.removeItem('access_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    validateToken();
  }, [token]);

  const login = async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

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
      }
    } else {
      throw new Error('Invalid credentials');
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
