# Script pour vérifier la connexion à la base de données PostgreSQL locale

# Paramètres de connexion
$PG_HOST = "localhost"
$PG_PORT = "5433"
$PG_USER = "postgres"
$PG_PASSWORD = "12345"
$PG_DATABASE = "rh_v2"

# Définir la variable d'environnement PGPASSWORD
$env:PGPASSWORD = $PG_PASSWORD

# Vérifier si PostgreSQL est en cours d'exécution
Write-Host "Vérification de la connexion à PostgreSQL..."
$result = pg_isready -h $PG_HOST -p $PG_PORT

if ($result -match "accepting connections") {
    Write-Host "PostgreSQL est en cours d'exécution et accepte les connexions." -ForegroundColor Green
} else {
    Write-Host "PostgreSQL n'est pas accessible. Veuillez vérifier que le service est démarré." -ForegroundColor Red
    exit 1
}

# Vérifier si la base de données existe
Write-Host "Vérification de l'existence de la base de données $PG_DATABASE..."
$dbExists = psql -h $PG_HOST -p $PG_PORT -U $PG_USER -lqt | Select-String -Pattern "\s$PG_DATABASE\s"

if ($dbExists) {
    Write-Host "La base de données $PG_DATABASE existe." -ForegroundColor Green
} else {
    Write-Host "La base de données $PG_DATABASE n'existe pas. Création en cours..." -ForegroundColor Yellow
    psql -h $PG_HOST -p $PG_PORT -U $PG_USER -c "CREATE DATABASE $PG_DATABASE;"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "La base de données $PG_DATABASE a été créée avec succès." -ForegroundColor Green
    } else {
        Write-Host "Erreur lors de la création de la base de données $PG_DATABASE." -ForegroundColor Red
        exit 1
    }
}

# Vérifier les tables dans la base de données
Write-Host "Vérification des tables dans la base de données $PG_DATABASE..."
$tables = psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DATABASE -c "\dt" -t

if ($tables) {
    Write-Host "Tables trouvées dans la base de données ${PG_DATABASE}:" -ForegroundColor Green
    psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DATABASE -c "\dt"
} else {
    Write-Host "Aucune table trouvée dans la base de données $PG_DATABASE." -ForegroundColor Yellow
    Write-Host "Les migrations Django créeront les tables nécessaires au démarrage de l'application." -ForegroundColor Yellow
}

Write-Host "Vérification terminée. La base de données est prête à être utilisée par Docker." -ForegroundColor Green
