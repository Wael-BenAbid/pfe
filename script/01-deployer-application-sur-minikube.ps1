#!/usr/bin/env pwsh

# Script de déploiement sur Minikube pour l'application RH System
# Auteur: Wael Ben Abid
# Date: 05/05/2025

param(
    [Parameter(Mandatory=$false)]
    [string]$namespace = "rh-system",

    [Parameter(Mandatory=$false)]
    [switch]$enableHttps = $false
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

# Vérifier si Minikube est en cours d'exécution
$minikubeStatus = & minikube status
if ($minikubeStatus -match "host: Stopped") {
    Write-Message "Minikube n'est pas en cours d'exécution. Démarrage..." -color $colorWarning
    & minikube start --driver=docker
}

# Vérifier si l'addon ingress est activé
$ingressOutput = & minikube addons list
$ingressEnabled = $ingressOutput | Select-String "ingress"
if ($ingressEnabled -match "disabled") {
    Write-Message "L'addon ingress n'est pas activé. Activation..." -color $colorWarning
    & minikube addons enable ingress
}

# Obtenir l'adresse IP de Minikube
$minikubeIP = & minikube ip
Write-Message "Adresse IP de Minikube: $minikubeIP" -color $colorInfo

# Créer le namespace s'il n'existe pas
Write-Message "Création du namespace $namespace s'il n'existe pas..." -color $colorInfo
kubectl apply -f kubernetes/namespace/rh-system.yaml

# Créer les secrets
Write-Message "Création des secrets..." -color $colorInfo
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

# Mettre à jour les ConfigMaps
Write-Message "Mise à jour des ConfigMaps..." -color $colorInfo
$backendConfigMap = Get-Content kubernetes/configmaps/backend-configmap.yaml
$backendConfigMap = $backendConfigMap -replace 'ALLOWED_HOSTS: "localhost,127.0.0.1,rh-backend,rh-frontend,rh-system.local"', "ALLOWED_HOSTS: `"localhost,127.0.0.1,rh-backend,rh-frontend,rh-system.local,$minikubeIP`""
$backendConfigMap = $backendConfigMap -replace 'FRONTEND_URL: "http://rh-system.local"', 'FRONTEND_URL: "http://rh-system.local"'
Set-Content kubernetes/configmaps/backend-configmap.yaml $backendConfigMap

$frontendConfigMap = Get-Content kubernetes/configmaps/frontend-configmap.yaml
$frontendConfigMap = $frontendConfigMap -replace 'API_BASE_URL: "http://rh-system.local/api"', 'API_BASE_URL: "http://rh-system.local/api"'
Set-Content kubernetes/configmaps/frontend-configmap.yaml $frontendConfigMap

# Déployer les ConfigMaps
Write-Message "Déploiement des ConfigMaps..." -color $colorInfo
kubectl apply -f kubernetes/configmaps/ -n $namespace

# Déployer le stockage
Write-Message "Déploiement du stockage..." -color $colorInfo
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
if ($enableHttps) {
    # Vérifier si cert-manager est installé
    $certManagerPods = kubectl get pods -n cert-manager -l app.kubernetes.io/instance=cert-manager --ignore-not-found
    if (-not $certManagerPods) {
        Write-Message "cert-manager n'est pas installé. Installation..." -color $colorWarning
        & .\kubernetes\cert-manager\install-cert-manager.ps1
    } else {
        Write-Message "cert-manager est déjà installé." -color $colorInfo
    }

    # Appliquer les émetteurs de certificats
    Write-Message "Application des émetteurs de certificats..." -color $colorInfo
    kubectl apply -f kubernetes\cert-manager\selfsigned-issuer.yaml

    # Attendre que les émetteurs soient prêts
    Write-Message "Attente que les émetteurs soient prêts..." -color $colorInfo
    Start-Sleep -Seconds 10

    # Appliquer l'ingress avec TLS
    Write-Message "Application de l'ingress avec TLS..." -color $colorInfo
    kubectl apply -f kubernetes\ingress\ingress-tls.yaml -n $namespace
} else {
    # Appliquer l'ingress standard
    kubectl apply -f kubernetes/ingress/ingress.yaml -n $namespace
}

# Afficher les ressources déployées
Write-Message "Ressources déployées:" -color $colorSuccess
Write-Message "Pods:" -color $colorInfo
kubectl get pods -n $namespace
Write-Message "Services:" -color $colorInfo
kubectl get services -n $namespace
Write-Message "Ingress:" -color $colorInfo
kubectl get ingress -n $namespace

# Afficher les instructions pour accéder à l'application
Write-Message "L'application est maintenant déployée sur Minikube!" -color $colorSuccess
Write-Message "Pour accéder à l'application, vous devez:" -color $colorInfo
Write-Message "1. Vérifier que l'entrée suivante est dans votre fichier hosts:" -color $colorInfo
Write-Message "   $minikubeIP rh-system.local" -color $colorInfo
Write-Message "2. Démarrer le tunnel Minikube:" -color $colorInfo
Write-Message "   minikube tunnel" -color $colorInfo
Write-Message "3. Accéder à l'application via:" -color $colorInfo
if ($enableHttps) {
    Write-Message "   Frontend: https://rh-system.local/" -color $colorSuccess
    Write-Message "   Backend API: https://rh-system.local/api/" -color $colorSuccess
    Write-Message "   Backend Admin: https://rh-system.local/admin/" -color $colorSuccess
    Write-Message "   Note: Comme nous utilisons un certificat auto-signé pour le développement, votre navigateur affichera un avertissement de sécurité." -color $colorWarning
    Write-Message "   Vous pouvez ignorer cet avertissement en développement, mais en production, vous devriez utiliser un certificat valide." -color $colorWarning
} else {
    Write-Message "   Frontend: http://rh-system.local/" -color $colorInfo
    Write-Message "   Backend API: http://rh-system.local/api/" -color $colorInfo
    Write-Message "   Backend Admin: http://rh-system.local/admin/" -color $colorInfo
}

# Démarrer le tunnel Minikube
Write-Message "Démarrage du tunnel Minikube..." -color $colorInfo
Write-Message "Appuyez sur Ctrl+C pour arrêter le tunnel." -color $colorInfo
Write-Message "Ouvrez un autre terminal pour continuer à travailler." -color $colorInfo
& minikube tunnel
