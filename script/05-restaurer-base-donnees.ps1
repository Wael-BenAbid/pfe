#!/usr/bin/env pwsh

# Script de restauration pour l'application RH System
# Auteur: Wael Ben Abid
# Date: 05/05/2025

param(
    [Parameter(Mandatory=$true)]
    [string]$backupFile
)

# Vérifier que le fichier de sauvegarde existe
if (-not (Test-Path -Path $backupFile)) {
    Write-Host "Le fichier de sauvegarde '$backupFile' n'existe pas." -ForegroundColor Red
    exit 1
}

# Demander confirmation
Write-Host "Vous êtes sur le point de restaurer la base de données à partir de : $backupFile" -ForegroundColor Yellow
Write-Host "ATTENTION : Cette opération écrasera toutes les données existantes !" -ForegroundColor Red
$confirmation = Read-Host "Êtes-vous sûr de vouloir continuer ? (O/N)"

if ($confirmation -ne "O") {
    Write-Host "Opération annulée." -ForegroundColor Yellow
    exit 0
}

# Restaurer la base de données
Write-Host "Restauration de la base de données en cours..." -ForegroundColor Yellow
try {
    # Arrêter les conteneurs pour éviter les conflits
    Write-Host "Arrêt des conteneurs..." -ForegroundColor Yellow
    docker compose down
    
    # Restaurer la base de données
    # Assurez-vous que psql est dans votre PATH ou spécifiez le chemin complet
    psql -h localhost -p 5433 -U postgres -d postgres -c "DROP DATABASE IF EXISTS rh_v2;"
    psql -h localhost -p 5433 -U postgres -d postgres -c "CREATE DATABASE rh_v2;"
    psql -h localhost -p 5433 -U postgres -d rh_v2 -f $backupFile
    
    Write-Host "Restauration terminée avec succès." -ForegroundColor Green
    
    # Redémarrer les conteneurs
    Write-Host "Redémarrage des conteneurs..." -ForegroundColor Yellow
    docker compose up -d
    
    Write-Host "L'application a été redémarrée avec la base de données restaurée." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de la restauration : $_" -ForegroundColor Red
}
