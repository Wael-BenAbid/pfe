# Script de déploiement pour Docker Desktop
Write-Host "Déploiement de l'application sur Docker Desktop..." -ForegroundColor Green

# Vérifier si Docker est en cours d'exécution
try {
    docker info | Out-Null
    Write-Host "Docker Desktop est en cours d'exécution." -ForegroundColor Green
}
catch {
    Write-Host "Docker Desktop n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop et réessayer." -ForegroundColor Red
    exit 1
}

# Télécharger les dernières images depuis Docker Hub
Write-Host "Téléchargement des dernières images depuis Docker Hub..." -ForegroundColor Yellow
docker pull waelbenabid/rh-frontend:latest
docker pull waelbenabid/rh-system-backend:latest

# Arrêter les conteneurs existants
Write-Host "Arrêt des conteneurs existants..." -ForegroundColor Yellow
docker-compose down

# Démarrer les conteneurs avec les nouvelles images
Write-Host "Démarrage des conteneurs avec les nouvelles images..." -ForegroundColor Yellow
docker-compose up -d

# Vérifier l'état des conteneurs
Write-Host "Vérification de l'état des conteneurs..." -ForegroundColor Yellow
docker-compose ps

Write-Host "Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host "L'application est accessible aux adresses suivantes:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:5175" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "- Interface d'administration Django: http://localhost:8000/admin/" -ForegroundColor Cyan
Write-Host "- Zipkin (si activé): http://localhost:9411" -ForegroundColor Cyan
