# Configuration des emails
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Utiliser le backend de console pour le développement
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')

# Récupérer la clé API SendGrid
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY', '')

# Configuration SendGrid (si activé)
if EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
    EMAIL_HOST = 'smtp.sendgrid.net'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = 'apikey'  # Ceci doit être 'apikey' pour SendGrid
    EMAIL_HOST_PASSWORD = SENDGRID_API_KEY

DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'RH System <waelbenabid1@gmail.com>')

# Afficher un message de diagnostic
print(f"Email backend configured: {EMAIL_BACKEND}")
if EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
    print(f"SendGrid API key available: {'Yes' if SENDGRID_API_KEY else 'No'}")
