#!/usr/bin/env pwsh

# Script pour préparer l'application pour un appareil non connecté au WiFi (mode hors ligne)
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

# Vérifier si Docker est installé
try {
    docker --version | Out-Null
    Write-Message "Docker est installé" -color $colorInfo
} catch {
    Write-Message "Docker n'est pas installé ou n'est pas dans le PATH. Veuillez l'installer et réessayer." -color $colorError
    exit 1
}

# Créer un répertoire pour les fichiers hors ligne
$offlineDir = "offline-app"
if (-not (Test-Path $offlineDir)) {
    Write-Message "Création du répertoire pour les fichiers hors ligne..." -color $colorInfo
    New-Item -ItemType Directory -Path $offlineDir | Out-Null
}

# Exporter les images Docker
Write-Message "Exportation des images Docker..." -color $colorInfo
docker save waelbenabid/rh-frontend:latest -o "$offlineDir/rh-frontend.tar"
docker save waelbenabid/rh-backend:latest -o "$offlineDir/rh-backend.tar"
docker save postgres:15-alpine -o "$offlineDir/postgres.tar"

# Copier les fichiers de configuration
Write-Message "Copie des fichiers de configuration..." -color $colorInfo
Copy-Item -Path "kubernetes" -Destination "$offlineDir/kubernetes" -Recurse
Copy-Item -Path "script" -Destination "$offlineDir/script" -Recurse

# Créer un script d'installation hors ligne
$installScript = @"
#!/usr/bin/env pwsh

# Script d'installation hors ligne pour l'application RH System
# Auteur: Wael Ben Abid
# Date: 06/05/2025

# Définir les couleurs pour les messages
`$colorInfo = "Cyan"
`$colorSuccess = "Green"
`$colorWarning = "Yellow"
`$colorError = "Red"

# Fonction pour afficher des messages
function Write-Message {
    param(
        [Parameter(Mandatory=`$true)]
        [string]`$message,
        
        [Parameter(Mandatory=`$false)]
        [string]`$color = "White"
    )
    
    Write-Host `$message -ForegroundColor `$color
}

# Vérifier si Docker est installé
try {
    docker --version | Out-Null
    Write-Message "Docker est installé" -color `$colorInfo
} catch {
    Write-Message "Docker n'est pas installé ou n'est pas dans le PATH. Veuillez l'installer et réessayer." -color `$colorError
    exit 1
}

# Vérifier si Minikube est installé
try {
    minikube version | Out-Null
    Write-Message "Minikube est installé" -color `$colorInfo
} catch {
    Write-Message "Minikube n'est pas installé ou n'est pas dans le PATH. Veuillez l'installer et réessayer." -color `$colorError
    exit 1
}

# Charger les images Docker
Write-Message "Chargement des images Docker..." -color `$colorInfo
docker load -i rh-frontend.tar
docker load -i rh-backend.tar
docker load -i postgres.tar

# Démarrer Minikube
Write-Message "Démarrage de Minikube..." -color `$colorInfo
minikube start

# Déployer l'application
Write-Message "Déploiement de l'application..." -color `$colorInfo
& .\script\01-deployer-application-sur-minikube.ps1

# Configurer l'application pour être accessible localement
Write-Message "Configuration de l'application pour être accessible localement..." -color `$colorInfo
& .\script\13-configurer-application-pour-kubernetes.ps1

Write-Message "L'application a été installée avec succès en mode hors ligne!" -color `$colorSuccess
Write-Message "Vous pouvez maintenant accéder à l'application via:" -color `$colorInfo
Write-Message "Frontend: http://localhost:5173/" -color `$colorSuccess
Write-Message "Backend API: http://localhost:8000/api/" -color `$colorSuccess
Write-Message "Backend Admin: http://localhost:8000/admin/" -color `$colorSuccess
"@

Set-Content -Path "$offlineDir/installer.ps1" -Value $installScript

# Créer un fichier README
$readmeContent = @"
# Application RH System - Mode Hors Ligne

Ce package contient tout ce dont vous avez besoin pour exécuter l'application RH System en mode hors ligne.

## Prérequis

- Windows 10 ou supérieur
- Docker Desktop
- Minikube
- PowerShell 7 ou supérieur

## Installation

1. Assurez-vous que Docker Desktop est installé et en cours d'exécution
2. Assurez-vous que Minikube est installé
3. Ouvrez PowerShell et naviguez jusqu'à ce répertoire
4. Exécutez le script d'installation:

```powershell
.\installer.ps1
```

## Accès à l'application

Une fois l'installation terminée, vous pouvez accéder à l'application via:

- Frontend: http://localhost:5173/
- Backend API: http://localhost:8000/api/
- Backend Admin: http://localhost:8000/admin/

## Identifiants par défaut

- Email: admin@example.com
- Mot de passe: admin123
"@

Set-Content -Path "$offlineDir/README.md" -Value $readmeContent

# Créer un fichier ZIP
Write-Message "Création du fichier ZIP..." -color $colorInfo
$zipFile = "rh-system-offline.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($offlineDir, $zipFile)

# Nettoyage
Write-Message "Nettoyage..." -color $colorInfo
Remove-Item -Path $offlineDir -Recurse -Force

Write-Message "Préparation terminée!" -color $colorSuccess
Write-Message "Le fichier ZIP '$zipFile' a été créé avec succès." -color $colorSuccess
Write-Message "Vous pouvez maintenant copier ce fichier sur une clé USB et l'installer sur un appareil non connecté au WiFi." -color $colorInfo
Write-Message "Pour installer l'application sur un autre appareil:" -color $colorInfo
Write-Message "1. Copiez le fichier ZIP sur l'appareil" -color $colorInfo
Write-Message "2. Extrayez le contenu du fichier ZIP" -color $colorInfo
Write-Message "3. Ouvrez PowerShell et naviguez jusqu'au répertoire extrait" -color $colorInfo
Write-Message "4. Exécutez le script d'installation: .\installer.ps1" -color $colorInfo
