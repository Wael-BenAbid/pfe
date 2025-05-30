#!/bin/sh

# Script pour injecter les variables d'environnement au runtime
echo "🔧 Injection des variables d'environnement au runtime..."

# Variables d'environnement
TIMESTAMP=$(date +%s)
API_URL="${VITE_API_BASE_URL:-http://localhost:8000}"
ZIPKIN_URL="${VITE_ZIPKIN_URL:-/zipkin}"
ZIPKIN_ENABLED="${VITE_ZIPKIN_ENABLED:-true}"

# Créer le fichier env.js avec une méthode qui fonctionne
cat > /usr/share/nginx/html/env.js << EOF
window.ENV = {
  VITE_API_BASE_URL: "${API_URL}",
  VITE_ZIPKIN_URL: "${ZIPKIN_URL}",
  VITE_ZIPKIN_ENABLED: "${ZIPKIN_ENABLED}",
  _TIMESTAMP: "${TIMESTAMP}"
};
console.log("Variables environnement injectees:", window.ENV);
EOF

echo "✅ Variables d'environnement injectées:"
echo "   VITE_API_BASE_URL: ${API_URL}"
echo "   VITE_ZIPKIN_URL: ${ZIPKIN_URL}"
echo "   VITE_ZIPKIN_ENABLED: ${ZIPKIN_ENABLED}"
echo "   TIMESTAMP: ${TIMESTAMP}"

# Démarrer Nginx
echo "🚀 Démarrage de Nginx..."
exec nginx -g "daemon off;"
