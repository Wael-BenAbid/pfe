"""
Service de notifications pour les échéances et mouvements d'employés
"""
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import Mission, User, Notification
from .email_limiter import email_limiter
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Service pour gérer les notifications par email
    """
    
    def __init__(self):
        self.from_email = settings.DEFAULT_FROM_EMAIL
        
    def send_deadline_notifications(self):
        """
        Envoyer les notifications d'échéances (3 fois par jour : 8h, 11h30, 17h)
        """
        if not email_limiter.can_send_email('deadline'):
            logger.info("Notifications d'échéances en dehors des heures autorisées")
            return
            
        # Missions avec 1 jour restant
        tomorrow = datetime.now().date() + timedelta(days=1)
        missions_tomorrow = Mission.objects.filter(
            date_fin=tomorrow,
            statut__in=['en_cours', 'assignee']
        ).select_related('employe', 'stagiaire', 'superviseur')
        
        # Missions en retard
        today = datetime.now().date()
        missions_late = Mission.objects.filter(
            date_fin__lt=today,
            statut__in=['en_cours', 'assignee']
        ).select_related('employe', 'stagiaire', 'superviseur')
        
        # Envoyer les notifications
        self._send_mission_deadline_notifications(missions_tomorrow, 'deadline_tomorrow')
        self._send_mission_deadline_notifications(missions_late, 'deadline_overdue')
        
    def _send_mission_deadline_notifications(self, missions, notification_type):
        """
        Envoyer les notifications pour une liste de missions
        """
        for mission in missions:
            recipients = []
            
            # Ajouter l'employé/stagiaire assigné
            if mission.employe:
                recipients.append(mission.employe.email)
            if mission.stagiaire:
                recipients.append(mission.stagiaire.email)
                
            # Ajouter le superviseur
            if mission.superviseur:
                recipients.append(mission.superviseur.email)
                
            # Ajouter les administrateurs
            admins = User.objects.filter(user_type='admin')
            for admin in admins:
                recipients.append(admin.email)
                
            # Supprimer les doublons
            recipients = list(set(recipients))
            
            # Envoyer l'email à chaque destinataire
            for recipient in recipients:
                if email_limiter.can_send_email('deadline', recipient):
                    self._send_mission_notification_email(mission, recipient, notification_type)
                    email_limiter.record_email_sent('deadline', recipient)
                    
    def _send_mission_notification_email(self, mission, recipient_email, notification_type):
        """
        Envoyer un email de notification pour une mission
        """
        try:
            # Déterminer le sujet et le template selon le type
            if notification_type == 'deadline_tomorrow':
                subject = f"[RH System] Mission se terminant demain : {mission.titre}"
                template_name = 'emails/mission_deadline_tomorrow.html'
            elif notification_type == 'deadline_overdue':
                subject = f"[RH System] Mission en retard : {mission.titre}"
                template_name = 'emails/mission_deadline_overdue.html'
            else:
                subject = f"[RH System] Notification mission : {mission.titre}"
                template_name = 'emails/mission_notification.html'
                
            # Contexte pour le template
            context = {
                'mission': mission,
                'recipient_email': recipient_email,
                'frontend_url': settings.FRONTEND_URL,
                'days_remaining': (mission.date_fin - datetime.now().date()).days
            }
            
            # Rendu du template HTML
            html_message = render_to_string(template_name, context)
            plain_message = strip_tags(html_message)
            
            # Envoi de l'email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=self.from_email,
                recipient_list=[recipient_email],
                html_message=html_message,
                fail_silently=False
            )
            
            # Créer une notification dans la base de données
            self._create_notification(mission, recipient_email, notification_type, subject)
            
            logger.info(f"Notification {notification_type} envoyée à {recipient_email} pour la mission {mission.titre}")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de notification à {recipient_email}: {e}")
            
    def send_employee_movement_notification(self, user, movement_type, details=None):
        """
        Envoyer une notification pour les mouvements d'employés
        
        Args:
            user: L'utilisateur concerné
            movement_type: Type de mouvement ('arrival', 'departure', 'assignment')
            details: Détails supplémentaires
        """
        if not email_limiter.can_send_email('movement'):
            logger.warning("Limite d'emails atteinte pour les notifications de mouvement")
            return
            
        # Destinataires : administrateurs et superviseurs
        recipients = []
        admins = User.objects.filter(user_type='admin')
        supervisors = User.objects.filter(user_type='employee')  # Tous les employés pour simplifier
        
        for admin in admins:
            recipients.append(admin.email)
        for supervisor in supervisors:
            recipients.append(supervisor.email)
            
        # Supprimer les doublons
        recipients = list(set(recipients))
        
        # Envoyer les notifications
        for recipient in recipients:
            if email_limiter.can_send_email('movement', recipient):
                self._send_movement_notification_email(user, recipient, movement_type, details)
                email_limiter.record_email_sent('movement', recipient)
                
    def _send_movement_notification_email(self, user, recipient_email, movement_type, details):
        """
        Envoyer un email de notification pour un mouvement d'employé
        """
        try:
            # Déterminer le sujet selon le type de mouvement
            if movement_type == 'arrival':
                subject = f"[RH System] Nouvelle arrivée : {user.get_full_name()}"
            elif movement_type == 'departure':
                subject = f"[RH System] Départ : {user.get_full_name()}"
            elif movement_type == 'assignment':
                subject = f"[RH System] Nouvelle assignation : {user.get_full_name()}"
            else:
                subject = f"[RH System] Mouvement d'employé : {user.get_full_name()}"
                
            # Contexte pour le template
            context = {
                'user': user,
                'movement_type': movement_type,
                'details': details,
                'recipient_email': recipient_email,
                'frontend_url': settings.FRONTEND_URL
            }
            
            # Rendu du template
            template_name = 'emails/employee_movement.html'
            html_message = render_to_string(template_name, context)
            plain_message = strip_tags(html_message)
            
            # Envoi de l'email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=self.from_email,
                recipient_list=[recipient_email],
                html_message=html_message,
                fail_silently=False
            )
            
            logger.info(f"Notification de mouvement {movement_type} envoyée à {recipient_email} pour {user.get_full_name()}")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de notification de mouvement à {recipient_email}: {e}")
            
    def _create_notification(self, mission, recipient_email, notification_type, subject):
        """
        Créer une notification dans la base de données
        """
        try:
            # Trouver l'utilisateur destinataire
            recipient = User.objects.filter(email=recipient_email).first()
            if recipient:
                Notification.objects.create(
                    user=recipient,
                    title=subject,
                    message=f"Notification pour la mission : {mission.titre}",
                    type=notification_type,
                    is_read=False
                )
        except Exception as e:
            logger.error(f"Erreur lors de la création de notification en base: {e}")


# Instance globale
notification_service = NotificationService()
