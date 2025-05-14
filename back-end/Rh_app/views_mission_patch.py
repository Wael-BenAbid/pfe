from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from .models import Mission, Notification
from .utils import send_email_notification
# Importer MissionViewSet depuis views si views_mission n'est pas disponible
try:
    from .views_mission import MissionViewSet
except ImportError:
    from .views import MissionViewSet

# Ajouter l'action check_late_missions à la classe MissionViewSet
def patch_mission_viewset():
    """
    Ajouter les actions check_late_missions et check_upcoming_deadlines à la classe MissionViewSet
    """
    @action(detail=False, methods=['post'])
    def check_late_missions(self, request):
        """
        Vérifier les missions en retard et mettre à jour leur statut
        """
        # Vérifier que l'utilisateur est un administrateur ou un employé
        if request.user.user_type not in ['admin', 'employee'] and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Récupérer toutes les missions en attente dont la date d'échéance est passée
        today = timezone.now().date()

        late_missions = Mission.objects.filter(
            status='pending',
            completed=False,
            deadline__lt=today
        )

    @action(detail=False, methods=['post'])
    def check_upcoming_deadlines(self, request):
        """
        Vérifier les missions dont la date limite approche et envoyer des notifications
        """
        # Vérifier que l'utilisateur est un administrateur ou un employé
        if request.user.user_type not in ['admin', 'employee'] and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Date actuelle
        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)

        # Récupérer toutes les missions en attente dont la date d'échéance est demain
        upcoming_missions = Mission.objects.filter(
            status='pending',
            completed=False,
            deadline=tomorrow
        )

        # Envoyer des notifications pour les missions dont la date limite approche
        notified_count = 0
        for mission in upcoming_missions:
            # Créer une notification pour l'utilisateur assigné
            Notification.objects.create(
                user=mission.assigned_to,
                title="Date limite de mission approche",
                message=f"La mission '{mission.title}' doit être terminée demain ({mission.deadline.strftime('%d/%m/%Y')}).",
                type="warning"
            )

            # Créer une notification pour le superviseur si c'est un employé
            if mission.supervisor and mission.supervisor.user_type in ['employee', 'admin']:
                Notification.objects.create(
                    user=mission.supervisor,
                    title="Date limite de mission supervisée approche",
                    message=f"La mission '{mission.title}' assignée à {mission.assigned_to.first_name} {mission.assigned_to.last_name} doit être terminée demain ({mission.deadline.strftime('%d/%m/%Y')}).",
                    type="warning"
                )

            # Envoyer un email à l'utilisateur assigné
            try:
                subject = f"Rappel : Date limite de mission demain - {mission.title}"
                message = (
                    f"Bonjour {mission.assigned_to.first_name} {mission.assigned_to.last_name},\n\n"
                    f"La mission suivante doit être terminée demain :\n\n"
                    f"Titre : {mission.title}\n"
                    f"Description : {mission.description}\n"
                    f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y')}\n\n"
                    f"Veuillez compléter cette mission avant la date limite pour éviter qu'elle ne soit marquée en retard.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe RH"
                )

                send_email_notification(subject, message, [mission.assigned_to.email])
                notified_count += 1
            except Exception as e:
                print(f"Erreur lors de l'envoi de l'email à {mission.assigned_to.email}: {str(e)}")

        return Response({
            'status': 'upcoming deadlines checked',
            'notified_count': notified_count
        })

    # Ajouter les méthodes à la classe MissionViewSet
    setattr(MissionViewSet, 'check_late_missions', check_late_missions)
    setattr(MissionViewSet, 'check_upcoming_deadlines', check_upcoming_deadlines)

    return
