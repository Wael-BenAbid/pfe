# Script PowerShell pour tester les traces Zipkin
Write-Host "🔍 Test des traces Zipkin..." -ForegroundColor Cyan

# Fonction pour générer du trafic
function Generate-Traffic {
    Write-Host "📊 Génération de trafic pour créer des traces..." -ForegroundColor Yellow
    
    # URLs à tester
    $urls = @(
        "https://rh-system.local/",
        "https://rh-system.local/admine",
        "https://rh-system.local/users",
        "https://rh-system.local/missions",
        "https://rh-system.local/notifications"
    )
    
    # Ignorer les erreurs de certificat SSL
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    
    foreach ($url in $urls) {
        try {
            Write-Host "  → Testing: $url" -ForegroundColor Gray
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
            Write-Host "    Status: $($response.StatusCode)" -ForegroundColor Green
        }
        catch {
            Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        Start-Sleep -Seconds 1
    }
}

# Fonction pour vérifier les logs du backend
function Check-BackendLogs {
    Write-Host "📋 Vérification des logs du backend..." -ForegroundColor Yellow
    
    try {
        $logs = kubectl logs -n rh-system deployment/rh-backend --tail=20 2>$null
        $zipkinLogs = $logs | Select-String "zipkin"
        
        if ($zipkinLogs.Count -gt 0) {
            Write-Host "✅ Traces Zipkin détectées dans les logs:" -ForegroundColor Green
            $zipkinLogs | ForEach-Object { Write-Host "  $($_.Line)" -ForegroundColor Gray }
        } else {
            Write-Host "❌ Aucune trace Zipkin trouvée dans les logs" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Erreur lors de la lecture des logs: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Fonction pour tester l'API Zipkin
function Test-ZipkinAPI {
    Write-Host "🔍 Test de l'API Zipkin..." -ForegroundColor Yellow
    
    try {
        # Port-forward vers Zipkin
        $zipkinProcess = Start-Process -FilePath "kubectl" -ArgumentList "port-forward -n monitoring svc/zipkin 9411:9411" -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 3
        
        # Tester l'API des services
        $services = Invoke-RestMethod -Uri "http://localhost:9411/api/v2/services" -TimeoutSec 5
        Write-Host "✅ Services détectés par Zipkin: $($services -join ', ')" -ForegroundColor Green
        
        # Tester l'API des traces
        $traces = Invoke-RestMethod -Uri "http://localhost:9411/api/v2/traces?limit=5" -TimeoutSec 5
        Write-Host "✅ Nombre de traces récentes: $($traces.Count)" -ForegroundColor Green
        
        # Arrêter le port-forward
        Stop-Process -Id $zipkinProcess.Id -Force -ErrorAction SilentlyContinue
    }
    catch {
        Write-Host "❌ Erreur lors du test de l'API Zipkin: $($_.Exception.Message)" -ForegroundColor Red
        # Nettoyer le processus en cas d'erreur
        Get-Process -Name "kubectl" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*port-forward*zipkin*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    }
}

# Exécution du script
Write-Host "🚀 Démarrage du test des traces Zipkin" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 1. Générer du trafic
Generate-Traffic

# 2. Attendre un peu pour que les traces soient traitées
Write-Host "⏳ Attente de 5 secondes pour le traitement des traces..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 3. Vérifier les logs
Check-BackendLogs

# 4. Tester l'API Zipkin
Test-ZipkinAPI

# 5. Résumé
Write-Host "`n📊 Résumé:" -ForegroundColor Cyan
Write-Host "🌐 Interface Zipkin: https://zipkin.rh-system.local" -ForegroundColor White
Write-Host "📈 Interface Prometheus: https://prometheus.rh-system.local" -ForegroundColor White
Write-Host "📊 Interface Grafana: https://grafana.rh-system.local" -ForegroundColor White
Write-Host "`n💡 Conseil: Naviguez sur l'application pour générer plus de traces!" -ForegroundColor Yellow
