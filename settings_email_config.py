# Configuration des emails
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'apikey'  # Ceci doit être 'apikey' pour SendGrid
EMAIL_HOST_PASSWORD = SENDGRID_API_KEY
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'RH System <waelbenabid1@gmail.com>')
