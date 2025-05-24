#!/bin/bash

echo "🔍 Correction du tracing Zipkin..."

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Vérifier la connectivité Zipkin
print_status "Vérification de la connectivité Zipkin..."

# Test depuis le backend
print_status "Test de connectivité depuis le backend..."
kubectl exec -n rh-system deployment/rh-backend -- curl -s -o /dev/null -w "%{http_code}" http://zipkin.monitoring.svc.cluster.local:9411/health

# Test depuis le frontend
print_status "Test de connectivité depuis le frontend..."
kubectl exec -n rh-system deployment/rh-frontend -- curl -s -o /dev/null -w "%{http_code}" http://zipkin.monitoring.svc.cluster.local:9411/health

# 2. Vérifier les variables d'environnement Zipkin
print_status "Vérification des variables d'environnement Zipkin..."
echo "Backend:"
kubectl exec -n rh-system deployment/rh-backend -- env | grep ZIPKIN
echo "Frontend:"
kubectl exec -n rh-system deployment/rh-frontend -- env | grep ZIPKIN

# 3. Générer du trafic pour créer des traces
print_status "Génération de trafic pour créer des traces..."

# Port-forward pour accéder à l'application
kubectl port-forward -n rh-system svc/rh-frontend 8080:80 &
PF_PID=$!
sleep 5

# Générer quelques requêtes
print_status "Envoi de requêtes de test..."
for i in {1..5}; do
    curl -s -o /dev/null http://localhost:8080/ 
    curl -s -o /dev/null http://localhost:8080/health.txt
    sleep 1
done

# Arrêter le port-forward
kill $PF_PID 2>/dev/null

# 4. Vérifier les logs du backend pour les traces Zipkin
print_status "Vérification des logs du backend pour les traces Zipkin..."
kubectl logs -n rh-system deployment/rh-backend --tail=20 | grep -i zipkin

# 5. Vérifier les logs de Zipkin
print_status "Vérification des logs de Zipkin..."
kubectl logs -n monitoring deployment/zipkin --tail=20

# 6. Tester l'API Zipkin
print_status "Test de l'API Zipkin..."
kubectl port-forward -n monitoring svc/zipkin 9411:9411 &
PF_PID=$!
sleep 5

# Vérifier les services
print_status "Services détectés par Zipkin:"
curl -s http://localhost:9411/api/v2/services | jq '.' 2>/dev/null || curl -s http://localhost:9411/api/v2/services

# Vérifier les traces récentes
print_status "Traces récentes:"
curl -s "http://localhost:9411/api/v2/traces?limit=5" | jq 'length' 2>/dev/null || echo "Vérifiez manuellement l'interface Zipkin"

# Arrêter le port-forward
kill $PF_PID 2>/dev/null

# 7. Créer un script de test pour générer des traces
cat > /tmp/generate-traces.sh << 'EOF'
#!/bin/bash
echo "Génération de traces de test..."

# URLs à tester
URLS=(
    "https://rh-system.local/"
    "https://rh-system.local/admine"
    "https://rh-system.local/users"
    "https://rh-system.local/missions"
)

for url in "${URLS[@]}"; do
    echo "Test de: $url"
    curl -k -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" "$url"
    sleep 2
done

echo "Traces générées! Vérifiez Zipkin dans quelques secondes."
EOF

chmod +x /tmp/generate-traces.sh

print_success "Configuration Zipkin terminée!"
print_status "Pour générer des traces de test, exécutez: /tmp/generate-traces.sh"
print_status "Interface Zipkin disponible à: https://zipkin.rh-system.local"
print_warning "Si aucune trace n'apparaît, vérifiez que ZIPKIN_SAMPLE_RATE=100.0 dans la configuration"

# 8. Afficher les instructions de diagnostic
echo ""
echo "🔍 Diagnostic Zipkin:"
echo "1. Vérifiez l'interface Zipkin: https://zipkin.rh-system.local"
echo "2. Générez du trafic avec: /tmp/generate-traces.sh"
echo "3. Vérifiez les logs: kubectl logs -n rh-system deployment/rh-backend | grep -i zipkin"
echo "4. Vérifiez la configuration: kubectl get configmap rh-backend-config -n rh-system -o yaml"
