# Script pour démarrer l'application Docker avec la base de données locale

# Vérifier la connexion à la base de données
Write-Host "Vérification de la base de données locale..." -ForegroundColor Cyan
./check-db.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la vérification de la base de données. Arrêt du script." -ForegroundColor Red
    exit 1
}

# Arrêter tous les conteneurs en cours d'exécution
Write-Host "Arrêt des conteneurs en cours d'exécution..." -ForegroundColor Cyan
docker-compose down

# Reconstruire les images et démarrer les conteneurs
Write-Host "Démarrage de l'application..." -ForegroundColor Cyan
docker-compose up --build

# Note: Ce script ne se termine pas tant que l'application est en cours d'exécution
# Pour arrêter l'application, appuyez sur Ctrl+C
