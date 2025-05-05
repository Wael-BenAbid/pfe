# Script pour nettoyer l'environnement Docker

# Arrêter tous les conteneurs en cours d'exécution
Write-Host "Arrêt des conteneurs en cours d'exécution..." -ForegroundColor Cyan
docker-compose down -v

# Supprimer tous les volumes
Write-Host "Suppression des volumes Docker..." -ForegroundColor Cyan
docker volume prune -f

# Supprimer toutes les images non utilisées
Write-Host "Suppression des images Docker non utilisées..." -ForegroundColor Cyan
docker image prune -f

Write-Host "Nettoyage terminé." -ForegroundColor Green
