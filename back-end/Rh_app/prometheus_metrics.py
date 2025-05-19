from prometheus_client import Counter, Histogram, Gauge
import time

# Définir des métriques personnalisées pour l'application RH

# Compteurs pour les utilisateurs
users_total = Gauge(
    'rh_users_total', 
    'Total number of users by type',
    ['user_type']
)

# Compteurs pour les missions
missions_total = Gauge(
    'rh_missions_total',
    'Total number of missions by status',
    ['status']
)

# Compteurs pour les congés
leaves_total = Gauge(
    'rh_leaves_total',
    'Total number of leave requests by status',
    ['status']
)

# Compteurs pour les heures de travail
work_hours_total = Gauge(
    'rh_work_hours_total',
    'Total work hours recorded',
    ['user_type']
)

# Compteurs pour les stages
internships_total = Gauge(
    'rh_internships_total',
    'Total number of internships by status',
    ['status']
)

# Compteurs pour les candidatures
applications_total = Gauge(
    'rh_applications_total',
    'Total number of job applications by status',
    ['status']
)

# Compteurs pour les réunions
meetings_total = Gauge(
    'rh_meetings_total',
    'Total number of meetings by status',
    ['status']
)

# Compteurs pour les notifications
notifications_total = Gauge(
    'rh_notifications_total',
    'Total number of notifications by status',
    ['status']
)

# Compteurs pour les messages
messages_total = Gauge(
    'rh_messages_total',
    'Total number of messages',
    ['is_important']
)

# Histogrammes pour les temps de réponse
api_request_duration = Histogram(
    'rh_api_request_duration_seconds',
    'API request duration in seconds',
    ['endpoint', 'method']
)

# Compteurs pour les actions utilisateur
user_actions_total = Counter(
    'rh_user_actions_total',
    'Total number of user actions',
    ['action_type', 'user_type']
)

# Fonction pour mettre à jour les métriques
def update_metrics():
    from .models import User, Mission, Leave, WorkHours, Internship, JobApplication, Meeting, Notification, Message
    
    # Mettre à jour les compteurs d'utilisateurs
    users_total.labels(user_type='admin').set(User.objects.filter(is_staff=True).count())
    users_total.labels(user_type='employee').set(User.objects.filter(is_staff=False, user_type='employee').count())
    users_total.labels(user_type='intern').set(User.objects.filter(is_staff=False, user_type='intern').count())
    
    # Mettre à jour les compteurs de missions
    missions_total.labels(status='pending').set(Mission.objects.filter(status='pending').count())
    missions_total.labels(status='in_progress').set(Mission.objects.filter(status='in_progress').count())
    missions_total.labels(status='completed').set(Mission.objects.filter(status='completed').count())
    missions_total.labels(status='late').set(Mission.objects.filter(status='late').count())
    
    # Mettre à jour les compteurs de congés
    leaves_total.labels(status='pending').set(Leave.objects.filter(status='pending').count())
    leaves_total.labels(status='approved').set(Leave.objects.filter(status='approved').count())
    leaves_total.labels(status='rejected').set(Leave.objects.filter(status='rejected').count())
    
    # Mettre à jour les compteurs d'heures de travail
    work_hours_total.labels(user_type='employee').set(WorkHours.objects.filter(user__user_type='employee').count())
    
    # Mettre à jour les compteurs de stages
    internships_total.labels(status='active').set(Internship.objects.filter(status='active').count())
    internships_total.labels(status='completed').set(Internship.objects.filter(status='completed').count())
    
    # Mettre à jour les compteurs de candidatures
    applications_total.labels(status='pending').set(JobApplication.objects.filter(status='pending').count())
    applications_total.labels(status='approved').set(JobApplication.objects.filter(status='approved').count())
    applications_total.labels(status='rejected').set(JobApplication.objects.filter(status='rejected').count())
    
    # Mettre à jour les compteurs de réunions
    meetings_total.labels(status='scheduled').set(Meeting.objects.filter(status='scheduled').count())
    meetings_total.labels(status='cancelled').set(Meeting.objects.filter(status='cancelled').count())
    meetings_total.labels(status='completed').set(Meeting.objects.filter(status='completed').count())
    
    # Mettre à jour les compteurs de notifications
    notifications_total.labels(status='unread').set(Notification.objects.filter(is_read=False).count())
    notifications_total.labels(status='read').set(Notification.objects.filter(is_read=True).count())
    
    # Mettre à jour les compteurs de messages
    messages_total.labels(is_important='true').set(Message.objects.filter(is_important=True).count())
    messages_total.labels(is_important='false').set(Message.objects.filter(is_important=False).count())

# Classe pour mesurer le temps d'exécution des requêtes API
class PrometheusMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        # Mettre à jour les métriques au démarrage
        try:
            update_metrics()
        except:
            # Ignorer les erreurs lors du démarrage (tables non créées, etc.)
            pass

    def __call__(self, request):
        if request.path.startswith('/api/'):
            start_time = time.time()
            response = self.get_response(request)
            duration = time.time() - start_time
            
            # Enregistrer la durée de la requête API
            endpoint = request.path.split('?')[0]  # Ignorer les paramètres de requête
            api_request_duration.labels(
                endpoint=endpoint,
                method=request.method
            ).observe(duration)
            
            # Mettre à jour les métriques après chaque requête API
            try:
                update_metrics()
            except:
                # Ignorer les erreurs de mise à jour des métriques
                pass
            
            return response
        else:
            return self.get_response(request)
