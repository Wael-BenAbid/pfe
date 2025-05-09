"""
Module pour l'envoi d'emails via l'API SendGrid ou SMTP Gmail.
"""

import requests
import json
from django.conf import settings
import traceback
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(subject, message, recipient_list, from_email=None):
    """
    Envoie un email via SMTP Gmail ou l'API SendGrid.

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
        print(f"===== ENVOI D'EMAIL VIA GMAIL SMTP =====")
        print(f"De: {from_name} <{from_email_address}>")
        print(f"À: {to_email}")
        print(f"Sujet: {subject}")

        # Créer le message
        msg = MIMEMultipart()
        msg['From'] = f"{from_name} <{from_email_address}>"
        msg['To'] = to_email if isinstance(to_email, str) else ", ".join(recipient_list)
        msg['Subject'] = subject

        # Ajouter le corps du message
        msg.attach(MIMEText(message, 'plain'))

        # Envoyer l'email via SMTP
        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
        server.starttls()  # Sécuriser la connexion
        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)

        # Envoyer l'email à tous les destinataires
        if isinstance(recipient_list, list):
            for recipient in recipient_list:
                server.sendmail(from_email_address, recipient, msg.as_string())
        else:
            server.sendmail(from_email_address, recipient_list, msg.as_string())

        server.quit()

        print(f"Email envoyé avec succès via SMTP")
        print(f"===== FIN ENVOI D'EMAIL =====")
        return True

    except Exception as e:
        print(f"===== ERREUR D'ENVOI D'EMAIL VIA SMTP =====")
        print(f"Erreur: {str(e)}")
        traceback.print_exc()

        # Essayer d'envoyer via SendGrid en cas d'échec SMTP
        try:
            print(f"Tentative d'envoi via SendGrid...")

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
