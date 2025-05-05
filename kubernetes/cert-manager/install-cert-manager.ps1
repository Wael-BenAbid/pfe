#!/usr/bin/env pwsh

# Script pour installer cert-manager dans le cluster Kubernetes
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
    $kubectlVersion = kubectl version --client
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

# Ajouter le repo Helm de cert-manager
Write-Message "Ajout du repo Helm de cert-manager..." -color $colorInfo
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Installer cert-manager avec les CRDs
Write-Message "Installation de cert-manager..." -color $colorInfo
helm install cert-manager jetstack/cert-manager `
    --namespace cert-manager `
    --version v1.14.3 `
    --set installCRDs=true `
    --set prometheus.enabled=true `
    --set webhook.timeoutSeconds=30

# Attendre que cert-manager soit prêt
Write-Message "Attente que cert-manager soit prêt..." -color $colorInfo
kubectl -n cert-manager wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager --timeout=300s

# Vérifier l'installation
Write-Message "Vérification de l'installation de cert-manager..." -color $colorInfo
kubectl get pods -n cert-manager

Write-Message "cert-manager a été installé avec succès!" -color $colorSuccess
Write-Message "Vous pouvez maintenant configurer un émetteur de certificats (Issuer) et mettre à jour votre ingress." -color $colorInfo
