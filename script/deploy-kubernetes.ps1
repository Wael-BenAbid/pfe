#!/usr/bin/env pwsh

# Script de déploiement Kubernetes pour l'application RH System
# Auteur: Wael Ben Abid
# Date: 05/05/2025

param(
    [Parameter(Mandatory=$false)]
    [string]$environment = "production",
    
    [Parameter(Mandatory=$false)]
    [string]$namespace = "rh-system",
    
    [Parameter(Mandatory=$false)]
    [string]$kubeconfig = ""
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
    $kubectlVersion = kubectl version --client --short
    Write-Message "kubectl version: $kubectlVersion" -color $colorInfo
} catch {
    Write-Message "kubectl n'est pas installé ou n'est pas dans le PATH. Veuillez l'installer et réessayer." -color $colorError
    exit 1
}

# Configurer kubeconfig si spécifié
if ($kubeconfig -ne "") {
    $env:KUBECONFIG = $kubeconfig
    Write-Message "Utilisation du fichier kubeconfig: $kubeconfig" -color $colorInfo
}

# Vérifier la connexion au cluster
try {
    $clusterInfo = kubectl cluster-info
    Write-Message "Connecté au cluster Kubernetes:" -color $colorSuccess
    Write-Message $clusterInfo -color $colorInfo
} catch {
    Write-Message "Impossible de se connecter au cluster Kubernetes. Veuillez vérifier votre configuration." -color $colorError
    exit 1
}

# Créer le namespace s'il n'existe pas
Write-Message "Création du namespace $namespace s'il n'existe pas..." -color $colorInfo
kubectl create namespace $namespace --dry-run=client -o yaml | kubectl apply -f -

# Appliquer les ConfigMaps
Write-Message "Application des ConfigMaps..." -color $colorInfo
kubectl apply -f kubernetes/configmaps/ -n $namespace

# Appliquer les Secrets
Write-Message "Application des Secrets..." -color $colorInfo
# Vous devriez créer les secrets à partir de variables d'environnement ou d'un gestionnaire de secrets
# Exemple avec des valeurs codées en dur (à éviter en production)
kubectl create secret generic postgres-secrets `
    --namespace=$namespace `
    --from-literal=POSTGRES_PASSWORD="12345" `
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic rh-backend-secrets `
    --namespace=$namespace `
    --from-literal=SECRET_KEY="django-insecure-4!@e#some$%random^&characters" `
    --from-literal=DATABASE_PASSWORD="12345" `
    --from-literal=EMAIL_HOST_USER="waelbenabid1@gmail.com" `
    --from-literal=EMAIL_HOST_PASSWORD="rkoe ufhs iike osmz" `
    --from-literal=SENDGRID_API_KEY="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" `
    --dry-run=client -o yaml | kubectl apply -f -

# Appliquer les PVCs
Write-Message "Application des PVCs..." -color $colorInfo
kubectl apply -f kubernetes/storage/ -n $namespace

# Déployer PostgreSQL
Write-Message "Déploiement de PostgreSQL..." -color $colorInfo
kubectl apply -f kubernetes/deployments/postgres-deployment.yaml -n $namespace
kubectl apply -f kubernetes/services/postgres-service.yaml -n $namespace

# Attendre que PostgreSQL soit prêt
Write-Message "Attente que PostgreSQL soit prêt..." -color $colorInfo
kubectl rollout status deployment/postgres-db -n $namespace --timeout=300s

# Déployer le backend
Write-Message "Déploiement du backend..." -color $colorInfo
kubectl apply -f kubernetes/deployments/backend-deployment.yaml -n $namespace
kubectl apply -f kubernetes/services/backend-service.yaml -n $namespace

# Attendre que le backend soit prêt
Write-Message "Attente que le backend soit prêt..." -color $colorInfo
kubectl rollout status deployment/rh-backend -n $namespace --timeout=300s

# Déployer le frontend
Write-Message "Déploiement du frontend..." -color $colorInfo
kubectl apply -f kubernetes/deployments/frontend-deployment.yaml -n $namespace
kubectl apply -f kubernetes/services/frontend-service.yaml -n $namespace

# Attendre que le frontend soit prêt
Write-Message "Attente que le frontend soit prêt..." -color $colorInfo
kubectl rollout status deployment/rh-frontend -n $namespace --timeout=300s

# Déployer l'ingress
Write-Message "Déploiement de l'ingress..." -color $colorInfo
kubectl apply -f kubernetes/ingress/ -n $namespace

# Déployer l'autoscaling
Write-Message "Déploiement de l'autoscaling..." -color $colorInfo
kubectl apply -f kubernetes/autoscaling/ -n $namespace

# Déployer les politiques réseau
Write-Message "Déploiement des politiques réseau..." -color $colorInfo
kubectl apply -f kubernetes/security/network-policies/ -n $namespace

# Afficher les ressources déployées
Write-Message "Ressources déployées:" -color $colorSuccess
Write-Message "Pods:" -color $colorInfo
kubectl get pods -n $namespace
Write-Message "Services:" -color $colorInfo
kubectl get services -n $namespace
Write-Message "Ingress:" -color $colorInfo
kubectl get ingress -n $namespace

# Afficher les URLs d'accès
Write-Message "L'application est maintenant déployée sur Kubernetes!" -color $colorSuccess
Write-Message "Pour accéder à l'application, ajoutez l'entrée suivante à votre fichier hosts:" -color $colorInfo
Write-Message "$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}') rh-system.local" -color $colorInfo
Write-Message "URLs d'accès:" -color $colorInfo
Write-Message "Frontend: http://rh-system.local/" -color $colorInfo
Write-Message "Backend API: http://rh-system.local/api/" -color $colorInfo
Write-Message "Backend Admin: http://rh-system.local/admin/" -color $colorInfo

# Afficher les instructions pour le monitoring et le logging
Write-Message "Pour déployer le monitoring (Prometheus et Grafana):" -color $colorInfo
Write-Message "kubectl apply -f kubernetes/monitoring/ -n monitoring" -color $colorInfo
Write-Message "Pour déployer le logging (ELK Stack):" -color $colorInfo
Write-Message "kubectl apply -f kubernetes/logging/ -n logging" -color $colorInfo
