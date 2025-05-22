# Configuration des emails
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Utiliser le backend de console pour le développement
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')

# Récupérer la clé API SendGrid
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY', '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')

# Nous utilisons directement l'API SendGrid via le script sendgrid_simple.py
# au lieu de passer par SMTP pour une meilleure délivrabilité

DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'RH System <waelbenabid1@gmail.com>')

# Afficher un message de diagnostic
print(f"Email backend configured: {EMAIL_BACKEND}")
print(f"SendGrid API key available: {'Yes' if SENDGRID_API_KEY else 'No'}")
