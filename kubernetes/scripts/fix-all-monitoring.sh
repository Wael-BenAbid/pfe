#!/bin/bash

echo "🚀 Correction complète des problèmes de monitoring"
echo "=================================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}[STEP]${NC} $1"
    echo "----------------------------------------"
}

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

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "kubernetes" ]; then
    print_error "Ce script doit être exécuté depuis la racine du projet (où se trouve le dossier kubernetes)"
    exit 1
fi

# Rendre les scripts exécutables
chmod +x kubernetes/scripts/*.sh

print_header "1. CORRECTION DES PROBLÈMES GÉNÉRAUX DE MONITORING"
bash kubernetes/scripts/fix-monitoring-issues.sh

echo ""
print_header "2. CORRECTION DES ERREURS PROMETHEUS"
bash kubernetes/scripts/fix-prometheus-errors.sh

echo ""
print_header "3. CORRECTION DU TRACING ZIPKIN"
bash kubernetes/scripts/fix-zipkin-tracing.sh

echo ""
print_header "4. VÉRIFICATION FINALE"

# Vérifier l'état des pods
print_status "État des pods dans rh-system:"
kubectl get pods -n rh-system

print_status "État des pods dans monitoring:"
kubectl get pods -n monitoring

# Vérifier les services
print_status "Services dans rh-system:"
kubectl get svc -n rh-system

print_status "Services dans monitoring:"
kubectl get svc -n monitoring

# Vérifier les ingress
print_status "Ingress configurés:"
kubectl get ingress -n rh-system

echo ""
print_header "5. RÉSUMÉ DES URLS DISPONIBLES"
echo "🌐 Application principale:"
echo "  └─ https://rh-system.local (Interface utilisateur)"
echo "  └─ https://rh-system.local/admine (Interface admin)"
echo ""
echo "📊 Monitoring:"
echo "  └─ https://zipkin.rh-system.local (Tracing)"
echo "  └─ https://prometheus.rh-system.local (Métriques)"
echo "  └─ https://grafana.rh-system.local (Dashboards)"
echo ""

print_header "6. INSTRUCTIONS POST-INSTALLATION"
echo "1. 🔒 Certificat HTTPS:"
echo "   - Le certificat est auto-signé"
echo "   - Acceptez l'exception de sécurité dans votre navigateur"
echo ""
echo "2. 🔍 Zipkin Tracing:"
echo "   - Générez du trafic en naviguant sur l'application"
echo "   - Les traces apparaîtront dans Zipkin après quelques secondes"
echo "   - Utilisez le script: /tmp/generate-traces.sh"
echo ""
echo "3. 📈 Prometheus:"
echo "   - Vérifiez Status > Targets pour voir l'état des endpoints"
echo "   - Les métriques peuvent prendre 1-2 minutes à apparaître"
echo ""
echo "4. 📊 Grafana:"
echo "   - Utilisez admin/admin pour vous connecter"
echo "   - Les dashboards sont pré-configurés"
echo ""

print_header "7. DIAGNOSTIC EN CAS DE PROBLÈME"
echo "🔧 Commandes de diagnostic:"
echo "  kubectl logs -n rh-system deployment/rh-backend --tail=50"
echo "  kubectl logs -n rh-system deployment/rh-frontend --tail=50"
echo "  kubectl logs -n monitoring deployment/zipkin --tail=50"
echo "  kubectl logs -n monitoring deployment/prometheus --tail=50"
echo ""
echo "🌐 Test de connectivité:"
echo "  kubectl exec -n rh-system deployment/rh-backend -- curl -s http://zipkin.monitoring.svc.cluster.local:9411/health"
echo ""

print_success "🎉 Correction complète terminée!"
print_warning "⚠️  Redémarrez votre navigateur si les certificats posent problème"
print_status "📝 Consultez les logs ci-dessus en cas de problème persistant"
