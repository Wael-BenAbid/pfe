from prometheus_client import Counter, Histogram, Gauge, Summary
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

# Compteurs spécifiques pour les connexions/déconnexions
login_total = Counter(
    'rh_login_total',
    'Total number of login attempts',
    ['status', 'user_type']
)

logout_total = Counter(
    'rh_logout_total',
    'Total number of logouts',
    ['user_type']
)

# Compteurs pour les actions liées aux missions
mission_actions_total = Counter(
    'rh_mission_actions_total',
    'Total number of mission-related actions',
    ['action', 'user_type']
)

# Temps de session utilisateur
session_duration_seconds = Summary(
    'rh_session_duration_seconds',
    'User session duration in seconds',
    ['user_type']
)

# Fonction pour mettre à jour les métriques
def update_metrics():
    try:
        from .models import User, Mission, Leave, WorkHours, Internship, JobApplication, Meeting, Notification, Message, SystemActivity
        from django.utils import timezone
        from datetime import timedelta
    except ImportError as e:
        # Si les modèles ne peuvent pas être importés (tables non créées), ignorer
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Impossible d'importer les modèles pour les métriques: {e}")
        return

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
    notifications_total.labels(status='unread').set(Notification.objects.filter(read=False).count())
    notifications_total.labels(status='read').set(Notification.objects.filter(read=True).count())

    # Mettre à jour les compteurs de messages
    messages_total.labels(is_important='true').set(Message.objects.filter(is_important=True).count())
    messages_total.labels(is_important='false').set(Message.objects.filter(is_important=False).count())

    # Mettre à jour les statistiques d'activité système (dernières 24h)
    last_24h = timezone.now() - timedelta(days=1)

    # Statistiques de connexion/déconnexion par type d'utilisateur
    for user_type in ['admin', 'employee', 'intern']:
        # Compter les connexions réussies
        login_success_count = SystemActivity.objects.filter(
            action_type='login',
            created_at__gte=last_24h,
            user__user_type=user_type
        ).count()

        # Mettre à jour le compteur de connexions réussies
        user_actions_total.labels(action_type='login', user_type=user_type).inc(login_success_count)

        # Compter les déconnexions
        logout_count = SystemActivity.objects.filter(
            action_type='logout',
            created_at__gte=last_24h,
            user__user_type=user_type
        ).count()

        # Mettre à jour le compteur de déconnexions
        user_actions_total.labels(action_type='logout', user_type=user_type).inc(logout_count)

    # Statistiques des missions par type d'utilisateur
    for user_type in ['admin', 'employee']:
        # Compter les missions créées
        mission_created_count = SystemActivity.objects.filter(
            action_type='create',
            resource_type='Mission',
            created_at__gte=last_24h,
            user__user_type=user_type
        ).count()

        # Mettre à jour le compteur de missions créées
        mission_actions_total.labels(action='created', user_type=user_type).inc(mission_created_count)

        # Compter les missions complétées
        mission_completed_count = SystemActivity.objects.filter(
            action_type='complete',
            created_at__gte=last_24h,
            user__user_type=user_type
        ).count()

        # Mettre à jour le compteur de missions complétées
        mission_actions_total.labels(action='completed', user_type=user_type).inc(mission_completed_count)

        # Compter les missions mises à jour
        mission_updated_count = SystemActivity.objects.filter(
            action_type='update',
            resource_type='Mission',
            created_at__gte=last_24h,
            user__user_type=user_type
        ).count()

        # Mettre à jour le compteur de missions mises à jour
        mission_actions_total.labels(action='updated', user_type=user_type).inc(mission_updated_count)

# Classe pour mesurer le temps d'exécution des requêtes API
class PrometheusMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.metrics_enabled = True
        # Mettre à jour les métriques au démarrage
        try:
            update_metrics()
        except Exception as e:
            # Ignorer les erreurs lors du démarrage (tables non créées, etc.)
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Métriques Prometheus désactivées au démarrage: {e}")
            self.metrics_enabled = False

    def __call__(self, request):
        # Exclure les chemins de métriques et les fichiers statiques/média
        excluded_paths = ['/metrics/', '/static/', '/media/', '/admin/']

        # Vérifier si le chemin est une API
        is_api_path = any(request.path.startswith(f'/{endpoint}/') for endpoint in [
            'users', 'leaves', 'missions', 'work-hours', 'internships',
            'job-applications', 'user-sessions', 'meetings', 'notifications',
            'system-activities', 'token', 'auth', 'messages'
        ])

        # Ne pas traiter les chemins exclus
        if any(request.path.startswith(path) for path in excluded_paths):
            return self.get_response(request)

        # Traiter les chemins API
        if is_api_path:
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
            if self.metrics_enabled:
                try:
                    update_metrics()
                except Exception as e:
                    # Journaliser l'erreur mais ne pas interrompre la réponse
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Erreur lors de la mise à jour des métriques: {e}")
                    # Désactiver les métriques en cas d'erreur répétée
                    self.metrics_enabled = False

            return response
        else:
            return self.get_response(request)
