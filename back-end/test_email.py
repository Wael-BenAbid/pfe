"""
Script de test pour l'envoi d'emails via SendGrid.
Exécutez ce script avec la commande : python test_email.py
"""

import os
import django
import sys

# Configurer l'environnement Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SystemeRH_v2.settings')
django.setup()

from Rh_app.utils import send_email_notification

def test_email():
    """
    Fonction de test pour l'envoi d'emails via SendGrid.
    """
    print("===== TEST D'ENVOI D'EMAIL =====")

    recipient = input("Entrez l'adresse email du destinataire: ")

    success = send_email_notification(
        subject="Test d'envoi d'email - RH System",
        message="Ceci est un test d'envoi d'email depuis l'application RH System.\n\nSi vous recevez cet email, cela signifie que la configuration SendGrid est correcte.\n\nMerci de votre attention.",
        recipient_list=[recipient]
    )

    if success:
        print(f"Email envoyé avec succès à {recipient}")
    else:
        print(f"Échec de l'envoi d'email à {recipient}")

    print("===== FIN TEST D'ENVOI D'EMAIL =====")

if __name__ == "__main__":
    test_email()
