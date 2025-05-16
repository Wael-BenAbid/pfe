import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import InternMissionManagement from './InternMissionManagement';
import { Calendar as CalendarIcon, Briefcase as BriefcaseIcon, GraduationCap as GraduationCapIcon, X as XIcon } from 'lucide-react';

interface InternDetails {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_image?: string;
  github_profile?: string;
  user_type: string;
}

interface Internship {
  id: number;
  title: string;
  description: string;
  intern: number;
  supervisor: number;
  intern_details?: InternDetails;
  start_date: string;
  end_date: string;
  status: string;
}

const InternManagement: React.FC = () => {
  const { token, user } = useAuth();
  const [interns, setInterns] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntern, setSelectedIntern] = useState<Internship | null>(null);

  // États pour les formulaires
  const [showMeetingForm, setShowMeetingForm] = useState(false);

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    date_time: '',
    duration_minutes: 60,
    location_type: 'office',
    location_details: '',
    meeting_link: '',
    participant_id: 0
  });

  useEffect(() => {
    if (token) {
      fetchInterns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/internships/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrer pour ne garder que les stages supervisés par l'utilisateur actuel
        const supervisedInterns = data.filter((internship: Internship) =>
          internship.supervisor === user?.id && internship.status === 'ongoing'
        );

        // Récupérer les détails complets de chaque stagiaire
        const internsWithDetails = await Promise.all(
          supervisedInterns.map(async (internship) => {
            try {
              // Utiliser l'endpoint /internships/<id>/intern_details/ pour récupérer les détails du stagiaire
              const userResponse = await fetch(`${API_BASE_URL}/internships/${internship.id}/intern_details/`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              // Si l'utilisateur n'est pas trouvé, on arrête là
              if (!userResponse.ok) {
                console.log(`Détails du stagiaire pour l'internship ${internship.id} non trouvés (statut: ${userResponse.status})`);
                return internship;
              }

              if (userResponse.ok) {
                const userData = await userResponse.json();
                return {
                  ...internship,
                  intern_details: userData
                };
              }
              return internship;
            } catch (error) {
              console.error(`Error fetching details for intern ${internship.intern}:`, error);
              return internship;
            }
          })
        );

        setInterns(internsWithDetails);
      } else {
        console.error('Failed to fetch internships:', response.status);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedIntern) return;

    try {
      // Vérifier que les champs obligatoires sont remplis
      if (newMeeting.location_type === 'online' && !newMeeting.meeting_link) {
        alert('Veuillez fournir un lien de réunion pour les réunions en ligne.');
        return;
      }

      if ((newMeeting.location_type === 'office' || newMeeting.location_type === 'external') && !newMeeting.location_details) {
        alert('Veuillez fournir les détails du lieu pour les réunions en présentiel.');
        return;
      }

      // Vérifier si la date du rendez-vous est dans le passé
      const meetingDate = new Date(newMeeting.date_time);
      const now = new Date();

      if (meetingDate < now) {
        alert("La date et l'heure du rendez-vous ne peuvent pas être dans le passé. Veuillez choisir une date et une heure futures.");
        return;
      }

      // Afficher les données qui seront envoyées pour le débogage
      const meetingData = {
        title: newMeeting.title,
        description: newMeeting.description,
        date_time: newMeeting.date_time,
        duration_minutes: newMeeting.duration_minutes,
        location_type: newMeeting.location_type,
        location_details: newMeeting.location_details || '',
        meeting_link: newMeeting.meeting_link || '',
        // Nous n'avons pas besoin d'envoyer l'organisateur car il sera défini côté serveur
        // Nous n'avons pas besoin d'envoyer les participants car ils seront ajoutés après la création
      };

      console.log('Sending meeting data:', meetingData);

      // Créer la réunion
      const response = await fetch(`${API_BASE_URL}/meetings/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Vérifier si la réponse est OK
      if (response.ok) {
        let meetingResponse;
        try {
          meetingResponse = await response.json();
          console.log('Meeting created successfully:', meetingResponse);

          // Ajouter le stagiaire comme participant
          const addParticipantResponse = await fetch(`${API_BASE_URL}/meetings/${meetingResponse.id}/add_participant/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              participant_id: selectedIntern.intern
            })
          });

          console.log('Add participant response status:', addParticipantResponse.status);

          if (addParticipantResponse.ok) {
            // Réinitialiser le formulaire
            setNewMeeting({
              title: '',
              description: '',
              date_time: '',
              duration_minutes: 60,
              location_type: 'office',
              location_details: '',
              meeting_link: '',
              participant_id: 0
            });
            setShowMeetingForm(false);
            alert('Rendez-vous créé avec succès !');
          } else {
            let errorText = '';
            try {
              const errorData = await addParticipantResponse.json();
              errorText = JSON.stringify(errorData);
            } catch {
              // Si la réponse n'est pas du JSON valide, récupérer le texte brut
              errorText = await addParticipantResponse.text();
            }
            console.error('Failed to add participant:', errorText);
            alert(`Échec de l'ajout du participant au rendez-vous: ${errorText}`);
          }
        } catch (parseError) {
          console.error('Error parsing meeting response:', parseError);
          const responseText = await response.text();
          console.log('Raw response:', responseText);
          alert('Erreur lors de la création du rendez-vous: Réponse invalide du serveur');
        }
      } else {
        // Gérer les erreurs de réponse
        let errorMessage = `Erreur ${response.status}: `;
        try {
          const errorData = await response.json();
          errorMessage += JSON.stringify(errorData);
          console.error('Failed to create meeting:', errorData);
        } catch {
          // Si la réponse n'est pas du JSON valide, récupérer le texte brut
          const responseText = await response.text();
          errorMessage += responseText;
          console.error('Failed to create meeting, raw response:', responseText);
        }
        alert(`Échec de la création du rendez-vous: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert(`Erreur lors de la création du rendez-vous: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Chargement des stagiaires..." />;
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Gestion des Stagiaires</h2>

      {interns.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <GraduationCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun stagiaire trouvé</h3>
          <p className="mt-1 text-sm text-gray-500">
            Vous n'avez pas de stagiaires assignés actuellement.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Liste des stagiaires */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-md font-medium text-gray-900">Mes Stagiaires</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {interns.map((intern) => (
                <li key={intern.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden">
                        {intern.intern_details?.profile_image ? (
                          <img
                            src={intern.intern_details?.profile_image?.startsWith('http')
                              ? intern.intern_details.profile_image
                              : intern.intern_details?.profile_image
                                ? `${API_BASE_URL}${intern.intern_details.profile_image}`
                                : ''}
                            alt={`${intern.intern_details?.first_name || ''} ${intern.intern_details?.last_name || ''}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // Fallback en cas d'erreur de chargement de l'image
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.classList.add('bg-blue-100', 'flex', 'items-center', 'justify-center');
                              const span = document.createElement('span');
                              span.className = 'text-blue-800 font-semibold';
                              span.textContent = `${intern.intern_details?.first_name?.charAt(0) || ''}${intern.intern_details?.last_name?.charAt(0) || ''}`;
                              e.currentTarget.parentElement!.appendChild(span);
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-800 font-semibold">
                              {intern.intern_details?.first_name?.charAt(0) || ''}
                              {intern.intern_details?.last_name?.charAt(0) || ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {intern.intern_details
                            ? `${intern.intern_details.first_name || ''} ${intern.intern_details.last_name || ''}`
                            : `Stagiaire #${intern.intern}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {intern.intern_details?.email || intern.title || ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(intern.start_date).toLocaleDateString()} - {new Date(intern.end_date).toLocaleDateString()}
                        </div>
                        {intern.intern_details?.github_profile && (
                          <div className="text-xs text-blue-600 mt-1">
                            <a href={intern.intern_details.github_profile} target="_blank" rel="noopener noreferrer">
                              GitHub Profile
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<CalendarIcon className="h-4 w-4" />}
                        onClick={() => {
                          setSelectedIntern(intern);
                          setShowMeetingForm(true);
                        }}
                      >
                        Planifier RDV
                      </Button>
                    </div>
                  </div>

                  {/* Gestion des missions pour ce stagiaire */}
                  <InternMissionManagement
                    internId={intern.intern}
                    internName={intern.intern_details
                      ? `${intern.intern_details.first_name} ${intern.intern_details.last_name}`
                      : `Stagiaire #${intern.intern}`}
                  />
                </li>
              ))}
            </ul>
          </div>



          {/* Formulaire de création de rendez-vous */}
          {showMeetingForm && selectedIntern && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Nouveau Rendez-vous avec {selectedIntern.intern_details?.first_name || ''} {selectedIntern.intern_details?.last_name || ''}
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowMeetingForm(false)}
                    title="Fermer le formulaire"
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateMeeting} className="space-y-4">
                  <TextInput
                    label="Titre"
                    name="title"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={newMeeting.description}
                      onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                      rows={3}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Entrez une description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="date_time" className="block text-sm font-medium text-gray-700 mb-1">
                        Date et heure
                      </label>
                      <input
                        id="date_time"
                        name="date_time"
                        type="datetime-local"
                        value={newMeeting.date_time}
                        onChange={(e) => setNewMeeting({ ...newMeeting, date_time: e.target.value })}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">
                        Durée (minutes)
                      </label>
                      <select
                        id="duration_minutes"
                        name="duration_minutes"
                        value={newMeeting.duration_minutes}
                        onChange={(e) => setNewMeeting({ ...newMeeting, duration_minutes: parseInt(e.target.value) })}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 heure</option>
                        <option value="90">1h30</option>
                        <option value="120">2 heures</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="location_type" className="block text-sm font-medium text-gray-700 mb-1">
                      Type de lieu
                    </label>
                    <select
                      id="location_type"
                      name="location_type"
                      value={newMeeting.location_type}
                      onChange={(e) => setNewMeeting({ ...newMeeting, location_type: e.target.value })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      aria-label="Type de lieu"
                    >
                      <option value="office">Bureau</option>
                      <option value="online">En ligne</option>
                      <option value="external">Lieu externe</option>
                    </select>
                  </div>

                  {newMeeting.location_type === 'online' ? (
                    <TextInput
                      label="Lien de réunion"
                      name="meeting_link"
                      value={newMeeting.meeting_link}
                      onChange={(e) => setNewMeeting({ ...newMeeting, meeting_link: e.target.value })}
                      required
                    />
                  ) : (
                    <TextInput
                      label="Détails du lieu"
                      name="location_details"
                      value={newMeeting.location_details}
                      onChange={(e) => setNewMeeting({ ...newMeeting, location_details: e.target.value })}
                      required
                    />
                  )}

                  <div className="mt-5 sm:mt-6 flex space-x-2">
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full"
                      onClick={() => setShowMeetingForm(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      type="submit"
                    >
                      Créer Rendez-vous
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InternManagement;
