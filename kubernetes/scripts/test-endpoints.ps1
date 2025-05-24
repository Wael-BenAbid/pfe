# Script PowerShell pour tester les endpoints
Write-Host "🧪 Test des endpoints de monitoring..." -ForegroundColor Cyan

# URLs à tester
$urls = @(
    "https://rh-system.local",
    "https://rh-system.local/admine", 
    "https://zipkin.rh-system.local",
    "https://prometheus.rh-system.local",
    "https://grafana.rh-system.local"
)

# Fonction pour tester une URL
function Test-Endpoint {
    param($url)
    
    try {
        Write-Host "Testing: $url" -ForegroundColor Yellow
        
        # Ignorer les erreurs de certificat SSL
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ OK (Status: $($response.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Tester chaque URL
foreach ($url in $urls) {
    Test-Endpoint $url
    Start-Sleep -Seconds 1
}

Write-Host "`n📊 Résumé des URLs disponibles:" -ForegroundColor Cyan
Write-Host "🌐 Application principale: https://rh-system.local" -ForegroundColor White
Write-Host "👨‍💼 Interface admin: https://rh-system.local/admine" -ForegroundColor White
Write-Host "🔍 Zipkin (Tracing): https://zipkin.rh-system.local" -ForegroundColor White
Write-Host "📈 Prometheus (Métriques): https://prometheus.rh-system.local" -ForegroundColor White
Write-Host "📊 Grafana (Dashboards): https://grafana.rh-system.local" -ForegroundColor White

Write-Host "`n⚠️  Note: Acceptez les exceptions de certificat dans votre navigateur" -ForegroundColor Yellow
