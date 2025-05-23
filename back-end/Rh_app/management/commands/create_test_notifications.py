from django.core.management.base import BaseCommand
from Rh_app.models import User, Notification
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Crée des notifications de test pour tous les utilisateurs'

    def handle(self, *args, **options):
        users = User.objects.all()
        
        for user in users:
            # Créer une notification de type info
            info_notification = Notification.objects.create(
                user=user,
                title="Notification d'information",
                message="Ceci est une notification d'information de test",
                type="info",
                read=False
            )
            
            # Créer une notification de type warning
            warning_notification = Notification.objects.create(
                user=user,
                title="Notification d'avertissement",
                message="Ceci est une notification d'avertissement de test",
                type="warning",
                read=False
            )
            
            # Créer une notification de type success
            success_notification = Notification.objects.create(
                user=user,
                title="Notification de succès",
                message="Ceci est une notification de succès de test",
                type="success",
                read=False
            )
            
            # Créer une notification de type error
            error_notification = Notification.objects.create(
                user=user,
                title="Notification d'erreur",
                message="Ceci est une notification d'erreur de test",
                type="error",
                read=False
            )
            
            self.stdout.write(self.style.SUCCESS(
                f"Créé 4 notifications de test pour l'utilisateur {user.username} (ID: {user.id})"
            ))
        
        self.stdout.write(self.style.SUCCESS(
            f"Créé {users.count() * 4} notifications de test au total"
        ))
