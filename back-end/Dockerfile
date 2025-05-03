# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    python3-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create a non-root user to run the app
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Define build arguments for sensitive data
ARG SECRET_KEY
ARG EMAIL_HOST_USER
ARG EMAIL_HOST_PASSWORD

# Set environment variables from build arguments
ENV SECRET_KEY=${SECRET_KEY}
ENV EMAIL_HOST_USER=${EMAIL_HOST_USER}
ENV EMAIL_HOST_PASSWORD=${EMAIL_HOST_PASSWORD}

# Expose port
EXPOSE 8000

# Create entrypoint script
RUN echo '#!/bin/bash\n\
# Attendre que la base de données soit prête\n\
echo "Waiting for PostgreSQL to start..."\n\
while ! pg_isready -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER; do\n\
  sleep 1\n\
done\n\
echo "PostgreSQL started!"\n\
\n\
# Appliquer les migrations\n\
python manage.py migrate --noinput\n\
\n\
# Collecter les fichiers statiques\n\
python manage.py collectstatic --noinput\n\
\n\
# Démarrer le serveur\n\
python manage.py runserver 0.0.0.0:8000\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Start the app
CMD ["/app/entrypoint.sh"]