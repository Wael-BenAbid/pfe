#!/usr/bin/env pwsh

# Script pour configurer l'application pour utiliser la base de données Kubernetes
# Auteur: Wael Ben Abid
# Date: 05/05/2025

# Définir les couleurs pour les messages
$colorInfo = "Cyan"
$colorSuccess = "Green"
$colorWarning = "Yellow"
$colorError = "Red"

# Fonction pour afficher des messages
function Write-Message {
    param(
        [Parameter(Mandatory=$true)]
        [string]$message,

        [Parameter(Mandatory=$false)]
        [string]$color = "White"
    )

    Write-Host $message -ForegroundColor $color
}

# Vérifier si Minikube est en cours d'exécution
$minikubeStatus = minikube status
if ($minikubeStatus -match "host: Stopped") {
    Write-Message "Minikube n'est pas en cours d'exécution. Démarrage..." -color $colorWarning
    minikube start
}

# Vérifier si le tunnel Minikube est en cours d'exécution
Write-Message "Démarrage du tunnel Minikube en arrière-plan..." -color $colorInfo
Start-Process -FilePath "minikube" -ArgumentList "tunnel" -WindowStyle Hidden

# Vérifier que les pods sont en cours d'exécution
Write-Message "Vérification des pods..." -color $colorInfo
kubectl get pods -n rh-system

# Exposer les services
Write-Message "Exposition des services..." -color $colorInfo
Start-Process -FilePath "kubectl" -ArgumentList "port-forward -n rh-system svc/rh-backend 8000:8000 --address 0.0.0.0" -WindowStyle Hidden
Start-Process -FilePath "kubectl" -ArgumentList "port-forward -n rh-system svc/rh-frontend 5173:80 --address 0.0.0.0" -WindowStyle Hidden

# Afficher les URLs d'accès
Write-Message "L'application est maintenant accessible aux URLs suivantes:" -color $colorSuccess
Write-Message "Frontend: http://localhost:5173/" -color $colorSuccess
Write-Message "Backend API: http://localhost:8000/api/" -color $colorSuccess
Write-Message "Backend Admin: http://localhost:8000/admin/" -color $colorSuccess
Write-Message "Identifiants par défaut: admin / admin123" -color $colorSuccess

Write-Message "Configuration terminée!" -color $colorSuccess
Write-Message "Vous utilisez maintenant la base de données PostgreSQL dans Kubernetes." -color $colorSuccess
