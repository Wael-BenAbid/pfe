# Script pour démarrer Zipkin localement
Write-Host "🚀 Démarrage de Zipkin en local..." -ForegroundColor Green

# Vérifier si Docker est installé
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier si Docker est en cours d'exécution
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker n'est pas en cours d'exécution" -ForegroundColor Red
    exit 1
}

# Arrêter le conteneur Zipkin existant s'il existe
Write-Host "🔄 Arrêt du conteneur Zipkin existant..." -ForegroundColor Yellow
docker stop zipkin-local 2>$null
docker rm zipkin-local 2>$null

# Démarrer Zipkin
Write-Host "🚀 Démarrage de Zipkin..." -ForegroundColor Green
docker run -d `
    --name zipkin-local `
    -p 9411:9411 `
    -e STORAGE_TYPE=mem `
    -e JAVA_OPTS="-Xms512m -Xmx512m" `
    openzipkin/zipkin:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Zipkin démarré avec succès!" -ForegroundColor Green
    Write-Host "🌐 Interface Zipkin disponible sur: http://localhost:9411" -ForegroundColor Cyan
    Write-Host "📊 API Zipkin disponible sur: http://localhost:9411/api/v2/spans" -ForegroundColor Cyan
    
    # Attendre que Zipkin soit prêt
    Write-Host "⏳ Attente que Zipkin soit prêt..." -ForegroundColor Yellow
    $timeout = 30
    $elapsed = 0
    
    do {
        Start-Sleep -Seconds 2
        $elapsed += 2
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:9411/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Zipkin est prêt!" -ForegroundColor Green
                break
            }
        } catch {
            # Continuer à attendre
        }
        
        if ($elapsed -ge $timeout) {
            Write-Host "⚠️ Timeout atteint, mais Zipkin devrait être disponible bientôt" -ForegroundColor Yellow
            break
        }
    } while ($true)
    
} else {
    Write-Host "❌ Erreur lors du démarrage de Zipkin" -ForegroundColor Red
    exit 1
}
