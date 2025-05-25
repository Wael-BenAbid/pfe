# Script de déploiement complet avec HTTPS pour tous les services (Windows PowerShell)
# Usage: .\deploy-all-https.ps1

param(
    [switch]$SkipCertManager = $false
)

Write-Host "🚀 Déploiement complet du système RH avec HTTPS..." -ForegroundColor Green

function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

try {
    # 1. Créer les namespaces
    Write-Info "Création des namespaces..."
    kubectl apply -f kubernetes/namespace/rh-system.yaml
    kubectl apply -f kubernetes/monitoring/namespace.yaml
    kubectl apply -f kubernetes/logging/namespace.yaml

    # 2. Installer cert-manager si nécessaire
    if (-not $SkipCertManager) {
        Write-Info "Installation de cert-manager..."
        $certManagerExists = kubectl get namespace cert-manager 2>$null
        if (-not $certManagerExists) {
            kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
            Write-Info "Attente du démarrage de cert-manager..."
            kubectl wait --for=condition=ready pod -l app=cert-manager -n cert-manager --timeout=300s
        }
    }

    # 3. Créer les issuers de certificats
    Write-Info "Configuration des certificats SSL..."
    kubectl apply -f kubernetes/cert-manager/selfsigned-issuer.yaml

    # 4. Déployer les secrets
    Write-Info "Déploiement des secrets..."
    kubectl apply -f kubernetes/secrets/

    # 5. Déployer les ConfigMaps
    Write-Info "Déploiement des ConfigMaps..."
    kubectl apply -f kubernetes/configmaps/

    # 6. Déployer le stockage
    Write-Info "Déploiement du stockage..."
    kubectl apply -f kubernetes/storage/

    # 7. Déployer PostgreSQL
    Write-Info "Déploiement de PostgreSQL..."
    kubectl apply -f kubernetes/deployments/postgres-deployment.yaml
    kubectl apply -f kubernetes/services/postgres-service.yaml

    # Attendre que PostgreSQL soit prêt
    Write-Info "Attente du démarrage de PostgreSQL..."
    kubectl wait --for=condition=ready pod -l app=postgres-db -n rh-system --timeout=300s

    # 8. Déployer le backend
    Write-Info "Déploiement du backend..."
    kubectl apply -f kubernetes/deployments/backend-deployment.yaml
    kubectl apply -f kubernetes/services/backend-service.yaml

    # 9. Déployer le frontend
    Write-Info "Déploiement du frontend..."
    kubectl apply -f kubernetes/deployments/frontend-deployment.yaml
    kubectl apply -f kubernetes/services/frontend-service.yaml

    # 10. Déployer les services de monitoring
    Write-Info "Déploiement des services de monitoring..."
    kubectl apply -f kubernetes/monitoring/prometheus/
    kubectl apply -f kubernetes/monitoring/grafana/
    kubectl apply -f kubernetes/monitoring/zipkin/
    kubectl apply -f kubernetes/monitoring/postgres-exporter/

    # 11. Déployer les services de logging
    Write-Info "Déploiement des services de logging..."
    kubectl apply -f kubernetes/logging/elasticsearch/
    kubectl apply -f kubernetes/logging/kibana/
    kubectl apply -f kubernetes/logging/filebeat/

    # 12. Déployer les ingress avec HTTPS
    Write-Info "Déploiement des ingress avec HTTPS..."
    kubectl apply -f kubernetes/ingress/

    # 13. Attendre que tous les pods soient prêts
    Write-Info "Attente du démarrage de tous les services..."

    # Attendre les pods principaux
    kubectl wait --for=condition=ready pod -l app=rh-backend -n rh-system --timeout=300s
    kubectl wait --for=condition=ready pod -l app=rh-frontend -n rh-system --timeout=300s

    # Attendre les pods de monitoring (avec gestion d'erreur)
    try { kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s } catch { Write-Warning "Prometheus pas encore prêt" }
    try { kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s } catch { Write-Warning "Grafana pas encore prêt" }
    try { kubectl wait --for=condition=ready pod -l app=zipkin -n monitoring --timeout=300s } catch { Write-Warning "Zipkin pas encore prêt" }

    # Attendre les pods de logging
    try { kubectl wait --for=condition=ready pod -l app=kibana -n logging --timeout=300s } catch { Write-Warning "Kibana pas encore prêt" }

    Write-Success "Déploiement terminé !"

    Write-Host ""
    Write-Host "🌐 URLs d'accès avec HTTPS :" -ForegroundColor Cyan
    Write-Host "  • Application principale: https://rh-system.local" -ForegroundColor White
    Write-Host "  • Grafana (monitoring):   https://grafana.rh-system.local" -ForegroundColor White
    Write-Host "  • Prometheus (métriques): https://prometheus.rh-system.local" -ForegroundColor White
    Write-Host "  • Zipkin (tracing):       https://zipkin.rh-system.local" -ForegroundColor White
    Write-Host "  • Kibana (logs):          https://kibana.rh-system.local" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Ajoutez ces entrées à votre fichier C:\Windows\System32\drivers\etc\hosts :" -ForegroundColor Cyan
    Write-Host "127.0.0.1 rh-system.local" -ForegroundColor Yellow
    Write-Host "127.0.0.1 grafana.rh-system.local" -ForegroundColor Yellow
    Write-Host "127.0.0.1 prometheus.rh-system.local" -ForegroundColor Yellow
    Write-Host "127.0.0.1 zipkin.rh-system.local" -ForegroundColor Yellow
    Write-Host "127.0.0.1 kibana.rh-system.local" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔐 Identifiants par défaut :" -ForegroundColor Cyan
    Write-Host "  • Grafana: admin / admin" -ForegroundColor White
    Write-Host "  • Application: wael / Abidos`$123" -ForegroundColor White

} catch {
    Write-Error "Erreur lors du déploiement: $_"
    exit 1
}
