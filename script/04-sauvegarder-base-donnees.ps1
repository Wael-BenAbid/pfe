#!/usr/bin/env pwsh

# Script de sauvegarde pour l'application RH System
# Auteur: Wael Ben Abid
# Date: 05/05/2025

# Définir les variables
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = ".\backups"
$backupFile = "$backupDir\rh_v2_$timestamp.sql"

# Créer le répertoire de sauvegarde s'il n'existe pas
if (-not (Test-Path -Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Répertoire de sauvegarde créé : $backupDir" -ForegroundColor Green
}

# Sauvegarder la base de données
Write-Host "Sauvegarde de la base de données en cours..." -ForegroundColor Yellow
try {
    # Utiliser pg_dump pour sauvegarder la base de données
    # Assurez-vous que pg_dump est dans votre PATH ou spécifiez le chemin complet
    pg_dump -h localhost -p 5433 -U postgres -d rh_v2 -f $backupFile
    
    if (Test-Path -Path $backupFile) {
        Write-Host "Sauvegarde réussie : $backupFile" -ForegroundColor Green
    } else {
        Write-Host "Échec de la sauvegarde : le fichier n'a pas été créé." -ForegroundColor Red
    }
} catch {
    Write-Host "Erreur lors de la sauvegarde : $_" -ForegroundColor Red
}

# Afficher la liste des sauvegardes
Write-Host "Liste des sauvegardes disponibles :" -ForegroundColor Cyan
Get-ChildItem -Path $backupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Format-Table Name, LastWriteTime, Length
