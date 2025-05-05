#!/usr/bin/env pwsh

# Script de configuration d'un cluster EKS pour l'application RH System
# Auteur: Wael Ben Abid
# Date: 05/05/2025

param(
    [Parameter(Mandatory=$false)]
    [string]$region = "eu-west-1",
    
    [Parameter(Mandatory=$false)]
    [string]$clusterName = "rh-system-eks",
    
    [Parameter(Mandatory=$false)]
    [string]$nodeGroupName = "rh-system-nodes",
    
    [Parameter(Mandatory=$false)]
    [string]$nodeType = "t3.medium",
    
    [Parameter(Mandatory=$false)]
    [int]$nodeCount = 2
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

# Vérifier si AWS CLI est installé
try {
    $awsVersion = aws --version
    Write-Message "AWS CLI est installé: $awsVersion" -color $colorInfo
} catch {
    Write-Message "AWS CLI n'est pas installé ou n'est pas dans le PATH. Veuillez l'installer et réessayer." -color $colorError
    Write-Message "Vous pouvez l'installer à partir de https://aws.amazon.com/cli/" -color $colorInfo
    exit 1
}

# Vérifier si eksctl est installé
try {
    $eksctlVersion = eksctl version
    Write-Message "eksctl est installé: $eksctlVersion" -color $colorInfo
} catch {
    Write-Message "eksctl n'est pas installé ou n'est pas dans le PATH. Veuillez l'installer et réessayer." -color $colorError
    Write-Message "Vous pouvez l'installer à partir de https://eksctl.io/" -color $colorInfo
    exit 1
}

# Configurer AWS CLI
Write-Message "Configuration d'AWS CLI..." -color $colorInfo
aws configure

# Créer un cluster EKS
Write-Message "Création du cluster EKS $clusterName dans la région $region..." -color $colorInfo
eksctl create cluster `
    --name $clusterName `
    --region $region `
    --nodegroup-name $nodeGroupName `
    --node-type $nodeType `
    --nodes $nodeCount `
    --nodes-min 1 `
    --nodes-max 4 `
    --with-oidc `
    --ssh-access `
    --ssh-public-key ~/.ssh/id_rsa.pub `
    --managed

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
    --set controller.service.type=LoadBalancer

# Attendre que l'ingress controller soit prêt
Write-Message "Attente que l'ingress controller soit prêt..." -color $colorInfo
kubectl wait --namespace ingress-nginx `
    --for=condition=ready pod `
    --selector=app.kubernetes.io/component=controller `
    --timeout=300s

# Obtenir l'adresse du load balancer de l'ingress controller
$ingressHostname = kubectl get service -n ingress-nginx nginx-ingress-ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
Write-Message "Adresse du load balancer de l'ingress controller: $ingressHostname" -color $colorSuccess

# Afficher les instructions pour configurer le DNS
Write-Message "Pour configurer le DNS, vous pouvez:" -color $colorInfo
Write-Message "1. Créer un enregistrement CNAME pour rh-system.example.com pointant vers $ingressHostname" -color $colorInfo
Write-Message "2. Ou utiliser Route 53 pour créer un enregistrement A alias pointant vers le load balancer" -color $colorInfo

# Afficher les instructions pour déployer l'application
Write-Message "Pour déployer l'application, exécutez:" -color $colorInfo
Write-Message "./deploy-kubernetes.ps1 -namespace rh-system" -color $colorInfo

# Afficher les instructions pour surveiller le cluster
Write-Message "Pour surveiller le cluster, vous pouvez:" -color $colorInfo
Write-Message "1. Utiliser CloudWatch" -color $colorInfo
Write-Message "2. Déployer Prometheus et Grafana avec:" -color $colorInfo
Write-Message "   kubectl apply -f kubernetes/monitoring/ -n monitoring" -color $colorInfo
