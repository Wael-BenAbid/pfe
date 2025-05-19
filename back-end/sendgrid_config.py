"""
Module pour l'envoi d'emails via l'API SendGrid avec des améliorations pour la délivrabilité.
"""

import requests
import json
from django.conf import settings

def send_email(subject, message, recipient_list, from_email=None, html_content=None):
    """
    Envoie un email via l'API SendGrid avec des améliorations pour la délivrabilité.

    Args:
        subject (str): Sujet de l'email
        message (str): Corps de l'email en texte brut
        recipient_list (list): Liste des destinataires
        from_email (str, optional): Adresse email de l'expéditeur. Par défaut settings.DEFAULT_FROM_EMAIL.
        html_content (str, optional): Version HTML du message. Si None, le message texte sera utilisé.

    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon
    """
    if not from_email:
        from_email = settings.DEFAULT_FROM_EMAIL

    # Si recipient_list est une liste, prendre le premier élément pour les logs
    to_email = recipient_list[0] if isinstance(recipient_list, list) else recipient_list

    # Extraire le nom et l'email de l'expéditeur
    if '<' in from_email:
        from_name = from_email.split('<')[0].strip()
        from_email_address = from_email.split('<')[1].split('>')[0]
    else:
        from_name = "RH System"
        from_email_address = from_email

    try:
        print(f"===== ENVOI D'EMAIL VIA SENDGRID =====")
        print(f"De: {from_name} <{from_email_address}>")
        print(f"À: {to_email}")
        print(f"Sujet: {subject}")

        # Créer la structure de données pour l'API SendGrid avec des améliorations
        data = {
            "personalizations": [
                {
                    "to": [
                        {
                            "email": to_email if isinstance(to_email, str) else recipient_list[0]
                        }
                    ],
                    "subject": subject,
                    "headers": {
                        "X-Priority": "1",
                        "Importance": "High",
                        "Precedence": "bulk",
                        "Auto-Submitted": "auto-generated",
                        "X-Auto-Response-Suppress": "OOF, DR, RN, NRN, AutoReply",
                        "List-Unsubscribe": f"<mailto:{from_email_address}?subject=Unsubscribe>",
                        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                        "X-Report-Abuse": f"Please report abuse here: mailto:{from_email_address}?subject=Abuse",
                        "X-Mailer": "RH System Mailer"
                    }
                }
            ],
            "from": {
                "email": from_email_address,
                "name": from_name
            },
            "reply_to": {
                "email": from_email_address,
                "name": from_name
            },
            "content": [
                {
                    "type": "text/plain",
                    "value": message
                }
            ],
            "tracking_settings": {
                "click_tracking": {
                    "enable": True,
                    "enable_text": True
                },
                "open_tracking": {
                    "enable": True
                },
                "subscription_tracking": {
                    "enable": True,
                    "text": "Pour vous désabonner, cliquez ici: <%unsubscribe%>",
                    "html": "<p>Pour vous désabonner, <a href='<%unsubscribe%>'>cliquez ici</a>.</p>"
                }
            },
            "mail_settings": {
                "footer": {
                    "enable": True,
                    "text": "\n\nCe message est généré automatiquement par RH System. Pour vous désabonner, répondez à cet email avec 'Désabonner' comme sujet.",
                    "html": "<p>Ce message est généré automatiquement par RH System. Pour vous désabonner, répondez à cet email avec 'Désabonner' comme sujet.</p>"
                },
                "spam_check": {
                    "enable": True,
                    "threshold": 3,
                    "post_to_url": "https://spamcop.net/fom"
                },
                "bypass_list_management": {
                    "enable": False
                }
            },
            "asm": {
                "group_id": 12345,
                "groups_to_display": [12345]
            }
        }

        # Ajouter le contenu HTML si fourni
        if html_content:
            data["content"].append({
                "type": "text/html",
                "value": html_content
            })

        # Envoyer l'email
        url = "https://api.sendgrid.com/v3/mail/send"
        headers = {
            "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.post(url, headers=headers, data=json.dumps(data))

        if response.status_code == 202:
            print(f"Email envoyé avec succès via SendGrid (statut: {response.status_code})")
            print(f"===== FIN ENVOI D'EMAIL =====")
            return True
        else:
            print(f"Échec de l'envoi d'email via SendGrid (statut: {response.status_code})")
            print(f"Réponse: {response.text}")
            print(f"===== FIN ENVOI D'EMAIL =====")
            return False

    except Exception as sendgrid_error:
        print(f"Erreur SendGrid: {str(sendgrid_error)}")
        print(f"===== FIN ERREUR D'ENVOI D'EMAIL =====")
        return False
