from django.utils import timezone
from django.db.models.signals import post_save, pre_save, m2m_changed
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import Mission, Notification, UserSession, User, Internship, Message
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)

# Variable pour suivre la dernière vérification des missions en retard
last_check_time = None

@receiver(user_logged_in)
def check_late_missions_on_login(sender, user, request, **kwargs):
    """
    Vérifier les missions en retard lorsqu'un utilisateur se connecte
    """
    global last_check_time

    # Ne vérifier qu'une fois par heure maximum pour éviter de surcharger le système
    current_time = timezone.now()
    if last_check_time is None or (current_time - last_check_time).total_seconds() > 3600:
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
                # S'assurer que le nom complet du superviseur est inclus dans le message
                supervisor_full_name = f"{mission.supervisor.first_name} {mission.supervisor.last_name}"
                assigned_full_name = f"{mission.assigned_to.first_name} {mission.assigned_to.last_name}"

                Notification.objects.create(
                    user=mission.supervisor,
                    title="Mission supervisée en retard",
                    message=f"La mission '{mission.title}' assignée à {assigned_full_name} est maintenant en retard. La date d'échéance était le {mission.deadline.strftime('%d/%m/%Y')}. Vous êtes le superviseur ({supervisor_full_name}) de cette mission.",
                    type="error"
                )

        # Mettre à jour le temps de dernière vérification
        last_check_time = current_time

        # Vérifier également les missions dont la date limite est aujourd'hui
        today_missions = Mission.objects.filter(
            status='pending',
            completed=False,
            deadline=today
        )

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

                # Créer une notification pour le superviseur si c'est un employé
                if mission.supervisor and mission.supervisor.user_type in ['employee', 'admin']:
                    # S'assurer que le nom complet du superviseur est inclus dans le message
                    supervisor_full_name = f"{mission.supervisor.first_name} {mission.supervisor.last_name}"
                    assigned_full_name = f"{mission.assigned_to.first_name} {mission.assigned_to.last_name}"

                    Notification.objects.create(
                        user=mission.supervisor,
                        title="Date limite de mission supervisée aujourd'hui",
                        message=f"La mission '{mission.title}' assignée à {assigned_full_name} doit être terminée aujourd'hui ({mission.deadline.strftime('%d/%m/%Y')}). Vous êtes le superviseur ({supervisor_full_name}) de cette mission.",
                        type="error"
                    )

# Gérer les connexions et déconnexions des utilisateurs
@receiver(user_logged_in)
def user_logged_in_notification(sender, user, request, **kwargs):
    """
    Créer une notification pour les administrateurs lorsqu'un utilisateur se connecte
    """
    # Créer une session utilisateur
    session = UserSession.objects.create(
        user=user,
        login_time=timezone.now(),
        is_active=True
    )

    # Créer une notification pour les administrateurs
    admin_users = User.objects.filter(user_type='admin')
    for admin in admin_users:
        if admin.id != user.id:  # Ne pas notifier l'admin de sa propre connexion
            Notification.objects.create(
                user=admin,
                title="Connexion d'utilisateur",
                message=f"{user.first_name} {user.last_name} s'est connecté à {session.login_time.strftime('%H:%M')}.",
                type="info"
            )

@receiver(user_logged_out)
def user_logged_out_notification(sender, user, request, **kwargs):
    """
    Créer une notification pour les administrateurs lorsqu'un utilisateur se déconnecte
    """
    if user:  # Vérifier que l'utilisateur existe (peut être None dans certains cas)
        # Mettre à jour la session utilisateur
        try:
            session = UserSession.objects.filter(user=user, is_active=True).latest('login_time')
            session.logout_time = timezone.now()
            session.is_active = False
            session.hours_worked = session.calculate_duration()
            session.save()

            # Créer une notification pour les administrateurs
            admin_users = User.objects.filter(user_type='admin')
            for admin in admin_users:
                if admin.id != user.id:  # Ne pas notifier l'admin de sa propre déconnexion
                    Notification.objects.create(
                        user=admin,
                        title="Déconnexion d'utilisateur",
                        message=f"{user.first_name} {user.last_name} s'est déconnecté à {session.logout_time.strftime('%H:%M')}. Durée de session: {session.hours_worked} heures.",
                        type="info"
                    )
        except UserSession.DoesNotExist:
            # Aucune session active trouvée
            pass

@receiver(post_save, sender=Mission)
def mission_status_change(sender, instance, created, **kwargs):
    """
    Gérer les notifications lors des changements de statut des missions
    """
    if not created:  # Uniquement pour les mises à jour, pas les créations
        # Vérifier si la mission vient d'être marquée comme complétée
        if instance.completed:
            # Créer une notification pour le superviseur
            if instance.supervisor:
                Notification.objects.create(
                    user=instance.supervisor,
                    title="Mission complétée",
                    message=f"La mission '{instance.title}' a été marquée comme complétée par {instance.assigned_to.first_name} {instance.assigned_to.last_name}.",
                    type="success"
                )

            # Créer une notification pour l'administrateur
            admin_users = User.objects.filter(user_type='admin')
            for admin in admin_users:
                if admin.id != instance.supervisor_id:  # Éviter les doublons si le superviseur est admin
                    Notification.objects.create(
                        user=admin,
                        title="Mission complétée",
                        message=f"La mission '{instance.title}' a été marquée comme complétée par {instance.assigned_to.first_name} {instance.assigned_to.last_name}.",
                        type="success"
                    )

@receiver(post_save, sender=Message)
def message_notification(sender, instance, created, **kwargs):
    """
    Créer une notification lorsqu'un nouveau message est envoyé
    """
    if created:  # Uniquement pour les nouveaux messages
        # Créer une notification pour le destinataire
        Notification.objects.create(
            user=instance.recipient,
            title="Nouveau message",
            message=f"Vous avez reçu un nouveau message de {instance.sender.first_name} {instance.sender.last_name}.",
            type="info" if not instance.is_important else "warning"
        )
        logger.info(f"Notification créée pour {instance.recipient.username} concernant un nouveau message de {instance.sender.username}")

@receiver(post_save, sender=Internship)
def internship_assignment_notification(sender, instance, created, **kwargs):
    """
    Créer des notifications lorsqu'un stagiaire est assigné à un superviseur
    """
    if created:  # Uniquement pour les nouvelles affectations
        # Notification pour le stagiaire
        Notification.objects.create(
            user=instance.intern,
            title="Affectation à un superviseur",
            message=f"Vous avez été assigné(e) à {instance.supervisor.first_name} {instance.supervisor.last_name} comme superviseur.",
            type="info"
        )

        # Notification pour le superviseur
        Notification.objects.create(
            user=instance.supervisor,
            title="Nouveau stagiaire assigné",
            message=f"{instance.intern.first_name} {instance.intern.last_name} a été assigné(e) comme votre stagiaire.",
            type="info"
        )

        # Notification pour les administrateurs
        admin_users = User.objects.filter(user_type='admin')
        for admin in admin_users:
            if admin.id != instance.supervisor.id:  # Éviter les doublons si le superviseur est admin
                Notification.objects.create(
                    user=admin,
                    title="Nouvelle affectation de stagiaire",
                    message=f"{instance.intern.first_name} {instance.intern.last_name} a été assigné(e) à {instance.supervisor.first_name} {instance.supervisor.last_name} comme superviseur.",
                    type="info"
                )

        logger.info(f"Notifications créées pour l'affectation du stagiaire {instance.intern.username} au superviseur {instance.supervisor.username}")
