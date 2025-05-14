from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from Rh_app.models import Mission, Notification
from Rh_app.utils import send_email_notification

class Command(BaseCommand):
    help = 'Vérifie les missions dont la date limite approche et envoie des notifications'

    def handle(self, *args, **options):
        # Date actuelle
        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)

        # Récupérer toutes les missions en attente dont la date d'échéance est demain
        upcoming_missions = Mission.objects.filter(
            status='pending',
            completed=False,
            deadline=tomorrow
        )

        self.stdout.write(f"Vérification de {upcoming_missions.count()} missions dont la date limite est demain")

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
                self.stdout.write(self.style.SUCCESS(
                    f"Notification créée pour le superviseur {mission.supervisor.username} concernant la mission '{mission.title}'"
                ))

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
                self.stdout.write(self.style.SUCCESS(
                    f"Email envoyé à {mission.assigned_to.email} concernant la mission '{mission.title}'"
                ))
                notified_count += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(
                    f"Erreur lors de l'envoi de l'email à {mission.assigned_to.email}: {str(e)}"
                ))

        self.stdout.write(self.style.SUCCESS(f"Vérification terminée. {notified_count} notifications envoyées."))
