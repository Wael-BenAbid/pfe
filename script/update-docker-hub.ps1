# Script pour mettre à jour Docker Hub à partir de l'environnement local
# Ce script construit et pousse les images Docker vers Docker Hub

param (
    [switch]$Frontend = $false,
    [switch]$Backend = $false,
    [switch]$All = $false,
    [string]$Tag = "latest"
)

# Configuration
$DOCKER_HUB_USERNAME = "waelbenabid"
$FRONTEND_IMAGE = "rh-frontend"
$BACKEND_IMAGE = "rh-backend"

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\update-docker-hub.ps1 [-Frontend] [-Backend] [-All] [-Tag <tag>]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Frontend    Mettre à jour uniquement l'image frontend"
    Write-Host "  -Backend     Mettre à jour uniquement l'image backend"
    Write-Host "  -All         Mettre à jour les deux images"
    Write-Host "  -Tag         Spécifier un tag pour les images (par défaut: latest)"
    Write-Host ""
    Write-Host "Exemples:"
    Write-Host "  .\update-docker-hub.ps1 -All                  # Met à jour les deux images avec le tag 'latest'"
    Write-Host "  .\update-docker-hub.ps1 -Frontend -Tag v1.0   # Met à jour uniquement l'image frontend avec le tag 'v1.0'"
    Write-Host "  .\update-docker-hub.ps1 -Backend              # Met à jour uniquement l'image backend avec le tag 'latest'"
    exit
}

# Vérifier si aucune option n'est spécifiée
if (-not $Frontend -and -not $Backend -and -not $All) {
    Show-Help
}

# Si -All est spécifié, mettre à jour les deux images
if ($All) {
    $Frontend = $true
    $Backend = $true
}

# Générer un timestamp pour le tag si aucun tag n'est spécifié
if ($Tag -eq "latest") {
    $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $Tag = "latest,$Timestamp"
}

# Fonction pour construire et pousser une image
function Build-And-Push-Image {
    param (
        [string]$ImageName,
        [string]$Context,
        [string]$Tags
    )

    Write-Host "Construction de l'image $ImageName..."
    
    # Construire l'image
    $TagsArray = $Tags.Split(',')
    $TagsString = ""
    foreach ($TagItem in $TagsArray) {
        $TagsString += "-t $DOCKER_HUB_USERNAME/$ImageName`:$TagItem "
    }
    
    # Exécuter la commande de construction
    $BuildCommand = "docker build $TagsString $Context"
    Write-Host "Exécution de: $BuildCommand"
    Invoke-Expression $BuildCommand
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors de la construction de l'image $ImageName" -ForegroundColor Red
        exit 1
    }
    
    # Pousser l'image vers Docker Hub
    Write-Host "Envoi de l'image $ImageName vers Docker Hub..."
    foreach ($TagItem in $TagsArray) {
        $PushCommand = "docker push $DOCKER_HUB_USERNAME/$ImageName`:$TagItem"
        Write-Host "Exécution de: $PushCommand"
        Invoke-Expression $PushCommand
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Erreur lors de l'envoi de l'image $ImageName`:$TagItem vers Docker Hub" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "Image $ImageName mise à jour avec succès sur Docker Hub" -ForegroundColor Green
}

# Se connecter à Docker Hub
Write-Host "Connexion à Docker Hub..."
docker login -u $DOCKER_HUB_USERNAME
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la connexion à Docker Hub" -ForegroundColor Red
    exit 1
}

# Mettre à jour l'image frontend si demandé
if ($Frontend) {
    Build-And-Push-Image -ImageName $FRONTEND_IMAGE -Context "./project" -Tags $Tag
}

# Mettre à jour l'image backend si demandé
if ($Backend) {
    Build-And-Push-Image -ImageName $BACKEND_IMAGE -Context "./back-end" -Tags $Tag
}

Write-Host "Mise à jour de Docker Hub terminée avec succès!" -ForegroundColor Green

# Mettre à jour les déploiements Kubernetes si nécessaire
$UpdateK8s = Read-Host "Voulez-vous mettre à jour les déploiements Kubernetes? (o/n)"
if ($UpdateK8s -eq "o" -or $UpdateK8s -eq "O") {
    # Extraire le dernier tag (timestamp)
    $LastTag = $Tag.Split(',')[-1]
    
    if ($Frontend) {
        Write-Host "Mise à jour du déploiement frontend dans Kubernetes..."
        kubectl set image deployment/rh-frontend rh-frontend=$DOCKER_HUB_USERNAME/$FRONTEND_IMAGE`:$LastTag -n rh-system
        kubectl rollout status deployment/rh-frontend -n rh-system
    }
    
    if ($Backend) {
        Write-Host "Mise à jour du déploiement backend dans Kubernetes..."
        kubectl set image deployment/rh-backend rh-backend=$DOCKER_HUB_USERNAME/$BACKEND_IMAGE`:$LastTag -n rh-system
        kubectl rollout status deployment/rh-backend -n rh-system
    }
    
    Write-Host "Déploiements Kubernetes mis à jour avec succès!" -ForegroundColor Green
}
