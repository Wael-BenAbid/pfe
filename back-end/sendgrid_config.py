"""
Module pour l'envoi d'emails via l'API SendGrid.
"""

import requests
import json
from django.conf import settings

def send_email(subject, message, recipient_list, from_email=None):
    """
    Envoie un email via l'API SendGrid.

    Args:
        subject (str): Sujet de l'email
        message (str): Corps de l'email
        recipient_list (list): Liste des destinataires
        from_email (str, optional): Adresse email de l'expéditeur. Par défaut settings.DEFAULT_FROM_EMAIL.

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

        # Créer la structure de données pour l'API SendGrid
        data = {
            "personalizations": [
                {
                    "to": [
                        {
                            "email": to_email if isinstance(to_email, str) else recipient_list[0]
                        }
                    ],
                    "subject": subject
                }
            ],
            "from": {
                "email": from_email_address,
                "name": from_name
            },
            "content": [
                {
                    "type": "text/plain",
                    "value": message
                }
            ]
        }

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
