# Script pour installer les dépendances nécessaires

# Vérifier si Docker est installé
Write-Host "Vérification de l'installation de Docker..." -ForegroundColor Cyan
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if (-not $dockerInstalled) {
    Write-Host "Docker n'est pas installé. Veuillez installer Docker Desktop à partir de https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    exit 1
}

Write-Host "Docker est installé." -ForegroundColor Green

# Vérifier si Docker Compose est installé
Write-Host "Vérification de l'installation de Docker Compose..." -ForegroundColor Cyan
$dockerComposeInstalled = Get-Command docker-compose -ErrorAction SilentlyContinue

if (-not $dockerComposeInstalled) {
    Write-Host "Docker Compose n'est pas installé. Il est généralement inclus avec Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "Docker Compose est installé." -ForegroundColor Green

# Vérifier si PostgreSQL est installé
Write-Host "Vérification de l'installation de PostgreSQL..." -ForegroundColor Cyan
$pgIsReadyInstalled = Get-Command pg_isready -ErrorAction SilentlyContinue

if (-not $pgIsReadyInstalled) {
    Write-Host "PostgreSQL n'est pas installé ou n'est pas dans le PATH. Veuillez installer PostgreSQL à partir de https://www.postgresql.org/download/" -ForegroundColor Red
    exit 1
}

Write-Host "PostgreSQL est installé." -ForegroundColor Green

# Vérifier si psql est installé
Write-Host "Vérification de l'installation de psql..." -ForegroundColor Cyan
$psqlInstalled = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlInstalled) {
    Write-Host "psql n'est pas installé ou n'est pas dans le PATH. Veuillez installer PostgreSQL à partir de https://www.postgresql.org/download/" -ForegroundColor Red
    exit 1
}

Write-Host "psql est installé." -ForegroundColor Green

# Vérifier la connexion à PostgreSQL
Write-Host "Vérification de la connexion à PostgreSQL..." -ForegroundColor Cyan
./check-db.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la vérification de la base de données. Veuillez vérifier que PostgreSQL est en cours d'exécution sur le port 5433." -ForegroundColor Red
    exit 1
}

Write-Host "Toutes les dépendances sont installées et configurées correctement." -ForegroundColor Green
Write-Host "Vous pouvez maintenant démarrer l'application avec ./start-app.ps1" -ForegroundColor Green
