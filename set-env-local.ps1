# ========================================
# SCRIPT POWERSHELL - CONFIGURATION ENVIRONNEMENT LOCAL
# ========================================

# Ce script configure les variables d'environnement pour Docker Compose
# Utilisez les mêmes valeurs que dans GitHub Secrets

Write-Host "🔧 Configuration des variables d'environnement pour Docker..." -ForegroundColor Green

# Configuration de base
$env:NODE_ENV = "production"
$env:DEBUG = "True"

# Configuration des ports
$env:FRONTEND_PORT = "5175"
$env:BACKEND_PORT = "8000"
$env:DB_PORT = "5433"

# Configuration des images
$env:FRONTEND_IMAGE = "waelbenabid/rh-frontend:v2.2-topnet-images"
$env:BACKEND_IMAGE = "waelbenabid/rh-system-backend:gmail-smtp"

# Configuration de la base de données
$env:DATABASE_NAME = "rh_v2"
$env:DATABASE_USER = "postgres"
$env:DATABASE_PASSWORD = "12345"
$env:DATABASE_HOST = "db"
$env:DATABASE_PORT = "5432"
$env:POSTGRES_DB = "rh_v2"
$env:POSTGRES_USER = "postgres"
$env:POSTGRES_PASSWORD = "12345"

# Configuration Gmail SMTP - REMPLACEZ PAR VOS VRAIES VALEURS
$env:EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
$env:EMAIL_PROVIDER = "gmail"
$env:EMAIL_HOST = "smtp.gmail.com"
$env:EMAIL_PORT = "587"
$env:EMAIL_USE_TLS = "True"
$env:EMAIL_HOST_USER = "waelbenabid1@gmail.com"
$env:EMAIL_HOST_PASSWORD = "VOTRE_MOT_DE_PASSE_APP_GMAIL_ICI"
$env:DEFAULT_FROM_EMAIL = "RH System <waelbenabid1@gmail.com>"

# Configuration Admin
$env:ADMIN_USERNAME = "wael"
$env:ADMIN_EMAIL = "waelbenabid1@gmail.com"
$env:ADMIN_PASSWORD = "Abidos$$123"
$env:ADMIN_FIRSTNAME = "Wael"
$env:ADMIN_LASTNAME = "Ben Abid"

# Configuration Django
$env:SECRET_KEY = "django-insecure-your-secret-key-change-this-in-production"

# Configuration Zipkin
$env:ZIPKIN_ENABLED = "True"
$env:ZIPKIN_SERVER_URL = "http://zipkin:9411"
$env:ZIPKIN_SERVICE_NAME = "rh-backend"
$env:ZIPKIN_SAMPLE_RATE = "100.0"

# Configuration Frontend
$env:VITE_API_BASE_URL = "http://localhost:8000"
$env:VITE_ZIPKIN_URL = "http://localhost:9411"
$env:VITE_ZIPKIN_ENABLED = "true"
$env:FRONTEND_URL = "http://localhost:5175"

# Suppression de l'ancienne configuration SendGrid
$env:SENDGRID_API_KEY = ""

Write-Host "✅ Variables d'environnement configurées !" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 IMPORTANT: Remplacez EMAIL_HOST_PASSWORD par votre vrai mot de passe d'application Gmail" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Pour générer un mot de passe d'application Gmail :" -ForegroundColor Cyan
Write-Host "1. Allez sur https://myaccount.google.com/security" -ForegroundColor White
Write-Host "2. Activez la vérification en 2 étapes" -ForegroundColor White
Write-Host "3. Générez un mot de passe d'application pour 'Mail'" -ForegroundColor White
Write-Host "4. Utilisez ce mot de passe dans EMAIL_HOST_PASSWORD" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Maintenant vous pouvez lancer: docker-compose up --build -d" -ForegroundColor Green
