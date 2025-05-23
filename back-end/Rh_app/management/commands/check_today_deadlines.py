from django.core.management.base import BaseCommand
from django.utils import timezone
from Rh_app.models import Mission, Notification
from Rh_app.utils import send_email_notification
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Vérifie les missions dont la date limite est aujourd\'hui et envoie des notifications'

    def handle(self, *args, **options):
        # Date actuelle
        today = timezone.now().date()

        # Récupérer toutes les missions en attente dont la date d'échéance est aujourd'hui
        today_missions = Mission.objects.filter(
            status='pending',
            completed=False,
            deadline=today
        )

        self.stdout.write(f"Vérification de {today_missions.count()} missions dont la date limite est aujourd'hui")

        # Envoyer des notifications pour les missions dont la date limite est aujourd'hui
        notified_count = 0
        for mission in today_missions:
            # Vérifier si une notification a déjà été créée aujourd'hui
            existing_notification = Notification.objects.filter(
                user=mission.assigned_to,
                title="Date limite de mission aujourd'hui",
                created_at__date=today
            ).exists()

            if not existing_notification:
                # Créer une notification pour l'utilisateur assigné
                Notification.objects.create(
                    user=mission.assigned_to,
                    title="Date limite de mission aujourd'hui",
                    message=f"La mission '{mission.title}' doit être terminée aujourd'hui ({mission.deadline.strftime('%d/%m/%Y')}).",
                    type="error"  # Utiliser le type error pour attirer l'attention
                )
                notified_count += 1

                # Créer une notification pour le superviseur si c'est un employé
                if mission.supervisor and mission.supervisor.user_type in ['employee', 'admin']:
                    Notification.objects.create(
                        user=mission.supervisor,
                        title="Date limite de mission supervisée aujourd'hui",
                        message=f"La mission '{mission.title}' assignée à {mission.assigned_to.first_name} {mission.assigned_to.last_name} doit être terminée aujourd'hui ({mission.deadline.strftime('%d/%m/%Y')}).",
                        type="error"
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f"Notification créée pour le superviseur {mission.supervisor.username} concernant la mission '{mission.title}'"
                    ))

                # Envoyer un email à l'utilisateur assigné
                try:
                    subject = f"URGENT : Date limite de mission aujourd'hui - {mission.title}"
                    message = (
                        f"Bonjour {mission.assigned_to.first_name} {mission.assigned_to.last_name},\n\n"
                        f"La mission suivante doit être terminée AUJOURD'HUI :\n\n"
                        f"Titre : {mission.title}\n"
                        f"Description : {mission.description}\n"
                        f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y')}\n\n"
                        f"Veuillez compléter cette mission avant la fin de la journée pour éviter qu'elle ne soit marquée en retard.\n\n"
                        f"Cordialement,\n"
                        f"L'équipe RH"
                    )

                    send_email_notification(
                        subject=subject,
                        message=message,
                        recipient_list=[mission.assigned_to.email],
                        email_type='today_deadline',
                        reference_id=mission.id
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f"Email envoyé à {mission.assigned_to.email} concernant la mission '{mission.title}'"
                    ))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(
                        f"Erreur lors de l'envoi de l'email à {mission.assigned_to.email}: {str(e)}"
                    ))

        self.stdout.write(self.style.SUCCESS(f"Vérification terminée. {notified_count} notifications envoyées."))
