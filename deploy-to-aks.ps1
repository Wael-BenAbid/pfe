#!/usr/bin/env pwsh

# Script de déploiement sur AKS pour l'application RH System
# Auteur: Wael Ben Abid
# Date: 05/05/2025

param(
    [Parameter(Mandatory=$false)]
    [string]$resourceGroup = "rh-system-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$clusterName = "rh-system-aks",
    
    [Parameter(Mandatory=$false)]
    [string]$acrName = "rhsystemacr",
    
    [Parameter(Mandatory=$false)]
    [string]$namespace = "rh-system"
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

# Vérifier si Azure CLI est installé
try {
    $azVersion = az --version
    Write-Message "Azure CLI est installé." -color $colorInfo
} catch {
    Write-Message "Azure CLI n'est pas installé ou n'est pas dans le PATH. Veuillez l'installer et réessayer." -color $colorError
    Write-Message "Vous pouvez l'installer à partir de https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -color $colorInfo
    exit 1
}

# Se connecter à Azure
Write-Message "Connexion à Azure..." -color $colorInfo
az login

# Vérifier si le groupe de ressources existe
$resourceGroupExists = az group show --name $resourceGroup 2>$null
if (-not $resourceGroupExists) {
    Write-Message "Le groupe de ressources $resourceGroup n'existe pas. Création..." -color $colorWarning
    az group create --name $resourceGroup --location westeurope
}

# Vérifier si le cluster AKS existe
$aksExists = az aks show --resource-group $resourceGroup --name $clusterName 2>$null
if (-not $aksExists) {
    Write-Message "Le cluster AKS $clusterName n'existe pas. Création..." -color $colorWarning
    az aks create `
        --resource-group $resourceGroup `
        --name $clusterName `
        --node-count 2 `
        --node-vm-size Standard_D2s_v3 `
        --enable-addons monitoring `
        --generate-ssh-keys
}

# Obtenir les informations d'identification pour le cluster
Write-Message "Obtention des informations d'identification pour le cluster AKS..." -color $colorInfo
az aks get-credentials --resource-group $resourceGroup --name $clusterName --overwrite-existing

# Vérifier si ACR existe
$acrExists = az acr show --name $acrName 2>$null
if (-not $acrExists) {
    Write-Message "Le registre de conteneurs $acrName n'existe pas. Création..." -color $colorWarning
    az acr create `
        --resource-group $resourceGroup `
        --name $acrName `
        --sku Basic
    
    # Attacher ACR à AKS
    az aks update `
        --resource-group $resourceGroup `
        --name $clusterName `
        --attach-acr $acrName
}

# Se connecter à ACR
Write-Message "Connexion à ACR..." -color $colorInfo
az acr login --name $acrName

# Obtenir le serveur de connexion ACR
$acrLoginServer = az acr show --name $acrName --query loginServer --output tsv
Write-Message "Serveur de connexion ACR: $acrLoginServer" -color $colorInfo

# Construire et pousser les images
Write-Message "Construction et envoi des images Docker vers ACR..." -color $colorInfo
docker build -t $acrLoginServer/rh-frontend:latest ./project
docker build -t $acrLoginServer/rh-backend:latest ./back-end
docker push $acrLoginServer/rh-frontend:latest
docker push $acrLoginServer/rh-backend:latest

# Mettre à jour les fichiers de déploiement
Write-Message "Mise à jour des fichiers de déploiement..." -color $colorInfo
$frontendDeployment = Get-Content kubernetes/deployments/frontend-deployment.yaml
$frontendDeployment = $frontendDeployment -replace 'image: waelbenabid/rh-frontend:latest', "image: $acrLoginServer/rh-frontend:latest"
Set-Content kubernetes/deployments/frontend-deployment.yaml $frontendDeployment

$backendDeployment = Get-Content kubernetes/deployments/backend-deployment.yaml
$backendDeployment = $backendDeployment -replace 'image: waelbenabid/rh-backend:latest', "image: $acrLoginServer/rh-backend:latest"
Set-Content kubernetes/deployments/backend-deployment.yaml $backendDeployment

# Créer le namespace s'il n'existe pas
Write-Message "Création du namespace $namespace s'il n'existe pas..." -color $colorInfo
kubectl create namespace $namespace --dry-run=client -o yaml | kubectl apply -f -

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

# Vérifier si l'ingress controller est installé
$ingressControllerExists = kubectl get namespace ingress-nginx 2>$null
if (-not $ingressControllerExists) {
    Write-Message "Installation de l'ingress controller NGINX..." -color $colorInfo
    kubectl create namespace ingress-nginx
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    helm install nginx-ingress ingress-nginx/ingress-nginx `
        --namespace ingress-nginx `
        --set controller.replicaCount=2 `
        --set controller.nodeSelector."kubernetes\.io/os"=linux `
        --set defaultBackend.nodeSelector."kubernetes\.io/os"=linux
    
    # Attendre que l'ingress controller soit prêt
    Write-Message "Attente que l'ingress controller soit prêt..." -color $colorInfo
    kubectl wait --namespace ingress-nginx `
        --for=condition=ready pod `
        --selector=app.kubernetes.io/component=controller `
        --timeout=300s
}

# Déployer l'ingress
Write-Message "Déploiement de l'ingress..." -color $colorInfo
kubectl apply -f kubernetes/ingress/ -n $namespace

# Obtenir l'adresse IP publique de l'ingress controller
$ingressIP = kubectl get service -n ingress-nginx nginx-ingress-ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
Write-Message "Adresse IP de l'ingress controller: $ingressIP" -color $colorSuccess

# Afficher les instructions pour configurer le DNS
Write-Message "Pour configurer le DNS, vous pouvez:" -color $colorInfo
Write-Message "1. Ajouter une entrée dans votre fichier hosts:" -color $colorInfo
Write-Message "   $ingressIP rh-system.example.com" -color $colorInfo
Write-Message "2. Configurer un enregistrement DNS A pour rh-system.example.com pointant vers $ingressIP" -color $colorInfo

# Afficher les ressources déployées
Write-Message "Ressources déployées:" -color $colorSuccess
Write-Message "Pods:" -color $colorInfo
kubectl get pods -n $namespace
Write-Message "Services:" -color $colorInfo
kubectl get services -n $namespace
Write-Message "Ingress:" -color $colorInfo
kubectl get ingress -n $namespace

# Afficher les URLs d'accès
Write-Message "L'application est maintenant déployée sur AKS!" -color $colorSuccess
Write-Message "URLs d'accès:" -color $colorInfo
Write-Message "Frontend: http://$ingressIP/" -color $colorInfo
Write-Message "Backend API: http://$ingressIP/api/" -color $colorInfo
Write-Message "Backend Admin: http://$ingressIP/admin/" -color $colorInfo

# Afficher les instructions pour le monitoring et le logging
Write-Message "Pour déployer le monitoring (Prometheus et Grafana):" -color $colorInfo
Write-Message "kubectl apply -f kubernetes/monitoring/ -n monitoring" -color $colorInfo
Write-Message "Pour déployer le logging (ELK Stack):" -color $colorInfo
Write-Message "kubectl apply -f kubernetes/logging/ -n logging" -color $colorInfo
