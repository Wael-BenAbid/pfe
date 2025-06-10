from django.conf import settings
from django.core.mail import send_mail, EmailMessage
import logging

logger = logging.getLogger(__name__)

def send_email_notification(subject, message, recipient_list, email_type='other', reference_id=None, force_send=False):
    """
    Fonction utilitaire pour envoyer des emails de notification via Django Email System
    Support Gmail SMTP et autres backends configurés

    Args:
        subject (str): Sujet de l'email
        message (str): Corps de l'email
        recipient_list (list): Liste des destinataires
        email_type (str): Type d'email (late_mission, upcoming_deadline, meeting_cancelled, meeting_scheduled, other)
        reference_id (int): ID de l'objet concerné (mission, réunion, etc.)
        force_send (bool): Paramètre conservé pour compatibilité mais n'a plus d'effet

    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon
    """
    # Vérifier si la liste des destinataires est vide
    if not recipient_list:
        logger.error("Liste des destinataires vide")
        print("ERREUR: Liste des destinataires vide")
        return False

    # Log de la configuration email
    logger.info(f"Configuration email: Backend={settings.EMAIL_BACKEND}, Provider={getattr(settings, 'EMAIL_PROVIDER', 'Non défini')}")
    print(f"Configuration email: Backend={settings.EMAIL_BACKEND}, Provider={getattr(settings, 'EMAIL_PROVIDER', 'Non défini')}")

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

    # Créer le template HTML avec un design professionnel
    html_message = f"""
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>{subject}</title>
    <style>
        @media only screen and (max-width: 600px) {{
            .main-container {{
                width: 100% !important;
                padding: 10px !important;
            }}
        }}
        body {{
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            background-color: #f8f9fa;
        }}
        .main-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            background-color: #4a89dc;
            padding: 20px;
            text-align: center;
            color: white;
        }}
        .header h2 {{
            margin: 0;
            font-weight: 600;
            font-size: 24px;
        }}
        .content {{
            padding: 30px;
            background-color: #ffffff;
        }}
        .footer {{
            margin-top: 20px;
            padding: 20px;
            background-color: #f8f9fa;
            font-size: 12px;
            color: #777777;
            text-align: center;
            border-top: 1px solid #eeeeee;
        }}
        .button {{
            display: inline-block;
            padding: 10px 20px;
            background-color: #4a89dc;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 15px;
        }}
        a {{
            color: #4a89dc;
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <div class="main-container">
        <div class="header">
            <h2>RH System</h2>
        </div>
        <div class="content">
            <p>Bonjour,</p>
            <p>{message_html}</p>
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

    # Envoyer l'email via Django Email System
    from .models import User, EmailLog

    try:
        # Envoyer l'email simple (texte)
        result = send_mail(
            subject=subject,
            message=formatted_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )

        # Envoyer aussi la version HTML si possible
        try:
            email = EmailMessage(
                subject=subject,
                body=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipient_list,
            )
            email.content_subtype = "html"
            email.send()
            logger.info(f"Email HTML envoyé avec succès à {recipient_list}")
        except Exception as html_error:
            logger.warning(f"Échec envoi HTML, email texte envoyé: {html_error}")

        # Enregistrer l'envoi de l'email pour le suivi
        for recipient_email in recipient_list:
            try:
                user = User.objects.get(email=recipient_email)
                EmailLog.objects.create(
                    user=user,
                    email_type=email_type,
                    reference_id=reference_id
                )
            except User.DoesNotExist:
                # Utilisateur n'existe pas, mais email envoyé quand même
                logger.info(f"Email envoyé à {recipient_email} (utilisateur inexistant)")

        logger.info(f"Email envoyé avec succès à {len(recipient_list)} destinataire(s)")
        print(f"Email envoyé avec succès à {len(recipient_list)} destinataire(s)")
        return True

    except Exception as e:
        logger.error(f"Erreur lors de l'envoi d'email: {str(e)}")
        print(f"ERREUR: Envoi d'email: {str(e)}")
        return False

def get_admin_emails():
    """
    Récupère les adresses email de tous les administrateurs

    Returns:
        list: Liste des adresses email des administrateurs
    """
    from .models import User
    return list(User.objects.filter(user_type='admin').values_list('email', flat=True))
