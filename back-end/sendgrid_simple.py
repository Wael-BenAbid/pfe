"""
Script simple pour tester l'envoi d'emails via l'API SendGrid.
"""

import requests
import json
import os
import sys

# Clé API SendGrid
API_KEY = "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"

def send_simple_email(to_email, subject, message, from_email="RH System <waelbenabid1@gmail.com>"):
    """
    Envoie un email simple via l'API SendGrid.

    Args:
        to_email (str): Adresse email du destinataire
        subject (str): Sujet de l'email
        message (str): Corps de l'email
        from_email (str): Adresse email de l'expéditeur

    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon
    """
    # Extraire le nom et l'email de l'expéditeur
    if '<' in from_email:
        from_name = from_email.split('<')[0].strip()
        from_email_address = from_email.split('<')[1].split('>')[0]
    else:
        from_name = "RH System"
        from_email_address = from_email

    # Créer la structure de données pour l'API SendGrid
    data = {
        "personalizations": [
            {
                "to": [
                    {
                        "email": to_email
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
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        print(f"===== ENVOI D'EMAIL VIA SENDGRID =====")
        print(f"De: {from_name} <{from_email_address}>")
        print(f"À: {to_email}")
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
