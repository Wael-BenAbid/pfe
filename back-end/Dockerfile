# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

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

# Copy project files
COPY . .

# Nettoyer les fichiers statiques
RUN rm -rf staticfiles_v2 static

# Rendre le script d'initialisation exécutable
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Installer netcat pour vérifier la disponibilité de PostgreSQL
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Expose port
EXPOSE 8000

# Start the app with the entrypoint script
CMD ["./entrypoint.sh"]