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

    # Créer une version HTML du message pour améliorer la délivrabilité
    # Remplacer les sauts de ligne par des balises <br> pour l'affichage HTML
    message_html = message.replace('\n', '<br>')

    # Créer le template HTML sans utiliser de f-string avec des backslashes
    html_message = """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>""" + subject + """</title>
    <style>
        @media only screen and (max-width: 600px) {
            .main-container {
                width: 100% !important;
                padding: 10px !important;
            }
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
            background-color: #f8f9fa;
        }
        .main-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #4a89dc;
            padding: 20px;
            text-align: center;
            color: white;
        }
        .header h2 {
            margin: 0;
            font-weight: 600;
            font-size: 24px;
        }
        .content {
            padding: 30px;
            background-color: #ffffff;
        }
        .footer {
            margin-top: 20px;
            padding: 20px;
            background-color: #f8f9fa;
            font-size: 12px;
            color: #777777;
            text-align: center;
            border-top: 1px solid #eeeeee;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4a89dc;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 15px;
        }
        a {
            color: #4a89dc;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="header">
            <h2>RH System</h2>
        </div>
        <div class="content">
            <p>Bonjour,</p>
            <p>""" + message_html + """</p>
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        </div>
        <div class="footer">
            <p>Cordialement,<br>
            L'équipe RH System<br>
            Ghar El Melh, 7033 TUN</p>
            <p><small>Ce message est généré automatiquement. Pour vous désabonner ou signaler un abus, veuillez répondre à cet email avec "Désabonner" comme sujet.</small></p>
        </div>
    </div>
</body>
</html>
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
                # Envoyer l'email via SendGrid avec la version HTML
                result = send_email(
                    subject=subject,
                    message=formatted_message,
                    recipient_list=[recipient_email],
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    html_content=html_message
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
                from_email=settings.DEFAULT_FROM_EMAIL,
                html_content=html_message
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
