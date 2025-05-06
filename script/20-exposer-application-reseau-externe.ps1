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
$localIP = (Get-NetIPAddress | Where-Object { $_.AddressFamily -eq 'IPv4' -and $_.PrefixOrigin -eq 'Dhcp' }).IPAddress
if (-not $localIP) {
    $localIP = (Get-NetIPAddress | Where-Object { $_.AddressFamily -eq 'IPv4' -and $_.InterfaceAlias -match 'Ethernet|Wi-Fi' -and $_.IPAddress -notmatch '^169\.254\.' }).IPAddress | Select-Object -First 1
}

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

# Exposer le backend
Start-Process -FilePath "kubectl" -ArgumentList "port-forward -n rh-system svc/rh-backend 8000:8000 --address 0.0.0.0" -WindowStyle Hidden

# Exposer le frontend
Start-Process -FilePath "kubectl" -ArgumentList "port-forward -n rh-system svc/rh-frontend 5173:80 --address 0.0.0.0" -WindowStyle Hidden

# Afficher les instructions pour accéder à l'application
Write-Message "L'application est maintenant accessible sur le réseau externe!" -color $colorSuccess
if ($useHttps) {
    Write-Message "Frontend: https://$localIP:5173/" -color $colorSuccess
    Write-Message "Backend API: https://$localIP:8000/api/" -color $colorSuccess
    Write-Message "Backend Admin: https://$localIP:8000/admin/" -color $colorSuccess
    Write-Message "Note: Comme nous utilisons un certificat auto-signé, votre navigateur affichera un avertissement de sécurité." -color $colorWarning
} else {
    Write-Message "Frontend: http://$localIP:5173/" -color $colorSuccess
    Write-Message "Backend API: http://$localIP:8000/api/" -color $colorSuccess
    Write-Message "Backend Admin: http://$localIP:8000/admin/" -color $colorSuccess
}

Write-Message "Pour accéder à l'application depuis un autre appareil sur le même réseau WiFi, utilisez les URLs ci-dessus." -color $colorInfo
Write-Message "Pour arrêter l'exposition, fermez cette fenêtre ou exécutez:" -color $colorInfo
Write-Message "Get-Process | Where-Object { `$_.ProcessName -eq 'kubectl' -and `$_.CommandLine -match 'port-forward' } | Stop-Process -Force" -color $colorInfo

# Créer un QR code pour faciliter l'accès depuis un appareil mobile
Write-Message "Création d'un QR code pour faciliter l'accès depuis un appareil mobile..." -color $colorInfo
$frontendUrl = if ($useHttps) { "https://$localIP:5173/" } else { "http://$localIP:5173/" }
$qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=$frontendUrl"

Write-Message "Vous pouvez scanner ce QR code avec votre téléphone pour accéder à l'application:" -color $colorInfo
Write-Message "Ouvrez ce lien dans votre navigateur pour voir le QR code:" -color $colorInfo
Write-Message $qrCodeUrl -color $colorSuccess

# Ouvrir le QR code dans le navigateur
Start-Process $qrCodeUrl
