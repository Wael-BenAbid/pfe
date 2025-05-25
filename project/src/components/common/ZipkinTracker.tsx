/**
 * Composant pour tracer les navigations avec Zipkin
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { tracePageNavigation } from '../../services/zipkinService';

interface ZipkinTrackerProps {
  children: React.ReactNode;
}

const ZipkinTracker: React.FC<ZipkinTrackerProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Tracer la navigation de page
    const pageName = getPageName(location.pathname);
    tracePageNavigation(pageName, location.pathname);
  }, [location]);

  return <>{children}</>;
};

// Fonction pour obtenir un nom de page lisible
const getPageName = (pathname: string): string => {
  const routes: Record<string, string> = {
    '/': 'Home',
    '/apply': 'Application Form',
    '/login': 'Login',
    '/forgot-password': 'Forgot Password',
    '/reset-password': 'Reset Password',
    '/application-success': 'Application Success',
    '/pending-approval': 'Pending Approval',
    '/application-rejected': 'Application Rejected',
    '/not-found': 'Not Found',
  };

  // Routes dynamiques
  if (pathname.startsWith('/admine')) {
    return 'Admin Dashboard';
  } else if (pathname.startsWith('/employee')) {
    return 'Employee Dashboard';
  } else if (pathname.startsWith('/intern')) {
    return 'Intern Dashboard';
  }

  return routes[pathname] || `Unknown Page (${pathname})`;
};

export default ZipkinTracker;
