#!/usr/bin/env pwsh

# Script pour migrer les données de la base de données PostgreSQL locale vers Docker
# Auteur: Wael Ben Abid
# Date: 2024

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

# Vérifier si pg_dump est installé
try {
    $pgDumpVersion = & pg_dump --version
    Write-Message "pg_dump est installé: $pgDumpVersion" -color $colorInfo
} catch {
    Write-Message "pg_dump n'est pas installé ou n'est pas dans le PATH. Veuillez installer PostgreSQL et réessayer." -color $colorError
    exit 1
}

# Paramètres de la base de données locale
$localDbName = "rh_v2"
$localDbUser = "postgres"
$localDbPassword = "12345"
$localDbHost = "localhost"
$localDbPort = "5433"

# Nom du fichier de sauvegarde
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "db_backup_$timestamp.sql"

# Créer le répertoire de sauvegarde s'il n'existe pas
$backupDir = "db_backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Message "Répertoire de sauvegarde créé: $backupDir" -color $colorInfo
}

$backupPath = Join-Path $backupDir $backupFile

# Exporter la base de données locale
Write-Message "Exportation de la base de données locale..." -color $colorInfo
$env:PGPASSWORD = $localDbPassword
try {
    & pg_dump -h $localDbHost -p $localDbPort -U $localDbUser -d $localDbName -F p -f $backupPath
    if ($LASTEXITCODE -eq 0) {
        Write-Message "Base de données exportée avec succès vers $backupPath" -color $colorSuccess
    } else {
        Write-Message "Erreur lors de l'exportation de la base de données" -color $colorError
        exit 1
    }
} catch {
    Write-Message "Erreur lors de l'exportation de la base de données: $_" -color $colorError
    exit 1
}

# Vérifier si Docker est en cours d'exécution
try {
    $dockerStatus = docker info
    Write-Message "Docker est en cours d'exécution" -color $colorInfo
} catch {
    Write-Message "Docker n'est pas en cours d'exécution. Veuillez démarrer Docker et réessayer." -color $colorError
    exit 1
}

# Vérifier si le conteneur PostgreSQL est en cours d'exécution
$dbContainer = docker ps --filter "name=pfe-db-1" -q
if (-not $dbContainer) {
    Write-Message "Le conteneur PostgreSQL n'est pas en cours d'exécution. Démarrage des conteneurs..." -color $colorWarning
    docker-compose up -d db
    Start-Sleep -Seconds 10  # Attendre que le conteneur démarre
    $dbContainer = docker ps --filter "name=pfe-db-1" -q
    if (-not $dbContainer) {
        Write-Message "Impossible de démarrer le conteneur PostgreSQL" -color $colorError
        exit 1
    }
}

# Importer la sauvegarde dans la base de données Docker
Write-Message "Importation de la sauvegarde dans la base de données Docker..." -color $colorInfo
try {
    # Copier le fichier de sauvegarde dans le conteneur
    docker cp $backupPath pfe-db-1:/tmp/$backupFile
    
    # Restaurer la base de données
    docker exec pfe-db-1 bash -c "PGPASSWORD=12345 psql -U postgres -d postgres -c 'DROP DATABASE IF EXISTS rh_v2;'"
    docker exec pfe-db-1 bash -c "PGPASSWORD=12345 psql -U postgres -d postgres -c 'CREATE DATABASE rh_v2;'"
    docker exec pfe-db-1 bash -c "PGPASSWORD=12345 psql -U postgres -d rh_v2 -f /tmp/$backupFile"
    
    Write-Message "Base de données importée avec succès dans Docker" -color $colorSuccess
} catch {
    Write-Message "Erreur lors de l'importation de la base de données dans Docker: $_" -color $colorError
    exit 1
}

# Redémarrer le backend pour utiliser la nouvelle base de données
Write-Message "Redémarrage du backend..." -color $colorInfo
docker-compose restart backend

Write-Message "Migration terminée avec succès!" -color $colorSuccess
Write-Message "Votre application utilise maintenant la base de données Docker." -color $colorSuccess
