#!/usr/bin/env pwsh

# Script pour configurer les sauvegardes automatiques de la base de données PostgreSQL
# Auteur: Wael Ben Abid
# Date: 06/05/2025

param(
    [Parameter(Mandatory=$false)]
    [string]$namespace = "rh-system",

    [Parameter(Mandatory=$false)]
    [string]$azureStorageKey = "",

    [Parameter(Mandatory=$false)]
    [string]$azureStorageAccount = "rhsystembackup",

    [Parameter(Mandatory=$false)]
    [string]$azureContainer = "postgres-backups"
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

# Créer le volume persistant pour les sauvegardes
Write-Message "Création du volume persistant pour les sauvegardes..." -color $colorInfo
kubectl apply -f kubernetes/backup/backup-pv.yaml
kubectl apply -f kubernetes/backup/backup-pvc.yaml -n $namespace

# Mettre à jour le ConfigMap des scripts de sauvegarde avec les valeurs Azure
Write-Message "Mise à jour du ConfigMap des scripts de sauvegarde..." -color $colorInfo
$backupScriptsConfigMap = Get-Content kubernetes/backup/backup-scripts-configmap.yaml
$backupScriptsConfigMap = $backupScriptsConfigMap -replace 'AZURE_STORAGE_ACCOUNT="rhsystembackup"', "AZURE_STORAGE_ACCOUNT=`"$azureStorageAccount`""
$backupScriptsConfigMap = $backupScriptsConfigMap -replace 'AZURE_CONTAINER="postgres-backups"', "AZURE_CONTAINER=`"$azureContainer`""
Set-Content kubernetes/backup/backup-scripts-configmap.yaml $backupScriptsConfigMap

# Créer le ConfigMap des scripts de sauvegarde
Write-Message "Création du ConfigMap des scripts de sauvegarde..." -color $colorInfo
kubectl apply -f kubernetes/backup/backup-scripts-configmap.yaml -n $namespace

# Créer le Secret pour les informations d'identification Azure
if ($azureStorageKey) {
    Write-Message "Création du Secret pour les informations d'identification Azure..." -color $colorInfo
    kubectl create secret generic postgres-backup-secrets `
        --namespace=$namespace `
        --from-literal=AZURE_STORAGE_KEY="$azureStorageKey" `
        --dry-run=client -o yaml | kubectl apply -f -
} else {
    Write-Message "Aucune clé Azure Storage fournie. Les sauvegardes seront stockées localement uniquement." -color $colorWarning
    kubectl apply -f kubernetes/backup/backup-secrets.yaml -n $namespace
}

# Créer le CronJob pour les sauvegardes automatiques
Write-Message "Création du CronJob pour les sauvegardes automatiques..." -color $colorInfo
kubectl apply -f kubernetes/backup/backup-cronjob.yaml -n $namespace

# Créer le Pod pour la gestion des sauvegardes
Write-Message "Création du Pod pour la gestion des sauvegardes..." -color $colorInfo
kubectl apply -f kubernetes/backup/backup-management-pod.yaml -n $namespace

# Attendre que le Pod soit prêt
Write-Message "Attente que le Pod de gestion des sauvegardes soit prêt..." -color $colorInfo
Start-Sleep -Seconds 10
$podStatus = kubectl get pod postgres-backup-management -n $namespace -o jsonpath="{.status.phase}"
if ($podStatus -ne "Running") {
    Write-Message "Le Pod de gestion des sauvegardes n'est pas encore prêt. Attente supplémentaire..." -color $colorWarning
    Start-Sleep -Seconds 20
    $podStatus = kubectl get pod postgres-backup-management -n $namespace -o jsonpath="{.status.phase}"
    if ($podStatus -ne "Running") {
        Write-Message "Le Pod de gestion des sauvegardes n'est toujours pas prêt, mais nous continuons..." -color $colorWarning
    } else {
        Write-Message "Le Pod de gestion des sauvegardes est maintenant prêt!" -color $colorSuccess
    }
} else {
    Write-Message "Le Pod de gestion des sauvegardes est prêt!" -color $colorSuccess
}

# Exécuter une sauvegarde manuelle
Write-Message "Exécution d'une sauvegarde manuelle..." -color $colorInfo
kubectl apply -f kubernetes/backup/manual-backup-job.yaml -n $namespace

# Attendre que la sauvegarde soit terminée
Write-Message "Attente que la sauvegarde manuelle soit terminée..." -color $colorInfo
Start-Sleep -Seconds 30
$jobStatus = kubectl get job postgres-manual-backup -n $namespace -o jsonpath="{.status.succeeded}"
if ($jobStatus -ne "1") {
    Write-Message "La sauvegarde manuelle n'est pas encore terminée. Attente supplémentaire..." -color $colorWarning
    Start-Sleep -Seconds 30
    $jobStatus = kubectl get job postgres-manual-backup -n $namespace -o jsonpath="{.status.succeeded}"
    if ($jobStatus -ne "1") {
        Write-Message "La sauvegarde manuelle n'est toujours pas terminée, mais nous continuons..." -color $colorWarning
    } else {
        Write-Message "La sauvegarde manuelle est terminée avec succès!" -color $colorSuccess
    }
} else {
    Write-Message "La sauvegarde manuelle est terminée avec succès!" -color $colorSuccess
}

# Afficher les sauvegardes disponibles
Write-Message "Sauvegardes disponibles:" -color $colorInfo
kubectl exec -it postgres-backup-management -n $namespace -- sh -c "ls -la /backup"

# Afficher les instructions pour gérer les sauvegardes
Write-Message "Les sauvegardes automatiques ont été configurées avec succès!" -color $colorSuccess
Write-Message "Une sauvegarde sera exécutée tous les jours à 2h du matin." -color $colorInfo
Write-Message "Pour exécuter une sauvegarde manuelle:" -color $colorInfo
Write-Message "kubectl apply -f kubernetes/backup/manual-backup-job.yaml -n $namespace" -color $colorInfo
Write-Message "Pour lister les sauvegardes disponibles:" -color $colorInfo
Write-Message "kubectl exec -it postgres-backup-management -n $namespace -- sh -c '/scripts/list-backups.sh'" -color $colorInfo
Write-Message "Pour restaurer une sauvegarde:" -color $colorInfo
Write-Message "kubectl exec -it postgres-backup-management -n $namespace -- sh -c '/scripts/restore.sh <nom_du_fichier_de_sauvegarde>'" -color $colorInfo

if ($azureStorageKey) {
    Write-Message "Les sauvegardes sont également téléchargées vers Azure Blob Storage:" -color $colorInfo
    Write-Message "Compte: $azureStorageAccount" -color $colorInfo
    Write-Message "Conteneur: $azureContainer" -color $colorInfo
} else {
    Write-Message "Pour configurer le stockage externe sur Azure Blob Storage, exécutez ce script avec les paramètres suivants:" -color $colorWarning
    Write-Message ".\16-configurer-sauvegardes-automatiques.ps1 -azureStorageKey <votre_clé> -azureStorageAccount <votre_compte> -azureContainer <votre_conteneur>" -color $colorWarning
}
