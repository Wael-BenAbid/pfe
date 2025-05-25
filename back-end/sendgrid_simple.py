"""
Module pour l'envoi d'emails via l'API SendGrid.
Cette version utilise directement l'API SendGrid pour une meilleure délivrabilité.
"""

import requests
import json
import os
import sys
import logging
from django.conf import settings

# Configuration du logging
logger = logging.getLogger(__name__)

def send_simple_email(to_email, subject, message, from_email="RH System <waelbenabid1@gmail.com>", html_content=None):
    """
    Envoie un email via l'API SendGrid avec support HTML pour une meilleure délivrabilité.

    Args:
        to_email (str): Adresse email du destinataire ou liste d'adresses
        subject (str): Sujet de l'email
        message (str): Corps de l'email en texte brut
        from_email (str): Adresse email de l'expéditeur
        html_content (str, optional): Version HTML du message

    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon
    """
    # Récupérer la clé API depuis les paramètres Django
    try:
        api_key = settings.SENDGRID_API_KEY
    except:
        # Fallback vers variable d'environnement
        import os
        api_key = os.getenv('SENDGRID_API_KEY')

    # Vérifier si la clé API est disponible
    if not api_key:
        print("ERREUR: Clé API SendGrid non configurée")
        return False

    # Extraire le nom et l'email de l'expéditeur
    if '<' in from_email:
        from_name = from_email.split('<')[0].strip()
        from_email_address = from_email.split('<')[1].split('>')[0]
    else:
        from_name = "RH System"
        from_email_address = from_email

    # Convertir to_email en liste si c'est une chaîne
    if isinstance(to_email, str):
        to_emails = [to_email]
    else:
        to_emails = to_email

    # Créer la structure de données pour l'API SendGrid
    data = {
        "personalizations": [
            {
                "to": [{"email": email} for email in to_emails],
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
        ],
        # Ajouter des en-têtes pour améliorer la délivrabilité
        "headers": {
            "X-Priority": "1",
            "Importance": "high",
            "X-Mailer": "RH System Mailer"
        },
        # Ajouter des catégories pour le suivi
        "categories": ["rh-system", "notification"]
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
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        print(f"===== ENVOI D'EMAIL VIA SENDGRID API =====")
        print(f"De: {from_name} <{from_email_address}>")
        print(f"À: {', '.join(to_emails)}")
        print(f"Sujet: {subject}")

        response = requests.post(url, headers=headers, data=json.dumps(data))

        if response.status_code == 202:
            print(f"Email envoyé avec succès (statut: {response.status_code})")
            print(f"===== FIN ENVOI D'EMAIL =====")
            return True
        else:
            print(f"Échec de l'envoi d'email (statut: {response.status_code})")
            print(f"Réponse: {response.text}")
            print(f"===== FIN ENVOI D'EMAIL =====")
            return False
    except Exception as e:
        print(f"===== ERREUR D'ENVOI D'EMAIL =====")
        print(f"Erreur: {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"===== FIN ERREUR D'ENVOI D'EMAIL =====")
        return False

if __name__ == "__main__":
    # Tester l'envoi d'email
    recipient = input("Entrez l'adresse email du destinataire: ")

    success = send_simple_email(
        to_email=recipient,
        subject="Test d'envoi d'email - RH System",
        message="""
Bonjour,

Ceci est un test d'envoi d'email depuis l'application RH System.

Si vous recevez cet email, cela signifie que la configuration SendGrid est correcte.

Merci de votre attention.

--
Cordialement,
L'équipe RH System
Ghar El Melh, 7033 TUN
Ce message est généré automatiquement, merci de ne pas y répondre.
"""
    )

    if success:
        print(f"Email envoyé avec succès à {recipient}")
    else:
        print(f"Échec de l'envoi d'email à {recipient}")
