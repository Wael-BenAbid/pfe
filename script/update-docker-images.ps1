# Script pour mettre à jour les images Docker et les pousser vers Docker Hub
Write-Host "Mise à jour des images Docker et push vers Docker Hub..." -ForegroundColor Green

# Vérifier si Docker est en cours d'exécution
try {
    docker info | Out-Null
    Write-Host "Docker Desktop est en cours d'exécution." -ForegroundColor Green
}
catch {
    Write-Host "Docker Desktop n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop et réessayer." -ForegroundColor Red
    exit 1
}

# Demander les identifiants Docker Hub
$dockerHubUsername = Read-Host -Prompt "Entrez votre nom d'utilisateur Docker Hub (par défaut: waelbenabid)"
if ([string]::IsNullOrEmpty($dockerHubUsername)) {
    $dockerHubUsername = "waelbenabid"
}

$dockerHubPassword = Read-Host -Prompt "Entrez votre mot de passe Docker Hub" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dockerHubPassword)
$dockerHubPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Se connecter à Docker Hub
Write-Host "Connexion à Docker Hub..." -ForegroundColor Yellow
$loginResult = docker login -u $dockerHubUsername --password-stdin
if ($LASTEXITCODE -ne 0) {
    Write-Host "Échec de la connexion à Docker Hub. Veuillez vérifier vos identifiants." -ForegroundColor Red
    exit 1
}
Write-Host "Connexion à Docker Hub réussie." -ForegroundColor Green

# Construire l'image du frontend
Write-Host "Construction de l'image du frontend..." -ForegroundColor Yellow
docker build -t $dockerHubUsername/rh-frontend:latest ./project

# Construire l'image du backend
Write-Host "Construction de l'image du backend..." -ForegroundColor Yellow
docker build -t $dockerHubUsername/rh-system-backend:latest ./back-end

# Pousser les images vers Docker Hub
Write-Host "Push de l'image du frontend vers Docker Hub..." -ForegroundColor Yellow
docker push $dockerHubUsername/rh-frontend:latest

Write-Host "Push de l'image du backend vers Docker Hub..." -ForegroundColor Yellow
docker push $dockerHubUsername/rh-system-backend:latest

Write-Host "Mise à jour des images Docker terminée avec succès!" -ForegroundColor Green
Write-Host "Les images suivantes ont été mises à jour et poussées vers Docker Hub:" -ForegroundColor Cyan
Write-Host "- $dockerHubUsername/rh-frontend:latest" -ForegroundColor Cyan
Write-Host "- $dockerHubUsername/rh-system-backend:latest" -ForegroundColor Cyan
