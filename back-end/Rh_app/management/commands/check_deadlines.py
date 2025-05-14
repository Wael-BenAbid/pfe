from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from Rh_app.models import Mission, Notification

class Command(BaseCommand):
    help = 'Vérifie les missions dont la date limite approche et envoie des notifications'

    def handle(self, *args, **options):
        # Date actuelle
        now = timezone.now().date()
        
        # Date de demain
        tomorrow = now + timedelta(days=1)
        
        # Récupérer toutes les missions non complétées dont la date limite est demain
        missions = Mission.objects.filter(
            deadline=tomorrow,
            completed=False
        )
        
        self.stdout.write(f"Vérification de {missions.count()} missions avec échéance demain")
        
        # Pour chaque mission, créer une notification
        for mission in missions:
            # Créer une notification pour l'utilisateur assigné
            Notification.objects.create(
                user=mission.assigned_to,
                title="Échéance imminente",
                message=f"La mission '{mission.title}' doit être terminée demain.",
                type="warning"
            )
            
            self.stdout.write(self.style.SUCCESS(
                f"Notification créée pour {mission.assigned_to.username} concernant la mission '{mission.title}'"
            ))
        
        self.stdout.write(self.style.SUCCESS(f"Vérification terminée. {missions.count()} notifications envoyées."))
