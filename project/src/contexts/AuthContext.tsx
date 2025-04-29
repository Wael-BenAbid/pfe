import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  checkUserApprovalStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/verify-token/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token is invalid or expired
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Error validating token:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    validateToken();
  }, [token]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }
  
      const data = await response.json();
      if (data?.access) {
        localStorage.setItem('token', data.access);
        setToken(data.access);
  
        // 👉 Fetch user info separately
        const userInfoResponse = await fetch(`${API_BASE_URL}/users/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.access}`
          }
        });
  
        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user information.');
        }
  
        const userData = await userInfoResponse.json();
        localStorage.setItem('user_type', userData.user_type);
        setUser(userData);
      } else {
        throw new Error('Failed to receive a valid token.');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user_type');
      setToken(null);
      setUser(null);
    }
  };
  
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const checkUserApprovalStatus = async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}/get-user-info/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        return userData.is_approved === true;
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
    login,
    logout,
    isAuthenticated,
    checkUserApprovalStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
