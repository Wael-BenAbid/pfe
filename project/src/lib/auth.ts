import axios, { AxiosError } from 'axios';
import { User } from '../../types';

const API_URL = '/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthTokens {
  access: string;
  refresh: string;
}

export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await axios.post<AuthTokens>(`${API_URL}/token/`, credentials);
    const { access, refresh } = response.data;

    // Sauvegardez les tokens dans localStorage
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);

    // Log tokens
    console.log('Access token:', access);
    console.log('Refresh token:', refresh);

    // Configurez l'en-tête Authorization par défaut
    axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;

    // Récupérez les informations utilisateur
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const errorMessage = (axiosError.response.data as { message?: string }).message || 'Login failed';
      throw new Error(errorMessage);
    }
    throw new Error('Network error. Please try again.');
  }
};

export const logout = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  delete axios.defaults.headers.common['Authorization'];
};

export const refreshToken = async (): Promise<string | null> => {
  const refresh = localStorage.getItem('refreshToken');
  if (!refresh) return null;
  
  try {
    const response = await axios.post<{ access: string }>(`${API_URL}/token/refresh/`, { refresh });
    const newAccessToken = response.data.access;
    localStorage.setItem('accessToken', newAccessToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
    return newAccessToken;
  } catch {
    logout();
    return null;
  }
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await axios.get<User>(`${API_URL}/users/me/`);
  return response.data;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('accessToken');
};

// Setup axios interceptors for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is due to an expired token and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const newToken = await refreshToken();
      if (newToken) {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

// Set token on startup if it exists
const token = localStorage.getItem('accessToken');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
