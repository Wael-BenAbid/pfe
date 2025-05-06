#!/usr/bin/env pwsh

# Script pour installer cert-manager sans Helm
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

# Vérifier si kubectl est installé
try {
    kubectl version --client
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

# Créer le namespace cert-manager
Write-Message "Création du namespace cert-manager..." -color $colorInfo
kubectl create namespace cert-manager --dry-run=client -o yaml | kubectl apply -f -

# Télécharger le manifeste cert-manager
$certManagerVersion = "v1.14.3"
$certManagerUrl = "https://github.com/cert-manager/cert-manager/releases/download/$certManagerVersion/cert-manager.yaml"
$certManagerYaml = "cert-manager.yaml"

Write-Message "Téléchargement du manifeste cert-manager $certManagerVersion..." -color $colorInfo
Invoke-WebRequest -Uri $certManagerUrl -OutFile $certManagerYaml

# Appliquer le manifeste
Write-Message "Application du manifeste cert-manager..." -color $colorInfo
kubectl apply -f $certManagerYaml

# Attendre que cert-manager soit prêt
Write-Message "Attente que cert-manager soit prêt..." -color $colorInfo
Write-Message "Cela peut prendre quelques minutes..." -color $colorInfo
Start-Sleep -Seconds 30

# Vérifier l'installation
Write-Message "Vérification de l'installation de cert-manager..." -color $colorInfo
kubectl get pods -n cert-manager

# Attendre que tous les pods cert-manager soient prêts
Write-Message "Attente que tous les pods cert-manager soient prêts..." -color $colorInfo
kubectl wait --for=condition=ready pod -l app=cert-manager -n cert-manager --timeout=300s
kubectl wait --for=condition=ready pod -l app=webhook -n cert-manager --timeout=300s
kubectl wait --for=condition=ready pod -l app=cainjector -n cert-manager --timeout=300s

Write-Message "cert-manager a été installé avec succès!" -color $colorSuccess
Write-Message "Vous pouvez maintenant configurer un émetteur de certificats (Issuer) et mettre à jour votre ingress." -color $colorInfo
