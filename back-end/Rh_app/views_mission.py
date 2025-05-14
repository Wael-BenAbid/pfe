from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .models import Mission, User, Notification, SystemActivity
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
        Ne pas inclure les missions assignées à l'administrateur
        """
        user = request.user
        if user.user_type not in ['employee', 'admin'] and not user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Filtrer les missions supervisées par l'utilisateur
        # Exclure les missions assignées à des administrateurs
        missions = Mission.objects.filter(supervisor=user).exclude(
            assigned_to__user_type='admin'
        )

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
                type="success"
            )

        return Response({
            'status': 'mission completed',
            'work_duration': str(mission.work_duration) if mission.work_duration else None
        })

    @action(detail=False, methods=['post'])
    def check_late_missions(self, request):
        """
        Vérifier les missions en retard et mettre à jour leur statut
        """
        # Permettre à tous les utilisateurs authentifiés d'appeler cette méthode
        # Les stagiaires doivent pouvoir vérifier les missions en retard

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

            # Créer une notification pour le superviseur
            if mission.supervisor:
                Notification.objects.create(
                    user=mission.supervisor,
                    title="Mission supervisée en retard",
                    message=f"La mission '{mission.title}' assignée à {mission.assigned_to.first_name} {mission.assigned_to.last_name} est maintenant en retard. La date d'échéance était le {mission.deadline.strftime('%d/%m/%Y')}.",
                    type="error"
                )

            # Envoyer un email à l'assigné
            try:
                from .utils import send_email_notification
                subject = f"Mission en retard : {mission.title}"
                message = (
                    f"Bonjour {mission.assigned_to.first_name} {mission.assigned_to.last_name},\n\n"
                    f"La mission suivante est maintenant en retard :\n\n"
                    f"Titre : {mission.title}\n"
                    f"Description : {mission.description}\n"
                    f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y')}\n\n"
                    f"Veuillez compléter cette mission dès que possible pour éviter une pénalité.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe RH"
                )

                send_email_notification(subject, message, [mission.assigned_to.email])
            except Exception as e:
                print(f"Erreur lors de l'envoi de l'email à {mission.assigned_to.email}: {str(e)}")

        return Response({
            'status': 'late missions checked',
            'updated_count': updated_count
        })

    @action(detail=False, methods=['post'])
    def check_upcoming_deadlines(self, request):
        """
        Vérifier les missions dont la date limite approche et envoyer des notifications
        """
        # Permettre à tous les utilisateurs authentifiés d'appeler cette méthode
        # Les stagiaires doivent pouvoir vérifier les missions dont la date limite approche

        # Date actuelle
        from datetime import timedelta
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
                from .utils import send_email_notification
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

    @action(detail=True, methods=['post'])
    def apply_penalty(self, request, pk=None):
        """
        Appliquer une pénalité à un utilisateur pour une mission en retard
        """
        mission = self.get_object()

        # Vérifier que l'utilisateur est un admin ou un employé
        if request.user.user_type not in ['admin', 'employee']:
            return Response(
                {'error': 'Seuls les administrateurs et les employés peuvent appliquer des pénalités'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Vérifier que la mission est en retard
        if mission.status != 'late':
            return Response(
                {'error': 'Seules les missions en retard peuvent recevoir une pénalité'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier que la mission n'est pas complétée
        if mission.completed:
            return Response(
                {'error': 'Les missions complétées ne peuvent pas recevoir de pénalité'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Récupérer l'utilisateur assigné à la mission
        user = mission.assigned_to

        # Vérifier que l'utilisateur est un employé
        if user.user_type != 'employee':
            return Response(
                {'error': 'Seuls les employés peuvent recevoir des pénalités'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Récupérer le nombre de jours de pénalité
        penalty_days = request.data.get('penalty_days', 1)

        try:
            penalty_days = int(penalty_days)
            if penalty_days <= 0:
                raise ValueError("Le nombre de jours doit être positif")
        except (ValueError, TypeError):
            return Response(
                {'error': 'Le nombre de jours de pénalité doit être un entier positif'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier que l'utilisateur a suffisamment de jours de congé
        if user.leave_balance < penalty_days:
            return Response(
                {'error': f"L'utilisateur n'a que {user.leave_balance} jour(s) de congé disponible(s)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Appliquer la pénalité
        user.leave_balance -= penalty_days
        user.save()

        # Créer une notification pour l'utilisateur
        Notification.objects.create(
            user=user,
            title="Pénalité appliquée",
            message=f"Une pénalité de {penalty_days} jour(s) a été appliquée pour la mission en retard '{mission.title}'",
            type="warning"
        )

        # Enregistrer l'activité
        SystemActivity.objects.create(
            action_type="update",
            action=f"Pénalité de {penalty_days} jour(s) appliquée",
            user=request.user,
            details=f"Pénalité appliquée à {user.username} pour la mission '{mission.title}'",
            resource_type="User",
            resource_id=user.id
        )

        return Response({
            'success': True,
            'penalty_days': penalty_days,
            'new_leave_balance': user.leave_balance,
            'message': f"Pénalité de {penalty_days} jour(s) appliquée avec succès"
        })
