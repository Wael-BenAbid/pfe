from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_email_notification(subject, message, recipient_list):
    """
    Fonction utilitaire pour envoyer des emails de notification
    
    Args:
        subject (str): Sujet de l'email
        message (str): Corps de l'email
        recipient_list (list): Liste des destinataires
        
    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        logger.info(f"Email envoyé à {', '.join(recipient_list)}")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email: {str(e)}")
        return False

def get_admin_emails():
    """
    Récupère les adresses email de tous les administrateurs
    
    Returns:
        list: Liste des adresses email des administrateurs
    """
    from .models import User
    return list(User.objects.filter(user_type='admin').values_list('email', flat=True))
