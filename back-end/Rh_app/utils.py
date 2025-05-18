from django.conf import settings
import logging
import sys
import os

# Ajouter le chemin du projet pour pouvoir importer sendgrid_config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sendgrid_config import send_email

logger = logging.getLogger(__name__)

def send_email_notification(subject, message, recipient_list, email_type='other', reference_id=None, force_send=False):
    """
    Fonction utilitaire pour envoyer des emails de notification via SendGrid
    avec limitation du nombre d'emails par jour par utilisateur

    Args:
        subject (str): Sujet de l'email
        message (str): Corps de l'email
        recipient_list (list): Liste des destinataires
        email_type (str): Type d'email (late_mission, upcoming_deadline, meeting_cancelled, meeting_scheduled, other)
        reference_id (int): ID de l'objet concerné (mission, réunion, etc.)
        force_send (bool): Forcer l'envoi même si la limite est atteinte

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

    # Vérifier la limite d'emails par jour pour chaque destinataire
    from .models import User, EmailLog

    success = True
    for recipient_email in recipient_list:
        try:
            # Récupérer l'utilisateur correspondant à l'email
            user = User.objects.get(email=recipient_email)

            # Vérifier si l'utilisateur peut recevoir un email aujourd'hui
            can_send = force_send or EmailLog.can_send_email(user, email_type, reference_id)

            if can_send:
                # Envoyer l'email via SendGrid
                result = send_email(
                    subject=subject,
                    message=formatted_message,
                    recipient_list=[recipient_email],
                    from_email=settings.DEFAULT_FROM_EMAIL
                )

                if result:
                    # Enregistrer l'envoi de l'email
                    EmailLog.objects.create(
                        user=user,
                        email_type=email_type,
                        reference_id=reference_id
                    )
                else:
                    success = False
            else:
                print(f"Limite d'emails atteinte pour {recipient_email} (type: {email_type})")
                logger.info(f"Limite d'emails atteinte pour {recipient_email} (type: {email_type})")
                # Ne pas marquer comme échec si c'est juste une limitation
        except User.DoesNotExist:
            # Si l'utilisateur n'existe pas, envoyer quand même l'email
            # (cas des candidats qui n'ont pas encore de compte)
            result = send_email(
                subject=subject,
                message=formatted_message,
                recipient_list=[recipient_email],
                from_email=settings.DEFAULT_FROM_EMAIL
            )
            if not result:
                success = False
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi d'email à {recipient_email}: {str(e)}")
            print(f"ERREUR: Envoi d'email à {recipient_email}: {str(e)}")
            success = False

    return success

def get_admin_emails():
    """
    Récupère les adresses email de tous les administrateurs

    Returns:
        list: Liste des adresses email des administrateurs
    """
    from .models import User
    return list(User.objects.filter(user_type='admin').values_list('email', flat=True))
