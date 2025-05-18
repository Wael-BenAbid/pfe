from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Notification, User
from .serializers import NotificationSerializer
import logging

logger = logging.getLogger(__name__)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Limiter les résultats aux notifications de l'utilisateur connecté
        Chaque utilisateur ne voit que ses propres notifications
        """
        user = self.request.user
        return Notification.objects.filter(user=user)

    def perform_create(self, serializer):
        """
        Associer la notification à l'utilisateur spécifié ou à l'utilisateur connecté
        """
        user_id = self.request.data.get('user')
        if user_id:
            # Si un ID utilisateur est fourni, créer la notification pour cet utilisateur
            try:
                user = User.objects.get(id=user_id)
                serializer.save(user=user)
                logger.info(f"Notification créée pour l'utilisateur {user.username} (ID: {user.id}) par {self.request.user.username}")
            except User.DoesNotExist:
                raise serializers.ValidationError({'user': 'User does not exist'})
        else:
            # Sinon, associer la notification à l'utilisateur connecté
            serializer.save(user=self.request.user)
            logger.info(f"Notification créée pour l'utilisateur connecté {self.request.user.username}")

    def destroy(self, request, *args, **kwargs):
        """
        Supprimer une notification
        """
        notification = self.get_object()
        if notification.user != request.user and not request.user.is_superuser and request.user.user_type != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        notification.delete()
        logger.info(f"Notification {notification.id} deleted by user {request.user.username}")
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """
        Marquer toutes les notifications de l'utilisateur comme lues
        """
        notifications = Notification.objects.filter(user=request.user)
        for notification in notifications:
            notification.read = True
            notification.save()
        return Response({'status': 'all notifications marked as read'})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Marquer une notification comme lue
        """
        notification = self.get_object()
        if notification.user != request.user and not request.user.is_superuser and request.user.user_type != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Marquer la notification comme lue au lieu de la supprimer
        notification.read = True
        notification.save()

        logger.info(f"Notification {notification.id} marked as read by user {request.user.username}")

        return Response({'status': 'notification marked as read'})

    @action(detail=False, methods=['delete'])
    def delete_all_read(self, request):
        """
        Supprimer toutes les notifications lues de l'utilisateur
        """
        notifications = Notification.objects.filter(user=request.user, read=True)
        count = notifications.count()
        notifications.delete()
        return Response({'status': f'{count} read notifications deleted'})

    @action(detail=False, methods=['delete'])
    def delete_all(self, request):
        """
        Supprimer toutes les notifications de l'utilisateur
        """
        notifications = Notification.objects.filter(user=request.user)
        count = notifications.count()
        notifications.delete()
        logger.info(f"Toutes les notifications ({count}) supprimées par l'utilisateur {request.user.username}")
        return Response({'status': f'{count} notifications deleted'})

    @action(detail=False, methods=['delete'])
    def clean_leave_notifications(self, request):
        """
        Nettoyer les notifications de congé obsolètes pour l'administrateur
        """
        logger.info(f"Méthode clean_leave_notifications appelée par {request.user.username}")

        if request.user.user_type != 'admin' and not request.user.is_superuser:
            logger.warning(f"Permission refusée pour {request.user.username} (type: {request.user.user_type})")
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Récupérer toutes les demandes de congé en attente
        from .models import Leave
        # Vérifier explicitement que le statut est 'pending' et pas autre chose
        pending_leaves = Leave.objects.filter(status='pending').count()

        # Log pour débogage
        logger.info(f"Nombre de demandes de congé en attente: {pending_leaves}")

        # Vérifier s'il y a des notifications pour des demandes qui ne sont plus en attente
        all_leave_notifications = Notification.objects.filter(
            title__contains='Demandes de congé en attente'
        )

        if all_leave_notifications.exists():
            logger.info(f"Nombre de notifications de congé trouvées: {all_leave_notifications.count()}")

            # Si aucune demande en attente mais des notifications existent, les supprimer
            if pending_leaves == 0:
                count = all_leave_notifications.count()
                all_leave_notifications.delete()
                logger.info(f"Suppression de toutes les notifications de congé car aucune demande en attente")
                return Response({'status': f'{count} leave notifications deleted'})

        # Maintenant, gérer les notifications pour l'utilisateur actuel
        user_notifications = Notification.objects.filter(
            user=request.user,
            title__contains='Demandes de congé en attente'
        )

        # Si aucune demande en attente, supprimer toutes les notifications de congé
        if pending_leaves == 0:
            count = user_notifications.count()
            if count > 0:
                user_notifications.delete()
                logger.info(f"Nettoyage des notifications de congé obsolètes pour {request.user.username}: {count} supprimées")
                return Response({'status': f'{count} leave notifications deleted'})
            else:
                logger.info(f"Aucune notification de congé à supprimer pour {request.user.username}")
                return Response({'status': 'no notifications to delete'})
        else:
            # Il y a des demandes en attente, mettre à jour ou créer une notification
            if user_notifications.exists():
                notification = user_notifications.first()
                notification.message = f"Vous avez {pending_leaves} demande(s) de congé en attente d'approbation"
                notification.save()
                logger.info(f"Mise à jour de la notification de congé pour {request.user.username}: {pending_leaves} en attente")
                return Response({'status': 'leave notification updated'})
            else:
                # Créer une nouvelle notification
                Notification.objects.create(
                    user=request.user,
                    title='Demandes de congé en attente',
                    message=f"Vous avez {pending_leaves} demande(s) de congé en attente d'approbation",
                    type='info'
                )
                logger.info(f"Création d'une notification de congé pour {request.user.username}: {pending_leaves} en attente")
                return Response({'status': 'leave notification created'})
