#!/usr/bin/env pwsh

# Script de configuration d'un cluster AKS pour l'application RH System
# Auteur: Wael Ben Abid
# Date: 05/05/2025

param(
    [Parameter(Mandatory=$false)]
    [string]$resourceGroup = "rh-system-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$location = "westeurope",
    
    [Parameter(Mandatory=$false)]
    [string]$clusterName = "rh-system-aks",
    
    [Parameter(Mandatory=$false)]
    [int]$nodeCount = 2,
    
    [Parameter(Mandatory=$false)]
    [string]$vmSize = "Standard_D2s_v3"
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

# Créer un groupe de ressources
Write-Message "Création du groupe de ressources $resourceGroup dans la région $location..." -color $colorInfo
az group create --name $resourceGroup --location $location

# Créer un cluster AKS
Write-Message "Création du cluster AKS $clusterName..." -color $colorInfo
az aks create `
    --resource-group $resourceGroup `
    --name $clusterName `
    --node-count $nodeCount `
    --node-vm-size $vmSize `
    --enable-addons monitoring `
    --generate-ssh-keys

# Obtenir les informations d'identification pour le cluster AKS
Write-Message "Obtention des informations d'identification pour le cluster AKS..." -color $colorInfo
az aks get-credentials --resource-group $resourceGroup --name $clusterName

# Vérifier la connexion au cluster
Write-Message "Vérification de la connexion au cluster..." -color $colorInfo
kubectl get nodes

# Installer l'ingress controller NGINX
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

# Obtenir l'adresse IP publique de l'ingress controller
$ingressIP = kubectl get service -n ingress-nginx nginx-ingress-ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
Write-Message "Adresse IP de l'ingress controller: $ingressIP" -color $colorSuccess

# Afficher les instructions pour configurer le DNS
Write-Message "Pour configurer le DNS, vous pouvez:" -color $colorInfo
Write-Message "1. Ajouter une entrée dans votre fichier hosts:" -color $colorInfo
Write-Message "   $ingressIP rh-system.example.com" -color $colorInfo
Write-Message "2. Configurer un enregistrement DNS A pour rh-system.example.com pointant vers $ingressIP" -color $colorInfo

# Afficher les instructions pour déployer l'application
Write-Message "Pour déployer l'application, exécutez:" -color $colorInfo
Write-Message "./deploy-kubernetes.ps1 -namespace rh-system" -color $colorInfo

# Afficher les instructions pour surveiller le cluster
Write-Message "Pour surveiller le cluster, vous pouvez:" -color $colorInfo
Write-Message "1. Utiliser le portail Azure" -color $colorInfo
Write-Message "2. Exécuter 'az aks browse --resource-group $resourceGroup --name $clusterName' pour ouvrir le tableau de bord Kubernetes" -color $colorInfo
