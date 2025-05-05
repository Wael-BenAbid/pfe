#!/usr/bin/env pwsh

# Script pour migrer les données de la base de données locale vers Kubernetes
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

# Paramètres de la base de données locale
$localDbHost = "localhost"
$localDbPort = "5433"
$localDbName = "rh_v2"
$localDbUser = "postgres"
$localDbPassword = "12345"

# Vérifier si la base de données locale est accessible
Write-Message "Vérification de la connexion à la base de données locale..." -color $colorInfo
$env:PGPASSWORD = $localDbPassword
$localDbStatus = pg_isready -h $localDbHost -p $localDbPort -U $localDbUser
if (-not ($localDbStatus -match "accepting connections")) {
    Write-Message "La base de données locale n'est pas accessible. Veuillez vérifier que PostgreSQL est en cours d'exécution." -color $colorError
    exit 1
}
Write-Message "Base de données locale accessible." -color $colorSuccess

# Créer un dump de la base de données locale
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFile = "db_dump_$timestamp.sql"
Write-Message "Création d'un dump de la base de données locale..." -color $colorInfo
pg_dump -h $localDbHost -p $localDbPort -U $localDbUser -d $localDbName -f $dumpFile

if (-not (Test-Path $dumpFile)) {
    Write-Message "Échec de la création du dump de la base de données." -color $colorError
    exit 1
}
Write-Message "Dump de la base de données créé avec succès: $dumpFile" -color $colorSuccess

# Vérifier si le pod PostgreSQL est en cours d'exécution
Write-Message "Vérification du pod PostgreSQL dans Kubernetes..." -color $colorInfo
$postgresPod = kubectl get pods -n rh-system -l app=postgres-db -o jsonpath="{.items[0].metadata.name}"
if (-not $postgresPod) {
    Write-Message "Aucun pod PostgreSQL trouvé dans Kubernetes. Veuillez vérifier votre déploiement." -color $colorError
    exit 1
}
Write-Message "Pod PostgreSQL trouvé: $postgresPod" -color $colorSuccess

# Copier le fichier de dump dans le pod PostgreSQL
Write-Message "Copie du fichier de dump dans le pod PostgreSQL..." -color $colorInfo
$namespace = "rh-system"
$destination = "/tmp/$dumpFile"
kubectl cp $dumpFile ${namespace}/${postgresPod}:${destination}

# Restaurer le dump dans la base de données Kubernetes
Write-Message "Restauration du dump dans la base de données Kubernetes..." -color $colorInfo
kubectl exec -n rh-system $postgresPod -- bash -c "PGPASSWORD=12345 psql -U postgres -d rh_v2 -f /tmp/$dumpFile"

# Vérifier que la restauration a réussi
Write-Message "Vérification de la restauration..." -color $colorInfo
$tableCount = kubectl exec -n rh-system $postgresPod -- bash -c "PGPASSWORD=12345 psql -U postgres -d rh_v2 -c 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ''public'';' -t"
Write-Message "Nombre de tables dans la base de données Kubernetes: $tableCount" -color $colorInfo

# Supprimer le fichier de dump local
Write-Message "Suppression du fichier de dump local..." -color $colorInfo
Remove-Item $dumpFile

Write-Message "Migration des données terminée avec succès!" -color $colorSuccess
Write-Message "Vous pouvez maintenant utiliser la base de données PostgreSQL dans Kubernetes." -color $colorSuccess
