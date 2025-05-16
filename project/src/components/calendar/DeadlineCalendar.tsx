import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_URL } from '../../config/constants';
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
    type: 'mission' | 'meeting' | 'internship_end';
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
  assigned_to: number;
  created_at: string;
}

interface Meeting {
  id: number;
  title: string;
  description: string;
  date_time: string;
  duration_minutes: number;
  status: string;
}

interface Internship {
  id: number;
  title: string;
  description: string;
  intern: number;
  supervisor: number;
  start_date: string;
  end_date: string;
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
      const userInfoResponse = await fetch(`${API_BASE_URL}/users/me/`, {
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
      const missionsEndpoint = isAdmin ? `${API_URL}/missions/` : `${API_URL}/missions/assigned/`;
      const missionsResponse = await fetch(missionsEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Récupérer les réunions
      const meetingsResponse = await fetch(`${API_URL}/meetings/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Récupérer les stages
      const internshipsResponse = await fetch(`${API_URL}/internships/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!missionsResponse.ok || !meetingsResponse.ok || !internshipsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const missions = await missionsResponse.json();
      const meetings = await meetingsResponse.json();
      const internships = await internshipsResponse.json();

      console.log('Internships data:', internships); // Ajout de log pour déboguer

      // Afficher les dates de fin de stage de manière plus détaillée
      internships.forEach((internship: Internship) => {
        console.log(`Stage ID: ${internship.id}, Titre: ${internship.title}`);
        console.log(`  Date de début: ${internship.start_date}`);
        console.log(`  Date de fin: ${internship.end_date}`);
        console.log(`  Stagiaire: ${internship.intern}`);
        console.log(`  Superviseur: ${internship.supervisor}`);
        console.log(`  Statut: ${internship.status}`);
      });

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

      // Convertir les dates de fin de stage en événements de calendrier
      const internshipEndEvents = internships.map((internship: Internship) => {
        console.log(`Traitement du stage: ID=${internship.id}, Titre=${internship.title}, Date de fin=${internship.end_date}`);

        // Vérifier si la date est au format DD/MM/YYYY
        let endDate: Date;

        if (internship.end_date && internship.end_date.includes('/')) {
          // Format DD/MM/YYYY
          const [day, month, year] = internship.end_date.split('/').map(Number);
          endDate = new Date(year, month - 1, day); // Mois est 0-indexé en JavaScript
          console.log(`Date au format DD/MM/YYYY: jour=${day}, mois=${month}, année=${year}`);
        } else {
          // Essayer le format ISO
          const dateStr = internship.end_date?.split('T')[0] || '';
          endDate = new Date(dateStr);
        }

        console.log(`Date convertie: ${endDate.toISOString()}`);
        console.log(`Mois: ${endDate.getMonth() + 1}, Année: ${endDate.getFullYear()}`); // +1 car les mois sont 0-indexés

        // Vérifier si la date est valide
        if (isNaN(endDate.getTime())) {
          console.error(`Date de fin invalide pour le stage ${internship.id}:`, internship.end_date);
          return null;
        }

        // Créer un événement avec une date de fin de stage
        const event = {
          id: internship.id,
          title: `Fin de stage: ${internship.title || 'Stage'}`,
          start: endDate,
          end: endDate,
          allDay: true,
          resource: {
            type: 'internship_end' as const,
            status: 'info',
            description: `Date de fin du stage ${internship.description || ''}`,
          },
        };

        console.log(`Événement créé:`, event);
        return event;
      }).filter(Boolean); // Filtrer les événements null

      console.log('Internship end events:', internshipEndEvents); // Ajout de log pour déboguer

      // Combiner les événements
      // Assurons-nous que les dates de fin de stage sont bien incluses
      console.log('Nombre d\'événements de fin de stage:', internshipEndEvents.length);

      // Nous n'utilisons plus d'événements manuels, nous nous appuyons uniquement sur les données réelles

      // Inclure tous les événements, y compris les dates de fin de stage
      const allEvents = [...missionEvents, ...meetingEvents, ...internshipEndEvents];

      console.log('Nombre total d\'événements:', allEvents.length);

      setEvents(allEvents);
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
    let fontWeight = 'normal';
    let fontSize = '0.9em';
    let opacity = 0.8;

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
    } else if (event.resource.type === 'internship_end') {
      // Couleur rose pour les dates de fin de stage avec style plus visible
      backgroundColor = '#e91e63';
      borderColor = '#c2185b';
      fontWeight = 'bold';
      fontSize = '1em';
      opacity = 1.0; // Pleine opacité pour les rendre plus visibles
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderRadius: '4px',
        opacity,
        color: '#fff',
        border: '2px solid ' + borderColor,
        display: 'block',
        fontWeight,
        fontSize,
        padding: event.resource.type === 'internship_end' ? '2px' : '0px',
      },
    };
  };

  if (loading) {
    return <LoadingSpinner message="Loading calendar..." />;
  }

  return (
    <div className="h-full">

      {/* Légende du calendrier */}
      <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Légende :</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#2196f3' }}></div>
            <span className="text-sm text-gray-600">Bleu : Réunions entre encadrant et stagiaire</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#ff9800' }}></div>
            <span className="text-sm text-gray-600">Orange : Missions en attente</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#4caf50' }}></div>
            <span className="text-sm text-gray-600">Vert : Missions/Réunions complétées</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#f44336' }}></div>
            <span className="text-sm text-gray-600">Rouge : Missions en retard</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#9e9e9e' }}></div>
            <span className="text-sm text-gray-600">Gris : Réunions annulées</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#e91e63' }}></div>
            <span className="text-sm text-gray-600">Rose : Dates de fin de stage</span>
          </div>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectEvent={handleEventClick}
        eventPropGetter={eventStyleGetter}
        defaultDate={new Date(2025, 4, 1)} // Forcer l'affichage de mai 2025
        defaultView="month"
        views={['month', 'week', 'day', 'agenda']}
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
