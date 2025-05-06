#!/usr/bin/env pwsh

# Script pour installer Helm sur Windows
# Auteur: Wael Ben Abid
# Date: 06/05/2025

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

# Vérifier si Chocolatey est installé
$chocoInstalled = $false
try {
    $chocoVersion = choco --version
    $chocoInstalled = $true
    Write-Message "Chocolatey est déjà installé: $chocoVersion" -color $colorInfo
} catch {
    Write-Message "Chocolatey n'est pas installé. Installation..." -color $colorWarning
}

# Installer Chocolatey si nécessaire
if (-not $chocoInstalled) {
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
        Write-Message "Chocolatey a été installé avec succès!" -color $colorSuccess
    } catch {
        Write-Message "Échec de l'installation de Chocolatey. Erreur: $_" -color $colorError
        Write-Message "Veuillez installer Chocolatey manuellement: https://chocolatey.org/install" -color $colorInfo
        exit 1
    }
}

# Installer Helm avec Chocolatey
Write-Message "Installation de Helm..." -color $colorInfo
try {
    choco install kubernetes-helm -y
    Write-Message "Helm a été installé avec succès!" -color $colorSuccess
} catch {
    Write-Message "Échec de l'installation de Helm. Erreur: $_" -color $colorError
    Write-Message "Veuillez installer Helm manuellement: https://helm.sh/docs/intro/install/" -color $colorInfo
    exit 1
}

# Vérifier l'installation de Helm
try {
    $helmVersion = helm version
    Write-Message "Helm est installé: $helmVersion" -color $colorSuccess
} catch {
    Write-Message "Helm n'a pas été installé correctement." -color $colorError
    exit 1
}

# Ajouter le repo Helm de cert-manager
Write-Message "Ajout du repo Helm de cert-manager..." -color $colorInfo
helm repo add jetstack https://charts.jetstack.io
helm repo update

Write-Message "Helm est maintenant configuré et prêt à être utilisé!" -color $colorSuccess
Write-Message "Vous pouvez maintenant exécuter le script de configuration HTTPS." -color $colorInfo
