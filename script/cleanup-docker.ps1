# Script de nettoyage complet de Docker Desktop
# Usage: .\script\cleanup-docker.ps1

param(
    [switch]$Force = $false,
    [switch]$KeepImages = $false
)

Write-Host "🧹 Nettoyage complet de Docker Desktop..." -ForegroundColor Yellow

function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Confirmation si pas de force
if (-not $Force) {
    $confirmation = Read-Host "⚠️  Êtes-vous sûr de vouloir nettoyer Docker Desktop ? (y/N)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Info "Annulation du nettoyage."
        exit 0
    }
}

try {
    # 1. Arrêter tous les conteneurs
    Write-Info "Arrêt de tous les conteneurs..."
    $containers = docker ps -aq
    if ($containers) {
        docker stop $containers
        Write-Success "Tous les conteneurs ont été arrêtés"
    } else {
        Write-Info "Aucun conteneur en cours d'exécution"
    }

    # 2. Supprimer tous les conteneurs
    Write-Info "Suppression de tous les conteneurs..."
    $containers = docker ps -aq
    if ($containers) {
        docker rm $containers --force
        Write-Success "Tous les conteneurs ont été supprimés"
    } else {
        Write-Info "Aucun conteneur à supprimer"
    }

    # 3. Supprimer les images du projet si demandé
    if (-not $KeepImages) {
        Write-Info "Suppression des images du projet..."
        $projectImages = docker images "waelbenabid/*" -q
        if ($projectImages) {
            docker rmi $projectImages --force
            Write-Success "Images du projet supprimées"
        } else {
            Write-Info "Aucune image du projet trouvée"
        }
    }

    # 4. Nettoyer le système Docker
    Write-Info "Nettoyage du système Docker..."
    if ($KeepImages) {
        docker system prune --volumes --force
    } else {
        docker system prune -a --volumes --force
    }
    Write-Success "Système Docker nettoyé"

    # 5. Vérification finale
    Write-Info "Vérification finale..."
    $remainingContainers = docker ps -a --format "table {{.Names}}\t{{.Status}}"
    $remainingImages = docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    Write-Host ""
    Write-Host "📊 État final de Docker:" -ForegroundColor Cyan
    Write-Host "Conteneurs restants:" -ForegroundColor Yellow
    if ($remainingContainers) {
        Write-Host $remainingContainers
    } else {
        Write-Host "Aucun conteneur" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Images restantes:" -ForegroundColor Yellow
    if ($remainingImages) {
        Write-Host $remainingImages
    } else {
        Write-Host "Aucune image" -ForegroundColor Green
    }

    # 6. Afficher l'espace libéré
    Write-Host ""
    Write-Host "💾 Espace disque Docker:" -ForegroundColor Cyan
    docker system df

    Write-Success "Nettoyage Docker terminé !"
    
    Write-Host ""
    Write-Host "🚀 Pour reconstruire les images, utilisez:" -ForegroundColor Cyan
    Write-Host "docker build -t waelbenabid/rh-backend:latest ./back-end" -ForegroundColor Yellow
    Write-Host "docker build -t waelbenabid/rh-frontend:latest ./project" -ForegroundColor Yellow

} catch {
    Write-Error "Erreur lors du nettoyage: $_"
    exit 1
}
