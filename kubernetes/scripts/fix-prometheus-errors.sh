#!/bin/bash

echo "🔧 Correction des erreurs Prometheus..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Vérifier les endpoints de métriques
print_status "Vérification des endpoints de métriques..."

# Vérifier le backend
print_status "Test de l'endpoint backend /metrics..."
kubectl exec -n rh-system deployment/rh-backend -- curl -s http://localhost:8000/metrics | head -5

# Vérifier le frontend
print_status "Test de l'endpoint frontend /metrics..."
kubectl exec -n rh-system deployment/rh-frontend -- curl -s http://localhost:80/metrics | head -5

# 2. Corriger la configuration Prometheus
print_status "Correction de la configuration Prometheus..."

# Créer une nouvelle configuration Prometheus corrigée
cat > /tmp/prometheus-config-fixed.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'rh-system-monitor'

# Scrape configurations
scrape_configs:
  # Scrape Prometheus itself
  - job_name: 'prometheus'
    static_configs:
    - targets: ['localhost:9090']

  # Scrape Backend metrics avec endpoint correct
  - job_name: 'rh-backend'
    static_configs:
    - targets: ['rh-backend.rh-system.svc.cluster.local:8000']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s

  # Scrape Frontend metrics avec endpoint correct  
  - job_name: 'rh-frontend'
    static_configs:
    - targets: ['rh-frontend.rh-system.svc.cluster.local:80']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s

  # Scrape PostgreSQL exporter
  - job_name: 'postgres-exporter'
    static_configs:
    - targets: ['postgres-exporter.monitoring.svc.cluster.local:9187']
    metrics_path: '/metrics'
    scrape_interval: 15s

  # Scrape Zipkin metrics
  - job_name: 'zipkin'
    static_configs:
    - targets: ['zipkin.monitoring.svc.cluster.local:9411']
    metrics_path: '/prometheus'
    scrape_interval: 15s
EOF

# 3. Mettre à jour la ConfigMap Prometheus
print_status "Mise à jour de la ConfigMap Prometheus..."
kubectl create configmap prometheus-config --from-file=prometheus.yml=/tmp/prometheus-config-fixed.yml -n monitoring --dry-run=client -o yaml | kubectl apply -f -

# 4. Redémarrer Prometheus
print_status "Redémarrage de Prometheus..."
kubectl rollout restart deployment/prometheus -n monitoring

# 5. Attendre que Prometheus soit prêt
print_status "Attente que Prometheus soit prêt..."
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s

# 6. Vérifier les targets Prometheus
print_status "Vérification des targets Prometheus..."
sleep 30
kubectl port-forward -n monitoring svc/prometheus 9090:9090 &
PF_PID=$!
sleep 5

# Test des targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastError: .lastError}' 2>/dev/null || echo "jq non disponible, utilisez l'interface web"

# Arrêter le port-forward
kill $PF_PID 2>/dev/null

# 7. Nettoyer le fichier temporaire
rm -f /tmp/prometheus-config-fixed.yml

print_success "Correction des erreurs Prometheus terminée!"
print_status "Vérifiez l'interface Prometheus à: https://prometheus.rh-system.local"
print_status "Allez dans Status > Targets pour voir l'état des endpoints"
