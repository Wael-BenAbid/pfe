from django.conf import settings
import logging
import sys
import os

# Ajouter le chemin du projet pour pouvoir importer sendgrid_config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sendgrid_config import send_email

logger = logging.getLogger(__name__)

def send_email_notification(subject, message, recipient_list):
    """
    Fonction utilitaire pour envoyer des emails de notification via SendGrid

    Args:
        subject (str): Sujet de l'email
        message (str): Corps de l'email
        recipient_list (list): Liste des destinataires

    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon
    """
    # Vérifier si la liste des destinataires est vide
    if not recipient_list:
        logger.error("Liste des destinataires vide")
        print("ERREUR: Liste des destinataires vide")
        return False

    # Vérifier si la clé API SendGrid est configurée
    if not settings.SENDGRID_API_KEY:
        logger.error("Clé API SendGrid non configurée")
        print("ERREUR: Clé API SendGrid non configurée")
        return False

    # Ajouter un en-tête et un pied de page au message
    formatted_message = f"""
Bonjour,

{message}

--
Cordialement,
L'équipe RH System
Ghar El Melh, 7033 TUN
Ce message est généré automatiquement, merci de ne pas y répondre.
"""

    # Envoyer l'email via SendGrid
    return send_email(
        subject=subject,
        message=formatted_message,
        recipient_list=recipient_list,
        from_email=settings.DEFAULT_FROM_EMAIL
    )

def get_admin_emails():
    """
    Récupère les adresses email de tous les administrateurs

    Returns:
        list: Liste des adresses email des administrateurs
    """
    from .models import User
    return list(User.objects.filter(user_type='admin').values_list('email', flat=True))
