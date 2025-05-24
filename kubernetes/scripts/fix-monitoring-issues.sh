#!/bin/bash

echo "🔧 Correction des problèmes de monitoring..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Mettre à jour les hosts dans /etc/hosts
print_status "Mise à jour du fichier hosts..."
sudo bash -c 'cat >> /etc/hosts << EOF

# RH System Monitoring
127.0.0.1 zipkin.rh-system.local
127.0.0.1 prometheus.rh-system.local
127.0.0.1 grafana.rh-system.local
EOF'

# 2. Appliquer les services de monitoring
print_status "Application des services de monitoring..."
kubectl apply -f kubernetes/services/monitoring-services.yaml

# 3. Redémarrer les ConfigMaps
print_status "Mise à jour des ConfigMaps..."
kubectl apply -f kubernetes/configmaps/frontend-configmap.yaml
kubectl apply -f kubernetes/configmaps/rh-frontend-config.yaml
kubectl apply -f kubernetes/configmaps/backend-configmap.yaml

# 4. Mettre à jour l'ingress
print_status "Mise à jour de l'ingress..."
kubectl apply -f kubernetes/ingress/ingress.yaml

# 5. Redémarrer les pods pour prendre en compte les nouvelles configurations
print_status "Redémarrage des pods..."
kubectl rollout restart deployment/rh-frontend -n rh-system
kubectl rollout restart deployment/rh-backend -n rh-system
kubectl rollout restart deployment/zipkin -n monitoring
kubectl rollout restart deployment/prometheus -n monitoring

# 6. Attendre que les pods soient prêts
print_status "Attente que les pods soient prêts..."
kubectl wait --for=condition=ready pod -l app=rh-frontend -n rh-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=rh-backend -n rh-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=zipkin -n monitoring --timeout=300s
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s

# 7. Vérifier les services
print_status "Vérification des services..."
kubectl get services -n rh-system
kubectl get services -n monitoring

# 8. Vérifier les ingress
print_status "Vérification des ingress..."
kubectl get ingress -n rh-system

# 9. Tester les endpoints
print_status "Test des endpoints..."
echo "🌐 URLs disponibles:"
echo "  - Application principale: https://rh-system.local"
echo "  - Interface admin: https://rh-system.local/admine"
echo "  - Zipkin: https://zipkin.rh-system.local"
echo "  - Prometheus: https://prometheus.rh-system.local"
echo "  - Grafana: https://grafana.rh-system.local"

print_success "Configuration terminée!"
print_warning "Note: Le certificat HTTPS est auto-signé, acceptez l'exception de sécurité dans votre navigateur."

# 10. Afficher les logs pour diagnostic
print_status "Affichage des logs récents..."
echo "📋 Logs du backend (dernières 10 lignes):"
kubectl logs -l app=rh-backend -n rh-system --tail=10

echo "📋 Logs de Zipkin (dernières 10 lignes):"
kubectl logs -l app=zipkin -n monitoring --tail=10
