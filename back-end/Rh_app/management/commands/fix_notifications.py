from django.core.management.base import BaseCommand
from Rh_app.models import User, Notification, Mission
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Corrige et crée des notifications pour tous les utilisateurs'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Début de la correction des notifications...'))

        # Supprimer toutes les notifications existantes
        notification_count = Notification.objects.all().count()
        Notification.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Suppression de {notification_count} notifications existantes'))

        # Récupérer tous les utilisateurs
        users = User.objects.all()
        self.stdout.write(self.style.SUCCESS(f'Traitement de {users.count()} utilisateurs'))

        today = timezone.now().date()

        for user in users:
            self.stdout.write(f'Création de notifications pour {user.username} (ID: {user.id})')

            # 1. Notifications pour les missions en retard
            late_missions = Mission.objects.filter(
                assigned_to=user,
                status='late',
                completed=False
            )

            for mission in late_missions:
                Notification.objects.create(
                    user=user,
                    title="Mission en retard",
                    message=f"La mission '{mission.title}' est en retard. La date d'échéance était le {mission.deadline.strftime('%d/%m/%Y')}.",
                    type="error"
                )
                self.stdout.write(f'  - Notification de mission en retard créée: {mission.title}')

            # 2. Notifications pour les missions dont la date limite est aujourd'hui
            today_missions = Mission.objects.filter(
                assigned_to=user,
                status='pending',
                completed=False,
                deadline=today
            )

            for mission in today_missions:
                Notification.objects.create(
                    user=user,
                    title="Date limite de mission aujourd'hui",
                    message=f"La mission '{mission.title}' doit être terminée aujourd'hui ({mission.deadline.strftime('%d/%m/%Y')}).",
                    type="warning"
                )
                self.stdout.write(f'  - Notification de mission avec échéance aujourd\'hui créée: {mission.title}')

            # 3. Notifications pour les missions dont la date limite est demain
            tomorrow = today + timezone.timedelta(days=1)
            tomorrow_missions = Mission.objects.filter(
                assigned_to=user,
                status='pending',
                completed=False,
                deadline=tomorrow
            )

            for mission in tomorrow_missions:
                Notification.objects.create(
                    user=user,
                    title="Mission à terminer demain",
                    message=f"La mission '{mission.title}' doit être terminée demain ({mission.deadline.strftime('%d/%m/%Y')}).",
                    type="info"
                )
                self.stdout.write(f'  - Notification de mission avec échéance demain créée: {mission.title}')

            # 4. Notifications pour les superviseurs
            if user.user_type in ['employee', 'admin']:
                # Missions supervisées en retard
                supervised_late_missions = Mission.objects.filter(
                    supervisor=user,
                    status='late',
                    completed=False
                )

                for mission in supervised_late_missions:
                    # S'assurer que le nom complet du superviseur est inclus dans le message
                    supervisor_full_name = f"{user.first_name} {user.last_name}"
                    assigned_full_name = f"{mission.assigned_to.first_name} {mission.assigned_to.last_name}"

                    Notification.objects.create(
                        user=user,
                        title="Mission supervisée en retard",
                        message=f"La mission '{mission.title}' assignée à {assigned_full_name} est en retard. La date d'échéance était le {mission.deadline.strftime('%d/%m/%Y')}. Vous êtes le superviseur ({supervisor_full_name}) de cette mission.",
                        type="error"
                    )
                    self.stdout.write(f'  - Notification de mission supervisée en retard créée: {mission.title}')

                # Missions supervisées avec échéance aujourd'hui
                supervised_today_missions = Mission.objects.filter(
                    supervisor=user,
                    status='pending',
                    completed=False,
                    deadline=today
                )

                for mission in supervised_today_missions:
                    # S'assurer que le nom complet du superviseur est inclus dans le message
                    supervisor_full_name = f"{user.first_name} {user.last_name}"
                    assigned_full_name = f"{mission.assigned_to.first_name} {mission.assigned_to.last_name}"

                    Notification.objects.create(
                        user=user,
                        title="Mission supervisée avec échéance aujourd'hui",
                        message=f"La mission '{mission.title}' assignée à {assigned_full_name} doit être terminée aujourd'hui ({mission.deadline.strftime('%d/%m/%Y')}). Vous êtes le superviseur ({supervisor_full_name}) de cette mission.",
                        type="warning"
                    )
                    self.stdout.write(f'  - Notification de mission supervisée avec échéance aujourd\'hui créée: {mission.title}')

            # 5. Notification de bienvenue pour tous les utilisateurs
            Notification.objects.create(
                user=user,
                title="Bienvenue dans le système RH",
                message=f"Bonjour {user.first_name} {user.last_name}, bienvenue dans le système de gestion RH. Vous recevrez des notifications importantes ici.",
                type="info"
            )
            self.stdout.write(f'  - Notification de bienvenue créée')

        # Compter les nouvelles notifications
        new_notification_count = Notification.objects.all().count()
        self.stdout.write(self.style.SUCCESS(f'Correction terminée. {new_notification_count} nouvelles notifications créées.'))
