import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { isMissionLate } from '../../utils/missionUtils';

// Configurer le localisateur pour le calendrier
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    type: 'mission' | 'meeting';
    status: string;
    description: string;
  };
}

interface Mission {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status?: string;
  completed: boolean;
}

interface Meeting {
  id: number;
  title: string;
  description: string;
  date_time: string;
  duration_minutes: number;
  status: string;
}

const DeadlineCalendar: React.FC = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer les informations de l'utilisateur pour déterminer son type
      const userInfoResponse = await fetch(`${API_BASE_URL}/api/get-user-info/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await userInfoResponse.json();
      const isAdmin = userInfo.user_type === 'admin';

      // Récupérer les missions (toutes pour admin, seulement assignées pour les autres)
      const missionsEndpoint = isAdmin ? `${API_BASE_URL}/missions/` : `${API_BASE_URL}/missions/assigned/`;
      const missionsResponse = await fetch(missionsEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Récupérer les réunions
      const meetingsResponse = await fetch(`${API_BASE_URL}/meetings/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!missionsResponse.ok || !meetingsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const missions = await missionsResponse.json();
      const meetings = await meetingsResponse.json();

      // Convertir les missions en événements de calendrier
      const missionEvents = missions.map((mission: Mission) => {
        const deadlineDate = new Date(mission.deadline);
        const status = mission.completed ? 'completed' : isMissionLate(mission) ? 'late' : 'pending';

        return {
          id: mission.id,
          title: `Mission: ${mission.title}`,
          start: deadlineDate,
          end: deadlineDate,
          allDay: true,
          resource: {
            type: 'mission' as const,
            status,
            description: mission.description,
          },
        };
      });

      // Convertir les réunions en événements de calendrier
      const meetingEvents = meetings.map((meeting: Meeting) => {
        const startDate = new Date(meeting.date_time);
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + meeting.duration_minutes);

        return {
          id: meeting.id,
          title: `Meeting: ${meeting.title}`,
          start: startDate,
          end: endDate,
          allDay: false,
          resource: {
            type: 'meeting' as const,
            status: meeting.status,
            description: meeting.description || '',
          },
        };
      });

      // Combiner les événements
      setEvents([...missionEvents, ...meetingEvents]);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';
    let borderColor = '#2c6496';

    if (event.resource.type === 'mission') {
      if (event.resource.status === 'completed') {
        backgroundColor = '#4caf50';
        borderColor = '#388e3c';
      } else if (event.resource.status === 'late') {
        backgroundColor = '#f44336';
        borderColor = '#d32f2f';
      } else {
        backgroundColor = '#ff9800';
        borderColor = '#f57c00';
      }
    } else if (event.resource.type === 'meeting') {
      if (event.resource.status === 'completed') {
        backgroundColor = '#4caf50';
        borderColor = '#388e3c';
      } else if (event.resource.status === 'cancelled') {
        backgroundColor = '#9e9e9e';
        borderColor = '#757575';
      } else {
        backgroundColor = '#2196f3';
        borderColor = '#1976d2';
      }
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: '#fff',
        border: '1px solid ' + borderColor,
        display: 'block',
      },
    };
  };

  if (loading) {
    return <LoadingSpinner message="Loading calendar..." />;
  }

  return (
    <div className="h-full">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectEvent={handleEventClick}
        eventPropGetter={eventStyleGetter}
      />

      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">{selectedEvent.title}</h2>
            <div className="mb-4">
              <p className="text-gray-600">
                <span className="font-medium">Date:</span>{' '}
                {moment(selectedEvent.start).format('MMMM D, YYYY')}
              </p>
              {!selectedEvent.allDay && (
                <p className="text-gray-600">
                  <span className="font-medium">Time:</span>{' '}
                  {moment(selectedEvent.start).format('h:mm A')} -{' '}
                  {moment(selectedEvent.end).format('h:mm A')}
                </p>
              )}
              <p className="text-gray-600">
                <span className="font-medium">Type:</span>{' '}
                {selectedEvent.resource.type.charAt(0).toUpperCase() +
                  selectedEvent.resource.type.slice(1)}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Status:</span>{' '}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedEvent.resource.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : selectedEvent.resource.status === 'late'
                      ? 'bg-red-100 text-red-800'
                      : selectedEvent.resource.status === 'cancelled'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {selectedEvent.resource.status.charAt(0).toUpperCase() +
                    selectedEvent.resource.status.slice(1)}
                </span>
              </p>
              <p className="text-gray-600 mt-2">
                <span className="font-medium">Description:</span>
              </p>
              <p className="text-gray-800 mt-1">{selectedEvent.resource.description}</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setShowEventDetails(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadlineCalendar;
