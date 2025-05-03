#!/bin/bash

# Attendre que la base de données soit prête
echo "Waiting for PostgreSQL to start..."
while ! pg_isready -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER; do
  sleep 1
done
echo "PostgreSQL started!"

# Créer la base de données si elle n'existe pas
echo "Checking if database $DATABASE_NAME exists..."
PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -U $DATABASE_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DATABASE_NAME'" | grep -q 1 || PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -U $DATABASE_USER -c "CREATE DATABASE $DATABASE_NAME"
echo "Database check completed."

# Appliquer les migrations
echo "Applying migrations..."
python manage.py migrate --noinput

# Collecter les fichiers statiques
echo "Collecting static files..."
python manage.py collectstatic --noinput --no-input

# Créer un superutilisateur si nécessaire
echo "Creating superuser if needed..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SystemeRH_v2.settings')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='wael').exists():
    User.objects.create_superuser('wael', 'wael@example.com', 'Azerty\$123')
    print('Superuser created.')
else:
    print('Superuser already exists.')
"

# Démarrer le serveur
echo "Starting server..."
python manage.py runserver 0.0.0.0:8000
