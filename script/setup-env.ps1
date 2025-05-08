#!/usr/bin/env pwsh

# Script pour configurer l'environnement de développement
# Auteur: Wael Ben Abid
# Date: 08/05/2025

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

# Vérifier si le fichier .env existe dans le dossier back-end
$backendEnvPath = "back-end/.env"
if (-not (Test-Path $backendEnvPath)) {
    Write-Message "Le fichier $backendEnvPath n'existe pas. Création à partir du modèle..." -color $colorInfo
    Copy-Item "back-end/.env.template" $backendEnvPath
    Write-Message "Fichier $backendEnvPath créé avec succès." -color $colorSuccess
    Write-Message "Veuillez modifier ce fichier avec vos propres valeurs." -color $colorWarning
} else {
    Write-Message "Le fichier $backendEnvPath existe déjà." -color $colorInfo
}

# Vérifier si le fichier .env existe dans le dossier project
$frontendEnvPath = "project/.env"
if (-not (Test-Path $frontendEnvPath)) {
    Write-Message "Le fichier $frontendEnvPath n'existe pas. Création..." -color $colorInfo
    
    # Créer le fichier .env pour le frontend
    @"
VITE_API_BASE_URL=http://localhost:8000/api
"@ | Out-File -FilePath $frontendEnvPath -Encoding utf8
    
    Write-Message "Fichier $frontendEnvPath créé avec succès." -color $colorSuccess
} else {
    Write-Message "Le fichier $frontendEnvPath existe déjà." -color $colorInfo
}

# Configurer Git pour ignorer les modifications des fichiers .env
Write-Message "Configuration de Git pour ignorer les modifications des fichiers .env..." -color $colorInfo
git update-index --assume-unchanged back-end/.env
git update-index --assume-unchanged project/.env

Write-Message "Configuration terminée avec succès!" -color $colorSuccess
Write-Message "Vous pouvez maintenant utiliser 'git add .' sans risquer de commiter vos fichiers .env" -color $colorSuccess
