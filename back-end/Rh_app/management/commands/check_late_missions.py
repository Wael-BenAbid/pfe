from django.core.management.base import BaseCommand
from django.utils import timezone
from Rh_app.models import Mission, Notification
from Rh_app.utils import send_email_notification

class Command(BaseCommand):
    help = 'Vérifie les missions en retard et met à jour leur statut'

    def handle(self, *args, **options):
        # Date actuelle
        today = timezone.now().date()

        # Récupérer toutes les missions en attente dont la date d'échéance est passée
        late_missions = Mission.objects.filter(
            status='pending',
            completed=False,
            deadline__lt=today
        )

        self.stdout.write(f"Vérification de {late_missions.count()} missions en retard")

        # Mettre à jour le statut des missions en retard
        updated_count = 0
        for mission in late_missions:
            mission.status = 'late'
            mission.save()
            updated_count += 1

            # Créer une notification pour l'utilisateur assigné
            Notification.objects.create(
                user=mission.assigned_to,
                title="Mission en retard",
                message=f"La mission '{mission.title}' est maintenant en retard. La date d'échéance était le {mission.deadline.strftime('%d/%m/%Y')}.",
                type="error"
            )

            # Créer une notification pour le superviseur si c'est un employé
            if mission.supervisor and mission.supervisor.user_type in ['employee', 'admin']:
                Notification.objects.create(
                    user=mission.supervisor,
                    title="Mission supervisée en retard",
                    message=f"La mission '{mission.title}' assignée à {mission.assigned_to.first_name} {mission.assigned_to.last_name} est maintenant en retard. La date d'échéance était le {mission.deadline.strftime('%d/%m/%Y')}.",
                    type="error"
                )
                self.stdout.write(self.style.SUCCESS(
                    f"Notification créée pour le superviseur {mission.supervisor.username} concernant la mission '{mission.title}'"
                ))

            # Envoyer un email à l'utilisateur assigné
            try:
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
                self.stdout.write(self.style.SUCCESS(
                    f"Email envoyé à {mission.assigned_to.email} concernant la mission '{mission.title}'"
                ))
            except Exception as e:
                self.stdout.write(self.style.WARNING(
                    f"Erreur lors de l'envoi de l'email à {mission.assigned_to.email}: {str(e)}"
                ))

            self.stdout.write(self.style.SUCCESS(
                f"Mission '{mission.title}' mise à jour en 'late' pour {mission.assigned_to.username}"
            ))

        self.stdout.write(self.style.SUCCESS(f"Vérification terminée. {updated_count} missions mises à jour."))
