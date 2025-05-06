#!/usr/bin/env pwsh

# Script pour configurer HTTPS sur l'application RH System
# Auteur: Wael Ben Abid
# Date: 06/05/2025

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

# Vérifier si cert-manager est installé
$certManagerPods = kubectl get pods -n cert-manager -l app=cert-manager --ignore-not-found
if (-not $certManagerPods) {
    Write-Message "cert-manager n'est pas installé. Installation..." -color $colorWarning
    & .\script\19-installer-cert-manager-sans-helm.ps1
} else {
    Write-Message "cert-manager est déjà installé." -color $colorInfo
}

# Appliquer les émetteurs de certificats
Write-Message "Application des émetteurs de certificats..." -color $colorInfo
kubectl apply -f kubernetes\cert-manager\selfsigned-issuer.yaml
kubectl apply -f kubernetes\cert-manager\letsencrypt-staging-issuer.yaml
kubectl apply -f kubernetes\cert-manager\letsencrypt-prod-issuer.yaml

# Attendre que les émetteurs soient prêts
Write-Message "Attente que les émetteurs soient prêts..." -color $colorInfo
Start-Sleep -Seconds 10

# Appliquer l'ingress avec TLS
Write-Message "Application de l'ingress avec TLS..." -color $colorInfo
kubectl apply -f kubernetes\ingress\ingress-tls.yaml

# Attendre que le certificat soit émis
Write-Message "Attente que le certificat soit émis..." -color $colorInfo
Start-Sleep -Seconds 20

# Vérifier le certificat
Write-Message "Vérification du certificat..." -color $colorInfo
kubectl get certificate -n rh-system

# Vérifier l'ingress
Write-Message "Vérification de l'ingress..." -color $colorInfo
kubectl get ingress -n rh-system

# Démarrer le tunnel Minikube si nécessaire
$tunnelRunning = Get-Process | Where-Object { $_.ProcessName -eq "minikube" -and $_.CommandLine -match "tunnel" }
if (-not $tunnelRunning) {
    Write-Message "Démarrage du tunnel Minikube en arrière-plan..." -color $colorInfo
    Start-Process -FilePath "minikube" -ArgumentList "tunnel" -WindowStyle Hidden
}

# Afficher les instructions pour accéder à l'application
Write-Message "HTTPS a été configuré avec succès!" -color $colorSuccess
Write-Message "Vous pouvez maintenant accéder à l'application via HTTPS:" -color $colorInfo
Write-Message "Frontend: https://rh-system.local/" -color $colorSuccess
Write-Message "Backend API: https://rh-system.local/api/" -color $colorSuccess
Write-Message "Backend Admin: https://rh-system.local/admin/" -color $colorSuccess
Write-Message "Note: Comme nous utilisons un certificat auto-signé pour le développement, votre navigateur affichera un avertissement de sécurité." -color $colorWarning
Write-Message "Vous pouvez ignorer cet avertissement en développement, mais en production, vous devriez utiliser un certificat valide." -color $colorWarning
