import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType?: 'admin' | 'employee' | 'intern';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, userType }) => {
  const { isAuthenticated, user, loading, checkUserApprovalStatus } = useAuth();
  const location = useLocation();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [checkingApproval, setCheckingApproval] = useState(true);

  useEffect(() => {
    const checkApproval = async () => {
      if (isAuthenticated()) {
        const approved = await checkUserApprovalStatus();
        setIsApproved(approved);
      }
      setCheckingApproval(false);
    };

    checkApproval();
  }, [checkUserApprovalStatus, isAuthenticated]);

  if (loading || checkingApproval) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isApproved === false) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (userType && user?.user_type !== userType) {
    // Redirect to the appropriate dashboard based on user type
    if (user?.user_type === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user?.user_type === 'employee') {
      return <Navigate to="/employee" replace />;
    } else if (user?.user_type === 'intern') {
      return <Navigate to="/intern" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;