import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DeadlineCalendar from '../../components/calendar/DeadlineCalendar';
import Button from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Déterminer la page de retour en fonction du type d'utilisateur
  const getBackPath = () => {
    const path = location.pathname;
    if (path.includes('/admine')) return '/admine';
    if (path.includes('/employee')) return '/employee';
    if (path.includes('/intern')) return '/intern';
    return '/';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Deadlines & Meetings Calendar
        </h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(getBackPath())}
          icon={<ArrowLeft className="h-4 w-4 mr-2" />}
        >
          Retour
        </Button>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
        <DeadlineCalendar />
      </div>
    </div>
  );
};

export default CalendarView;
