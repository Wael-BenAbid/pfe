import time
from django.utils import timezone
from .models import Mission, Notification
from .utils import send_email_notification

class CheckLateMissionsMiddleware:
    """
    Middleware pour vérifier périodiquement les missions en retard
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.last_check_time = None

    def __call__(self, request):
        # Vérifier les missions en retard au maximum une fois par heure
        current_time = timezone.now()

        # Si c'est la première requête ou si plus d'une heure s'est écoulée depuis la dernière vérification
        if self.last_check_time is None or (current_time - self.last_check_time).total_seconds() > 3600:
            # Date actuelle
            today = current_time.date()

            # Récupérer toutes les missions en attente dont la date d'échéance est passée
            late_missions = Mission.objects.filter(
                status='pending',
                completed=False,
                deadline__lt=today
            )

            # Mettre à jour le statut des missions en retard
            for mission in late_missions:
                mission.status = 'late'
                mission.save()

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
                    print(f"Email envoyé à {mission.assigned_to.email} concernant la mission '{mission.title}'")
                except Exception as e:
                    print(f"Erreur lors de l'envoi de l'email à {mission.assigned_to.email}: {str(e)}")

            # Mettre à jour le temps de dernière vérification
            self.last_check_time = current_time

        # Continuer le traitement de la requête
        response = self.get_response(request)
        return response
