# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Arguments de construction pour les informations de l'utilisateur admin
ARG ADMIN_USERNAME=admin
ARG ADMIN_EMAIL=admin@example.com
ARG ADMIN_PASSWORD=admin_password
ARG ADMIN_FIRSTNAME=Admin
ARG ADMIN_LASTNAME=User

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ADMIN_USERNAME=${ADMIN_USERNAME}
ENV ADMIN_EMAIL=${ADMIN_EMAIL}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD}
ENV ADMIN_FIRSTNAME=${ADMIN_FIRSTNAME}
ENV ADMIN_LASTNAME=${ADMIN_LASTNAME}

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    python3-dev \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir py-zipkin opentracing django-zipkin schedule

# Copy project files
COPY . .

# Appliquer le correctif pour la fonctionnalité de chat
RUN chmod +x /app/apply_message_fix.sh && /app/apply_message_fix.sh

# Nettoyer les fichiers statiques
RUN rm -rf staticfiles_v2 static

# Créer le script d'initialisation directement dans le Dockerfile
RUN echo '#!/bin/bash\n\
\n\
# Attendre que PostgreSQL soit prêt\n\
echo "Waiting for PostgreSQL to start..."\n\
while ! nc -z db 5432; do\n\
  sleep 1\n\
  echo "PostgreSQL is unavailable - sleeping"\n\
done\n\
echo "PostgreSQL started!"\n\
\n\
# Appliquer les migrations\n\
echo "Applying migrations..."\n\
python manage.py migrate\n\
\n\
# Créer un superutilisateur si nécessaire\n\
echo "Creating superuser if needed..."\n\
python manage.py shell -c "\n\
from django.contrib.auth import get_user_model;\n\
User = get_user_model();\n\
if not User.objects.filter(username='"'"'$ADMIN_USERNAME'"'"').exists():\n\
    User.objects.create_superuser('"'"'$ADMIN_USERNAME'"'"', '"'"'$ADMIN_EMAIL'"'"', '"'"'$ADMIN_PASSWORD'"'"', first_name='"'"'$ADMIN_FIRSTNAME'"'"', last_name='"'"'$ADMIN_LASTNAME'"'"', user_type='"'"'admin'"'"')\n\
    print('"'"'Superuser created.'"'"')\n\
else:\n\
    print('"'"'Superuser already exists.'"'"')\n\
"\n\
\n\
# Collecter les fichiers statiques\n\
echo "Collecting static files..."\n\
python manage.py collectstatic --noinput\n\
\n\
# Ajouter les tâches cron\n\
echo "Setting up cron jobs..."\n\
python manage.py crontab add\n\
\n\
# Démarrer le service cron\n\
echo "Starting cron service..."\n\
service cron start\n\
\n\
# Démarrer le planificateur de notifications en arrière-plan\n\
echo "Starting notification scheduler..."\n\
nohup python schedule_notifications.py > notification_scheduler.log 2>&1 &\n\
\n\
# Démarrer le serveur\n\
echo "Starting server..."\n\
python manage.py runserver 0.0.0.0:8000\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Installer netcat pour vérifier la disponibilité de PostgreSQL
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Expose port
EXPOSE 8000

# Le script d'entrypoint sera exécuté via docker-compose.yml
# Commande par défaut si aucun entrypoint n'est spécifié
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]