from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
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

    def create(self, request, *args, **kwargs):
        """
        Surcharge de la méthode create pour envoyer un email lors de la création d'une mission
        """
        # Créer la mission
        response = super().create(request, *args, **kwargs)

        # Récupérer la mission créée
        mission_id = response.data.get('id')
        if not mission_id:
            return response

        mission = Mission.objects.get(id=mission_id)

        # Envoyer un email à l'utilisateur assigné
        if mission.assigned_to:
            try:
                from .utils import send_email_notification
                subject = f"Nouvelle mission assignée : {mission.title}"
                message = (
                    f"Bonjour {mission.assigned_to.first_name} {mission.assigned_to.last_name},\n\n"
                    f"Une nouvelle mission vous a été assignée :\n\n"
                    f"Titre : {mission.title}\n"
                    f"Description : {mission.description}\n"
                    f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y') if mission.deadline else 'Non définie'}\n\n"
                    f"Veuillez compléter cette mission avant la date limite.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe RH"
                )

                # Envoyer l'email
                send_email_notification(
                    subject=subject,
                    message=message,
                    recipient_list=[mission.assigned_to.email],
                    email_type='mission_created',
                    reference_id=mission.id
                )
                print(f"Email de création de mission envoyé à {mission.assigned_to.email}")
            except Exception as e:
                print(f"Erreur lors de l'envoi de l'email à {mission.assigned_to.email}: {str(e)}")

        # Envoyer un email au superviseur si différent de l'utilisateur qui crée
        if mission.supervisor and mission.supervisor != request.user:
            try:
                from .utils import send_email_notification
                subject = f"Nouvelle mission à superviser : {mission.title}"
                message = (
                    f"Bonjour {mission.supervisor.first_name} {mission.supervisor.last_name},\n\n"
                    f"Une nouvelle mission a été créée et vous êtes désigné comme superviseur :\n\n"
                    f"Titre : {mission.title}\n"
                    f"Description : {mission.description}\n"
                    f"Assignée à : {mission.assigned_to.first_name} {mission.assigned_to.last_name}\n"
                    f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y') if mission.deadline else 'Non définie'}\n\n"
                    f"Veuillez suivre l'avancement de cette mission.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe RH"
                )

                # Envoyer l'email
                send_email_notification(
                    subject=subject,
                    message=message,
                    recipient_list=[mission.supervisor.email],
                    email_type='mission_created',
                    reference_id=mission.id
                )
                print(f"Email de création de mission envoyé au superviseur {mission.supervisor.email}")
            except Exception as e:
                print(f"Erreur lors de l'envoi de l'email au superviseur {mission.supervisor.email}: {str(e)}")

        # Enregistrer l'activité système
        from .models import SystemActivity
        SystemActivity.objects.create(
            action_type="create",
            action="Mission Created",
            user=request.user,
            details=f"Mission '{mission.title}' créée",
            resource_type="Mission",
            resource_id=mission.id
        )

        return response

    def destroy(self, request, *args, **kwargs):
        """
        Surcharge de la méthode destroy pour envoyer un email lors de la suppression d'une mission
        """
        mission = self.get_object()

        # Récupérer les informations de la mission avant de la supprimer
        mission_title = mission.title
        mission_description = mission.description
        mission_deadline = mission.deadline
        assigned_to = mission.assigned_to
        supervisor = mission.supervisor

        # Supprimer la mission
        response = super().destroy(request, *args, **kwargs)

        # Envoyer un email à l'utilisateur assigné
        if assigned_to:
            try:
                from .utils import send_email_notification
                subject = f"Mission supprimée : {mission_title}"
                message = (
                    f"Bonjour {assigned_to.first_name} {assigned_to.last_name},\n\n"
                    f"La mission suivante a été supprimée :\n\n"
                    f"Titre : {mission_title}\n"
                    f"Description : {mission_description}\n"
                    f"Date d'échéance : {mission_deadline.strftime('%d/%m/%Y') if mission_deadline else 'Non définie'}\n\n"
                    f"Si vous avez des questions, veuillez contacter votre superviseur.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe RH"
                )

                # Envoyer l'email
                send_email_notification(
                    subject=subject,
                    message=message,
                    recipient_list=[assigned_to.email],
                    email_type='mission_deleted',
                    reference_id=None
                )
                print(f"Email de suppression de mission envoyé à {assigned_to.email}")
            except Exception as e:
                print(f"Erreur lors de l'envoi de l'email à {assigned_to.email}: {str(e)}")

        # Envoyer un email au superviseur si différent de l'utilisateur qui supprime
        if supervisor and supervisor != request.user:
            try:
                from .utils import send_email_notification
                subject = f"Mission que vous supervisez supprimée : {mission_title}"
                message = (
                    f"Bonjour {supervisor.first_name} {supervisor.last_name},\n\n"
                    f"La mission suivante que vous supervisiez a été supprimée :\n\n"
                    f"Titre : {mission_title}\n"
                    f"Description : {mission_description}\n"
                    f"Assignée à : {assigned_to.first_name} {assigned_to.last_name}\n"
                    f"Date d'échéance : {mission_deadline.strftime('%d/%m/%Y') if mission_deadline else 'Non définie'}\n\n"
                    f"Cordialement,\n"
                    f"L'équipe RH"
                )

                # Envoyer l'email
                send_email_notification(
                    subject=subject,
                    message=message,
                    recipient_list=[supervisor.email],
                    email_type='mission_deleted',
                    reference_id=None
                )
                print(f"Email de suppression de mission envoyé au superviseur {supervisor.email}")
            except Exception as e:
                print(f"Erreur lors de l'envoi de l'email au superviseur {supervisor.email}: {str(e)}")

        # Enregistrer l'activité système
        from .models import SystemActivity
        SystemActivity.objects.create(
            action_type="delete",
            action="Mission Deleted",
            user=request.user,
            details=f"Mission '{mission_title}' supprimée",
            resource_type="Mission",
            resource_id=None
        )

        return response

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

        # Enregistrer l'activité système
        from .models import SystemActivity
        SystemActivity.objects.create(
            action_type="complete",
            action="Mission Completed",
            user=request.user,
            details=f"Mission '{mission.title}' completed",
            resource_type="Mission",
            resource_id=mission.id
        )

        # Enregistrer la métrique Prometheus
        from .prometheus_metrics import mission_actions_total
        mission_actions_total.labels(action='completed', user_type=request.user.user_type).inc()

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

        # Récupérer à la fois les missions en attente et celles déjà marquées comme en retard
        # pour s'assurer que les notifications sont créées pour toutes les missions en retard
        late_missions = Mission.objects.filter(
            Q(status='pending', completed=False, deadline__lt=today) |
            Q(status='late', completed=False)
        )

        # Mettre à jour le statut des missions en retard
        updated_count = 0
        notification_count = 0
        for mission in late_missions:
            # Mettre à jour le statut si nécessaire
            if mission.status != 'late':
                mission.status = 'late'
                mission.save()
                updated_count += 1

            # Vérifier si une notification similaire existe déjà pour l'assigné
            notification_message = f"La mission '{mission.title}' est en retard. La date d'échéance était le {mission.deadline.strftime('%d/%m/%Y')}."
            existing_notification = Notification.objects.filter(
                user=mission.assigned_to,
                title="Mission en retard",
                message=notification_message,
                type="error"
            ).exists()

            # Créer une notification seulement si elle n'existe pas déjà
            if not existing_notification:
                Notification.objects.create(
                    user=mission.assigned_to,
                    title="Mission en retard",
                    message=notification_message,
                    type="error"
                )
                notification_count += 1

            # Vérifier si une notification similaire existe déjà pour le superviseur
            if mission.supervisor:
                supervisor_notification_message = f"La mission '{mission.title}' assignée à {mission.assigned_to.first_name} {mission.assigned_to.last_name} est en retard. La date d'échéance était le {mission.deadline.strftime('%d/%m/%Y')}."
                existing_supervisor_notification = Notification.objects.filter(
                    user=mission.supervisor,
                    title="Mission supervisée en retard",
                    message=supervisor_notification_message,
                    type="error"
                ).exists()

                # Créer une notification seulement si elle n'existe pas déjà
                if not existing_supervisor_notification:
                    Notification.objects.create(
                        user=mission.supervisor,
                        title="Mission supervisée en retard",
                        message=supervisor_notification_message,
                        type="error"
                    )
                    notification_count += 1

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

                # Envoyer l'email sans limitation
                send_email_notification(
                    subject=subject,
                    message=message,
                    recipient_list=[mission.assigned_to.email],
                    email_type='late_mission',
                    reference_id=mission.id
                )
            except Exception as e:
                print(f"Erreur lors de l'envoi de l'email à {mission.assigned_to.email}: {str(e)}")

        print(f"Vérification des missions en retard terminée: {updated_count} missions mises à jour, {notification_count} notifications créées")

        return Response({
            'status': 'late missions checked',
            'updated_count': updated_count,
            'notification_count': notification_count,
            'message': f"{updated_count} missions mises à jour, {notification_count} notifications créées"
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
        notification_count = 0
        for mission in upcoming_missions:
            # Vérifier si une notification similaire existe déjà pour l'utilisateur assigné
            notification_message = f"La mission '{mission.title}' doit être terminée demain ({mission.deadline.strftime('%d/%m/%Y')})."
            existing_notification = Notification.objects.filter(
                user=mission.assigned_to,
                title="Date limite de mission approche",
                message=notification_message,
                type="warning"
            ).exists()

            # Créer une notification seulement si elle n'existe pas déjà
            if not existing_notification:
                Notification.objects.create(
                    user=mission.assigned_to,
                    title="Date limite de mission approche",
                    message=notification_message,
                    type="warning"
                )
                notification_count += 1

            # Vérifier si une notification similaire existe déjà pour le superviseur
            if mission.supervisor and mission.supervisor.user_type in ['employee', 'admin']:
                supervisor_notification_message = f"La mission '{mission.title}' assignée à {mission.assigned_to.first_name} {mission.assigned_to.last_name} doit être terminée demain ({mission.deadline.strftime('%d/%m/%Y')})."
                existing_supervisor_notification = Notification.objects.filter(
                    user=mission.supervisor,
                    title="Date limite de mission supervisée approche",
                    message=supervisor_notification_message,
                    type="warning"
                ).exists()

                # Créer une notification seulement si elle n'existe pas déjà
                if not existing_supervisor_notification:
                    Notification.objects.create(
                        user=mission.supervisor,
                        title="Date limite de mission supervisée approche",
                        message=supervisor_notification_message,
                        type="warning"
                    )
                    notification_count += 1

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

                # Envoyer l'email sans limitation
                send_email_notification(
                    subject=subject,
                    message=message,
                    recipient_list=[mission.assigned_to.email],
                    email_type='upcoming_deadline',
                    reference_id=mission.id
                )
                notified_count += 1
            except Exception as e:
                print(f"Erreur lors de l'envoi de l'email à {mission.assigned_to.email}: {str(e)}")

        print(f"Vérification des deadlines approchantes terminée: {notification_count} notifications créées, {notified_count} emails envoyés")

        return Response({
            'status': 'upcoming deadlines checked',
            'notification_count': notification_count,
            'email_count': notified_count,
            'message': f"{notification_count} notifications créées, {notified_count} emails envoyés"
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

# Fonctions de vue pour les endpoints spécifiques
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mission_supervised(request):
    """
    Récupérer les missions supervisées par l'utilisateur
    """
    viewset = MissionViewSet()
    viewset.request = request
    return viewset.supervised(request)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mission_assigned(request):
    """
    Récupérer les missions assignées à l'utilisateur
    """
    viewset = MissionViewSet()
    viewset.request = request
    return viewset.assigned(request)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mission_stats(request):
    """
    Récupérer les statistiques des missions pour l'utilisateur
    """
    viewset = MissionViewSet()
    viewset.request = request
    return viewset.stats(request)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mission_check_late(request):
    """
    Vérifier les missions en retard et mettre à jour leur statut
    """
    viewset = MissionViewSet()
    viewset.request = request
    return viewset.check_late_missions(request)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mission_check_upcoming(request):
    """
    Vérifier les missions dont la date limite approche et envoyer des notifications
    """
    viewset = MissionViewSet()
    viewset.request = request
    return viewset.check_upcoming_deadlines(request)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mission_complete(request, pk):
    """
    Marquer une mission comme complétée
    """
    viewset = MissionViewSet()
    viewset.request = request
    viewset.kwargs = {'pk': pk}
    return viewset.complete_mission(request)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mission_apply_penalty(request, pk):
    """
    Appliquer une pénalité pour une mission en retard
    """
    viewset = MissionViewSet()
    viewset.request = request
    viewset.kwargs = {'pk': pk}
    return viewset.apply_penalty(request)
