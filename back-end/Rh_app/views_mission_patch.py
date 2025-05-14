from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from .models import Mission, Notification
# Importer MissionViewSet depuis views si views_mission n'est pas disponible
try:
    from .views_mission import MissionViewSet
except ImportError:
    from .views import MissionViewSet

# Ajouter l'action check_late_missions à la classe MissionViewSet
def patch_mission_viewset():
    """
    Ajouter l'action check_late_missions à la classe MissionViewSet
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

        # Mettre à jour le statut des missions en retard
        updated_count = 0
        for mission in late_missions:
            mission.status = 'late'
            mission.save()
            updated_count += 1

            # Créer une notification pour l'assigné
            Notification.objects.create(
                user=mission.assigned_to,
                title="Mission en retard",
                message=f"La mission '{mission.title}' est maintenant en retard. La date d'échéance était le {mission.deadline.strftime('%d/%m/%Y')}.",
                type="error"
            )

        return Response({
            'status': 'late missions checked',
            'updated_count': updated_count
        })

    # Ajouter la méthode à la classe MissionViewSet
    setattr(MissionViewSet, 'check_late_missions', check_late_missions)
