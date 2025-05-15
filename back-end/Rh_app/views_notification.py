from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Notification
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
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            return Notification.objects.all()
        return Notification.objects.filter(user=user)

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
