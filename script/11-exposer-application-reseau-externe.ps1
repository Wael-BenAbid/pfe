#!/usr/bin/env pwsh

# Script pour exposer l'application sur le réseau externe
# Auteur: Wael Ben Abid
# Date: 06/05/2025

param(
    [Parameter(Mandatory=$false)]
    [switch]$useHttps = $false
)

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

# Vérifier si kubectl est installé
try {
    kubectl version --client | Out-Null
    Write-Message "kubectl est installé" -color $colorInfo
} catch {
    Write-Message "kubectl n'est pas installé ou n'est pas dans le PATH. Veuillez l'installer et réessayer." -color $colorError
    exit 1
}

# Vérifier si Minikube est en cours d'exécution
$minikubeStatus = minikube status
if ($minikubeStatus -match "host: Stopped") {
    Write-Message "Minikube n'est pas en cours d'exécution. Démarrage..." -color $colorWarning
    minikube start
}

# Obtenir l'adresse IP locale
$localIP = "192.168.1.106"  # Adresse IP fixe pour éviter les problèmes de détection

if (-not $localIP) {
    Write-Message "Impossible de déterminer l'adresse IP locale. Veuillez la spécifier manuellement." -color $colorError
    exit 1
}

Write-Message "Adresse IP locale détectée: $localIP" -color $colorInfo

# Ajouter l'adresse IP locale aux hôtes autorisés dans le ConfigMap du backend
Write-Message "Mise à jour du ConfigMap du backend..." -color $colorInfo
$backendConfigMap = Get-Content kubernetes/configmaps/backend-configmap.yaml
$backendConfigMap = $backendConfigMap -replace 'ALLOWED_HOSTS: "localhost,127.0.0.1,rh-backend,rh-frontend,rh-system.local"', "ALLOWED_HOSTS: `"localhost,127.0.0.1,rh-backend,rh-frontend,rh-system.local,$localIP`""
Set-Content kubernetes/configmaps/backend-configmap.yaml $backendConfigMap

# Appliquer le ConfigMap mis à jour
Write-Message "Application du ConfigMap mis à jour..." -color $colorInfo
kubectl apply -f kubernetes/configmaps/backend-configmap.yaml -n rh-system

# Redémarrer le backend pour prendre en compte les modifications
Write-Message "Redémarrage du backend..." -color $colorInfo
kubectl rollout restart deployment/rh-backend -n rh-system
kubectl rollout status deployment/rh-backend -n rh-system --timeout=300s

# Exposer les services sur l'adresse IP locale
Write-Message "Exposition des services sur l'adresse IP locale..." -color $colorInfo

# Arrêter les processus kubectl port-forward existants
$portForwardProcesses = Get-Process | Where-Object { $_.ProcessName -eq "kubectl" -and $_.CommandLine -match "port-forward" }
if ($portForwardProcesses) {
    Write-Message "Arrêt des processus kubectl port-forward existants..." -color $colorInfo
    $portForwardProcesses | ForEach-Object { Stop-Process -Id $_.Id -Force }
}

# Configurer les services NodePort
Write-Message "Configuration des services NodePort..." -color $colorInfo
kubectl patch service rh-frontend -n rh-system -p '{"spec": {"type": "NodePort", "ports": [{"port": 80, "nodePort": 30090}]}}' | Out-Null
kubectl patch service rh-backend -n rh-system -p '{"spec": {"type": "NodePort", "ports": [{"port": 8000, "nodePort": 30091}]}}' | Out-Null

# Démarrer le tunnel Minikube
Write-Message "Démarrage du tunnel Minikube en arrière-plan..." -color $colorInfo
Start-Process -FilePath "minikube" -ArgumentList "tunnel" -WindowStyle Hidden

# Afficher les instructions pour accéder à l'application
Write-Message "L'application est maintenant accessible sur le réseau externe!" -color $colorSuccess
Write-Message "Adresse IP locale: $localIP" -color $colorInfo
# Obtenir l'adresse IP de Minikube
$minikubeIP = "192.168.49.2"  # Adresse IP fixe de Minikube
Write-Message "Adresse IP de Minikube: $minikubeIP" -color $colorInfo

if ($useHttps) {
    Write-Message "Frontend via adresse IP locale: https://$($localIP):30090/" -color $colorSuccess
    Write-Message "Backend API via adresse IP locale: https://$($localIP):30091/api/" -color $colorSuccess
    Write-Message "Backend Admin via adresse IP locale: https://$($localIP):30091/admin/" -color $colorSuccess
    Write-Message "Note: Comme nous utilisons un certificat auto-signé, votre navigateur affichera un avertissement de sécurité." -color $colorWarning
} else {
    Write-Message "Frontend via adresse IP locale: http://$($localIP):30090/" -color $colorSuccess
    Write-Message "Backend API via adresse IP locale: http://$($localIP):30091/api/" -color $colorSuccess
    Write-Message "Backend Admin via adresse IP locale: http://$($localIP):30091/admin/" -color $colorSuccess
}

Write-Message "Vous pouvez également essayer d'accéder à l'application via l'adresse IP de Minikube:" -color $colorInfo
Write-Message "Frontend via Minikube: http://$($minikubeIP):30090/" -color $colorSuccess
Write-Message "Backend API via Minikube: http://$($minikubeIP):30091/api/" -color $colorSuccess
Write-Message "Backend Admin via Minikube: http://$($minikubeIP):30091/admin/" -color $colorSuccess

Write-Message "Pour accéder à l'application depuis un autre appareil sur le même réseau WiFi, utilisez les URLs ci-dessus." -color $colorInfo
Write-Message "Pour arrêter l'exposition, fermez cette fenêtre ou exécutez:" -color $colorInfo
Write-Message "Get-Process | Where-Object { `$_.ProcessName -eq 'kubectl' -and `$_.CommandLine -match 'port-forward' } | Stop-Process -Force" -color $colorInfo

# Créer un QR code pour faciliter l'accès depuis un appareil mobile
Write-Message "Création d'un QR code pour faciliter l'accès depuis un appareil mobile..." -color $colorInfo
$frontendUrl = if ($useHttps) { "https://$($localIP):30090/" } else { "http://$($localIP):30090/" }
$qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=$frontendUrl"

# Créer un QR code pour l'accès via Minikube
$frontendMinikubeUrl = "http://$($minikubeIP):30090/"
$qrCodeMinikubeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=$frontendMinikubeUrl"

Write-Message "Vous pouvez scanner ces QR codes avec votre téléphone pour accéder à l'application:" -color $colorInfo
Write-Message "QR code pour l'adresse IP locale:" -color $colorInfo
Write-Message $qrCodeUrl -color $colorSuccess
Write-Message "QR code pour l'adresse IP de Minikube:" -color $colorInfo
Write-Message $qrCodeMinikubeUrl -color $colorSuccess

# Ouvrir les QR codes dans le navigateur
Start-Process $qrCodeUrl
Start-Process $qrCodeMinikubeUrl
