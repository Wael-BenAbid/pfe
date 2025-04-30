import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';


interface ProtectedRouteProps {
  children: React.ReactNode;
  userType?: 'admin' | 'employee' | 'intern';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, userType }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Affiche un spinner pendant le chargement
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Redirige vers la page de connexion si l'utilisateur n'est pas authentifié
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirige vers la page d'attente si l'utilisateur n'est pas approuvé
  if (user && user.is_approved === false) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Redirige vers le tableau de bord correspondant si le type d'utilisateur ne correspond pas
  if (userType && user && user.user_type !== userType) {
    return <Navigate to={`/${user.user_type}`} replace />;
  }

  // Affiche les enfants si toutes les conditions sont remplies
  return <>{children}</>;
};

export default ProtectedRoute;
