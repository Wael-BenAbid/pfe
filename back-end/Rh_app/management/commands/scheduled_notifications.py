from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from Rh_app.models import Mission, Notification, User, EmailLog
from Rh_app.utils import send_email_notification
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Envoie des notifications planifiées à des heures spécifiques de la journée'

    def add_arguments(self, parser):
        parser.add_argument(
            '--time',
            type=str,
            choices=['morning', 'noon', 'evening'],
            help='Moment de la journée pour envoyer les notifications (morning=8h00, noon=11h30, evening=17h00)'
        )

    def handle(self, *args, **options):
        time_of_day = options.get('time')
        if not time_of_day:
            self.stdout.write(self.style.WARNING(
                "Veuillez spécifier le moment de la journée avec --time=morning|noon|evening"
            ))
            return

        # Date actuelle
        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)

        self.stdout.write(f"Exécution des notifications planifiées pour {time_of_day}")

        # Vérifier les missions en retard
        self.check_late_missions(time_of_day)
        
        # Vérifier les échéances approchantes
        self.check_upcoming_deadlines(time_of_day)

        self.stdout.write(self.style.SUCCESS(f"Notifications planifiées terminées pour {time_of_day}"))

    def check_late_missions(self, time_of_day):
        """Vérifie les missions en retard et envoie des notifications selon l'heure de la journée"""
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
            # Mettre à jour le statut uniquement si ce n'est pas déjà fait
            if mission.status != 'late':
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

            # Envoyer un email selon l'heure de la journée et le type d'utilisateur
            self.send_late_mission_email(mission, time_of_day)

        self.stdout.write(self.style.SUCCESS(f"Vérification terminée. {updated_count} missions mises à jour en 'late'."))

    def check_upcoming_deadlines(self, time_of_day):
        """Vérifie les missions dont la date limite approche et envoie des notifications selon l'heure de la journée"""
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
            # Créer une notification dans l'application (une seule fois par jour, le matin)
            if time_of_day == 'morning':
                # Vérifier si une notification a déjà été créée aujourd'hui
                existing_notification = Notification.objects.filter(
                    user=mission.assigned_to,
                    title="Date limite de mission approche",
                    created_at__date=today
                ).exists()

                if not existing_notification:
                    Notification.objects.create(
                        user=mission.assigned_to,
                        title="Date limite de mission approche",
                        message=f"La mission '{mission.title}' doit être terminée demain ({mission.deadline.strftime('%d/%m/%Y')}).",
                        type="warning"
                    )
                    notified_count += 1

                    # Notification pour le superviseur
                    if mission.supervisor and mission.supervisor.user_type in ['employee', 'admin']:
                        Notification.objects.create(
                            user=mission.supervisor,
                            title="Date limite de mission supervisée approche",
                            message=f"La mission '{mission.title}' assignée à {mission.assigned_to.first_name} {mission.assigned_to.last_name} doit être terminée demain ({mission.deadline.strftime('%d/%m/%Y')}).",
                            type="warning"
                        )

            # Envoyer un email selon l'heure de la journée et le type d'utilisateur
            self.send_upcoming_deadline_email(mission, time_of_day)

        self.stdout.write(self.style.SUCCESS(f"Vérification terminée. {notified_count} notifications créées pour les échéances approchantes."))

    def send_late_mission_email(self, mission, time_of_day):
        """Envoie un email pour une mission en retard selon l'heure de la journée et le type d'utilisateur"""
        today = timezone.now().date()
        user = mission.assigned_to
        user_type = user.user_type

        # Vérifier si un email a déjà été envoyé aujourd'hui pour cette mission
        email_already_sent = EmailLog.objects.filter(
            user=user,
            email_type='late_mission',
            reference_id=mission.id,
            created_at__date=today
        ).exists()

        # Pour les employés, envoyer des emails à tous les moments de la journée
        # Pour les stagiaires, envoyer uniquement le matin
        should_send = False
        if user_type == 'employee':
            should_send = True
        elif user_type == 'intern' and time_of_day == 'morning':
            should_send = True

        if should_send and not email_already_sent:
            try:
                subject = f"Mission en retard : {mission.title}"
                message = (
                    f"Bonjour {user.first_name} {user.last_name},\n\n"
                    f"La mission suivante est en retard :\n\n"
                    f"Titre : {mission.title}\n"
                    f"Description : {mission.description}\n"
                    f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y')}\n\n"
                    f"Veuillez compléter cette mission dès que possible.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe RH"
                )

                send_email_notification(
                    subject=subject,
                    message=message,
                    recipient_list=[user.email],
                    email_type='late_mission',
                    reference_id=mission.id
                )
                self.stdout.write(self.style.SUCCESS(
                    f"Email envoyé à {user.email} concernant la mission en retard '{mission.title}'"
                ))
            except Exception as e:
                self.stdout.write(self.style.WARNING(
                    f"Erreur lors de l'envoi de l'email à {user.email}: {str(e)}"
                ))

    def send_upcoming_deadline_email(self, mission, time_of_day):
        """Envoie un email pour une mission dont la date limite approche selon l'heure de la journée et le type d'utilisateur"""
        today = timezone.now().date()
        user = mission.assigned_to
        user_type = user.user_type

        # Vérifier si un email a déjà été envoyé aujourd'hui pour cette mission
        email_already_sent = EmailLog.objects.filter(
            user=user,
            email_type='upcoming_deadline',
            reference_id=mission.id,
            created_at__date=today
        ).exists()

        # Pour les employés, envoyer des emails à tous les moments de la journée
        # Pour les stagiaires, ne pas envoyer d'emails pour les échéances approchantes
        should_send = False
        if user_type == 'employee':
            should_send = True

        if should_send and not email_already_sent:
            try:
                subject = f"Rappel : Date limite de mission demain - {mission.title}"
                message = (
                    f"Bonjour {user.first_name} {user.last_name},\n\n"
                    f"La mission suivante doit être terminée demain :\n\n"
                    f"Titre : {mission.title}\n"
                    f"Description : {mission.description}\n"
                    f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y')}\n\n"
                    f"Veuillez compléter cette mission avant la date limite pour éviter qu'elle ne soit marquée en retard.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe RH"
                )

                send_email_notification(
                    subject=subject,
                    message=message,
                    recipient_list=[user.email],
                    email_type='upcoming_deadline',
                    reference_id=mission.id
                )
                self.stdout.write(self.style.SUCCESS(
                    f"Email envoyé à {user.email} concernant la mission avec échéance approchante '{mission.title}'"
                ))
            except Exception as e:
                self.stdout.write(self.style.WARNING(
                    f"Erreur lors de l'envoi de l'email à {user.email}: {str(e)}"
                ))
