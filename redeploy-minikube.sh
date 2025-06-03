#!/bin/bash

# Script pour redéployer l'application dans Minikube avec les nouvelles images

echo "🚀 Redéploiement de l'application dans Minikube..."

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Vérifier que Minikube est en cours d'exécution
log_info "Vérification de l'état de Minikube..."
if ! minikube status | grep -q "Running"; then
    log_error "Minikube n'est pas en cours d'exécution. Démarrage..."
    minikube start --driver=docker
fi

# 2. Charger les nouvelles images dans Minikube
log_info "Chargement des nouvelles images dans Minikube..."
minikube image load waelbenabid/rh-frontend:latest
minikube image load waelbenabid/rh-system-backend:latest

# 3. Redémarrer les déploiements pour utiliser les nouvelles images
log_info "Redémarrage des déploiements..."
kubectl rollout restart deployment/rh-frontend -n rh-system
kubectl rollout restart deployment/rh-backend -n rh-system

# 4. Attendre que les déploiements soient prêts
log_info "Attente du redémarrage des pods..."
kubectl rollout status deployment/rh-frontend -n rh-system --timeout=300s
kubectl rollout status deployment/rh-backend -n rh-system --timeout=300s

# 5. Vérifier l'état des pods
log_info "Vérification de l'état des pods..."
kubectl get pods -n rh-system

# 6. Afficher les URLs d'accès
log_success "Redéploiement terminé !"
echo ""
echo "🌐 URLs d'accès :"
echo "  • Application principale: http://rh-system.local"
echo "  • Grafana (monitoring):   http://grafana.rh-system.local"
echo "  • Prometheus (métriques): http://prometheus.rh-system.local"
echo "  • Zipkin (tracing):       http://zipkin.rh-system.local"
echo ""
echo "📝 N'oubliez pas de démarrer le tunnel Minikube :"
echo "minikube tunnel"
