from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from .models import Mission, User, Notification
from .serializers import MissionSerializer

class MissionViewSet(viewsets.ModelViewSet):
    queryset = Mission.objects.all()
    serializer_class = MissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        """
        Limiter les résultats en fonction du type d'utilisateur
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            return Mission.objects.all()

        # Les employés peuvent voir les missions qu'ils supervisent et celles qui leur sont assignées
        if user.user_type == 'employee':
            return Mission.objects.filter(assigned_to=user) | Mission.objects.filter(supervisor=user)

        # Les stagiaires peuvent voir uniquement les missions qui leur sont assignées
        return Mission.objects.filter(assigned_to=user)

    @action(detail=False, methods=['get'])
    def supervised(self, request):
        """
        Récupérer les missions supervisées par l'utilisateur
        """
        user = request.user
        if user.user_type not in ['employee', 'admin'] and not user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        missions = Mission.objects.filter(supervisor=user)
        serializer = self.get_serializer(missions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def assigned(self, request):
        """
        Récupérer les missions assignées à l'utilisateur
        """
        user = request.user
        missions = Mission.objects.filter(assigned_to=user)
        serializer = self.get_serializer(missions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Récupérer les statistiques des missions pour l'utilisateur
        """
        user = request.user
        
        # Missions assignées à l'utilisateur
        assigned_missions = Mission.objects.filter(assigned_to=user)
        assigned_total = assigned_missions.count()
        assigned_completed = assigned_missions.filter(status='completed').count()
        assigned_pending = assigned_missions.filter(status='pending').count()
        assigned_late = assigned_missions.filter(status='late').count()
        
        # Missions supervisées par l'utilisateur (si employé ou admin)
        supervised_missions = Mission.objects.filter(supervisor=user) if user.user_type in ['employee', 'admin'] else []
        supervised_total = supervised_missions.count()
        supervised_completed = supervised_missions.filter(status='completed').count()
        supervised_pending = supervised_missions.filter(status='pending').count()
        supervised_late = supervised_missions.filter(status='late').count()
        
        return Response({
            'assigned': {
                'total': assigned_total,
                'completed': assigned_completed,
                'pending': assigned_pending,
                'late': assigned_late,
                'completion_rate': round((assigned_completed / assigned_total) * 100) if assigned_total > 0 else 0
            },
            'supervised': {
                'total': supervised_total,
                'completed': supervised_completed,
                'pending': supervised_pending,
                'late': supervised_late,
                'completion_rate': round((supervised_completed / supervised_total) * 100) if supervised_total > 0 else 0
            }
        })

    @action(detail=True, methods=['post'])
    def complete_mission(self, request, pk=None):
        """
        Marquer une mission comme complétée
        """
        mission = self.get_object()
        if (request.user != mission.assigned_to and
            request.user != mission.supervisor and
            request.user.user_type != 'admin' and
            not request.user.is_superuser):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Récupérer le lien de complétion s'il est fourni
        completion_link = request.data.get('completion_link', None)
        if completion_link:
            mission.completion_link = completion_link

        # Marquer la mission comme complétée
        mission.completed = True
        mission.status = 'completed'
        mission.completed_at = timezone.now()
        
        # Calculer la durée de travail
        if mission.created_at and mission.completed_at:
            mission.work_duration = mission.completed_at - mission.created_at
        
        mission.save()

        # Créer une notification pour le superviseur
        if mission.supervisor:
            Notification.objects.create(
                user=mission.supervisor,
                title="Mission completed",
                message=f"Mission '{mission.title}' has been completed by {mission.assigned_to.username}",
                notification_type="mission_completed",
                related_id=mission.id
            )

        return Response({
            'status': 'mission completed',
            'work_duration': str(mission.work_duration) if mission.work_duration else None
        })
