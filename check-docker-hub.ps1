# Script pour vérifier si les images Docker Hub sont à jour
# Ce script récupère les informations sur les images Docker Hub et les affiche

param (
    [switch]$Frontend = $false,
    [switch]$Backend = $false,
    [switch]$All = $false,
    [switch]$Kubernetes = $false
)

# Configuration
$DOCKER_HUB_USERNAME = "waelbenabid"
$FRONTEND_IMAGE = "rh-frontend"
$BACKEND_IMAGE = "rh-backend"
$KUBERNETES_NAMESPACE = "rh-system"

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\check-docker-hub.ps1 [-Frontend] [-Backend] [-All] [-Kubernetes]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Frontend    Vérifier uniquement l'image frontend"
    Write-Host "  -Backend     Vérifier uniquement l'image backend"
    Write-Host "  -All         Vérifier les deux images"
    Write-Host "  -Kubernetes  Vérifier également les images utilisées dans Kubernetes"
    Write-Host ""
    Write-Host "Exemples:"
    Write-Host "  .\check-docker-hub.ps1 -All                  # Vérifie les deux images"
    Write-Host "  .\check-docker-hub.ps1 -Frontend             # Vérifie uniquement l'image frontend"
    Write-Host "  .\check-docker-hub.ps1 -All -Kubernetes      # Vérifie les deux images et Kubernetes"
    exit
}

# Vérifier si aucune option n'est spécifiée
if (-not $Frontend -and -not $Backend -and -not $All) {
    Show-Help
}

# Si -All est spécifié, vérifier les deux images
if ($All) {
    $Frontend = $true
    $Backend = $true
}

# Fonction pour vérifier une image Docker Hub
function Check-DockerHubImage {
    param (
        [string]$ImageName
    )

    Write-Host "Vérification de l'image $DOCKER_HUB_USERNAME/$ImageName..." -ForegroundColor Cyan
    
    try {
        # Récupérer les informations sur l'image depuis Docker Hub
        $url = "https://hub.docker.com/v2/repositories/$DOCKER_HUB_USERNAME/$ImageName/tags/latest"
        $response = Invoke-RestMethod -Uri $url -ErrorAction Stop
        
        # Afficher les informations
        Write-Host "Image: $DOCKER_HUB_USERNAME/$ImageName" -ForegroundColor Green
        Write-Host "Tag: latest" -ForegroundColor Green
        Write-Host "Dernière mise à jour: $($response.last_updated)" -ForegroundColor Green
        Write-Host "Taille: $([math]::Round($response.full_size / 1MB, 2)) MB" -ForegroundColor Green
        Write-Host "Digest: $($response.digest)" -ForegroundColor Green
        Write-Host ""
        
        return $response
    }
    catch {
        Write-Host "Erreur lors de la récupération des informations pour $DOCKER_HUB_USERNAME/$ImageName" -ForegroundColor Red
        Write-Host "Message d'erreur: $_" -ForegroundColor Red
        Write-Host ""
        return $null
    }
}

# Fonction pour vérifier une image dans Kubernetes
function Check-KubernetesImage {
    param (
        [string]$AppName,
        [string]$ImageName
    )

    Write-Host "Vérification de l'image $ImageName dans Kubernetes..." -ForegroundColor Cyan
    
    try {
        # Récupérer le nom du pod
        $podName = kubectl get pods -n $KUBERNETES_NAMESPACE -l app=$AppName -o jsonpath="{.items[0].metadata.name}" 2>$null
        
        if (-not $podName) {
            Write-Host "Aucun pod trouvé pour l'application $AppName" -ForegroundColor Yellow
            return
        }
        
        # Récupérer les détails du pod
        $podDetails = kubectl describe pod -n $KUBERNETES_NAMESPACE $podName 2>$null
        
        if (-not $podDetails) {
            Write-Host "Impossible de récupérer les détails du pod $podName" -ForegroundColor Yellow
            return
        }
        
        # Extraire l'image utilisée
        $imagePattern = "Image:\s+$DOCKER_HUB_USERNAME/$ImageName:(.+)"
        $imageMatch = [regex]::Match($podDetails, $imagePattern)
        
        if ($imageMatch.Success) {
            $imageTag = $imageMatch.Groups[1].Value
            Write-Host "Pod: $podName" -ForegroundColor Green
            Write-Host "Image utilisée: $DOCKER_HUB_USERNAME/$ImageName:$imageTag" -ForegroundColor Green
            Write-Host ""
        }
        else {
            Write-Host "Impossible de trouver l'image $DOCKER_HUB_USERNAME/$ImageName dans le pod $podName" -ForegroundColor Yellow
            Write-Host ""
        }
    }
    catch {
        Write-Host "Erreur lors de la vérification de l'image dans Kubernetes" -ForegroundColor Red
        Write-Host "Message d'erreur: $_" -ForegroundColor Red
        Write-Host ""
    }
}

# Vérifier l'image frontend si demandé
if ($Frontend) {
    $frontendInfo = Check-DockerHubImage -ImageName $FRONTEND_IMAGE
    
    if ($Kubernetes -and $frontendInfo) {
        Check-KubernetesImage -AppName "rh-frontend" -ImageName $FRONTEND_IMAGE
    }
}

# Vérifier l'image backend si demandé
if ($Backend) {
    $backendInfo = Check-DockerHubImage -ImageName $BACKEND_IMAGE
    
    if ($Kubernetes -and $backendInfo) {
        Check-KubernetesImage -AppName "rh-backend" -ImageName $BACKEND_IMAGE
    }
}

Write-Host "Vérification terminée!" -ForegroundColor Green
