#!/usr/bin/env pwsh

# Script pour corriger Minikube
# Auteur: Wael Ben Abid
# Date: 05/05/2025

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

# Vérifier si Minikube est installé
try {
    $minikubeVersion = minikube version
    Write-Message "Minikube est installé: $minikubeVersion" -color $colorInfo
} catch {
    Write-Message "Minikube n'est pas installé ou n'est pas dans le PATH. Veuillez l'installer et réessayer." -color $colorError
    Write-Message "Vous pouvez l'installer à partir de https://minikube.sigs.k8s.io/docs/start/" -color $colorInfo
    exit 1
}

# Arrêter Minikube
Write-Message "Arrêt de Minikube..." -color $colorInfo
minikube stop

# Supprimer le cluster Minikube
Write-Message "Suppression du cluster Minikube..." -color $colorInfo
minikube delete

# Démarrer Minikube avec le pilote Docker
Write-Message "Démarrage de Minikube avec le pilote Docker..." -color $colorInfo
minikube start --driver=docker

# Vérifier l'état de Minikube
Write-Message "Vérification de l'état de Minikube..." -color $colorInfo
minikube status

# Activer les addons nécessaires
Write-Message "Activation des addons nécessaires..." -color $colorInfo
minikube addons enable ingress
minikube addons enable ingress-dns
minikube addons enable metrics-server

# Vérifier les addons activés
Write-Message "Addons activés:" -color $colorInfo
minikube addons list

# Obtenir l'adresse IP de Minikube
$minikubeIP = minikube ip
Write-Message "Adresse IP de Minikube: $minikubeIP" -color $colorSuccess

# Mettre à jour le fichier hosts
Write-Message "Pour mettre à jour le fichier hosts, exécutez les commandes suivantes en tant qu'administrateur:" -color $colorInfo
Write-Message "1. Ouvrez le Bloc-notes en tant qu'administrateur" -color $colorInfo
Write-Message "2. Ouvrez le fichier C:\Windows\System32\drivers\etc\hosts" -color $colorInfo
Write-Message "3. Ajoutez la ligne suivante à la fin du fichier:" -color $colorInfo
Write-Message "   $minikubeIP rh-system.local" -color $colorInfo
Write-Message "4. Enregistrez le fichier" -color $colorInfo

# Créer le namespace rh-system
Write-Message "Création du namespace rh-system..." -color $colorInfo
kubectl create namespace rh-system

# Déployer l'application
Write-Message "Pour déployer l'application, exécutez:" -color $colorInfo
Write-Message "./deploy-kubernetes.ps1" -color $colorInfo

# Démarrer le tunnel Minikube
Write-Message "Pour accéder à l'application, démarrez le tunnel Minikube:" -color $colorInfo
Write-Message "minikube tunnel" -color $colorInfo
Write-Message "Ensuite, accédez à http://rh-system.local/ dans votre navigateur." -color $colorInfo
