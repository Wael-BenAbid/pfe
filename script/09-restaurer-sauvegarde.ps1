#!/usr/bin/env pwsh

# Script pour restaurer une sauvegarde de la base de données PostgreSQL
# Auteur: Wael Ben Abid
# Date: 06/05/2025

param(
    [Parameter(Mandatory=$false)]
    [string]$namespace = "rh-system",

    [Parameter(Mandatory=$true)]
    [string]$backupFile
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

# Vérifier si le pod de gestion des sauvegardes existe
$backupPod = kubectl get pod postgres-backup-management -n $namespace --ignore-not-found
if (-not $backupPod) {
    Write-Message "Le pod de gestion des sauvegardes n'existe pas. Veuillez d'abord configurer les sauvegardes automatiques." -color $colorError
    Write-Message "Exécutez: .\08-configurer-sauvegardes-automatiques.ps1" -color $colorInfo
    exit 1
}

# Lister les sauvegardes disponibles
Write-Message "Sauvegardes disponibles:" -color $colorInfo
kubectl exec -it postgres-backup-management -n $namespace -- sh -c "ls -la /backup"

# Demander confirmation avant de restaurer
Write-Message "Vous êtes sur le point de restaurer la base de données à partir de la sauvegarde: $backupFile" -color $colorWarning
Write-Message "Cette opération écrasera toutes les données actuelles de la base de données." -color $colorWarning
$confirmation = Read-Host "Êtes-vous sûr de vouloir continuer? (o/n)"
if ($confirmation -ne "o") {
    Write-Message "Restauration annulée." -color $colorInfo
    exit 0
}

# Restaurer la sauvegarde
Write-Message "Restauration de la base de données à partir de la sauvegarde: $backupFile..." -color $colorInfo
kubectl exec -it postgres-backup-management -n $namespace -- sh -c "/scripts/restore.sh $backupFile"

# Vérifier si la restauration a réussi
if ($LASTEXITCODE -eq 0) {
    Write-Message "La base de données a été restaurée avec succès!" -color $colorSuccess
} else {
    Write-Message "Échec de la restauration de la base de données." -color $colorError
    exit 1
}

# Redémarrer le backend pour s'assurer qu'il utilise la base de données restaurée
Write-Message "Redémarrage du backend..." -color $colorInfo
kubectl rollout restart deployment/rh-backend -n $namespace
kubectl rollout status deployment/rh-backend -n $namespace --timeout=300s

Write-Message "Restauration terminée avec succès!" -color $colorSuccess
