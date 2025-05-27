#!/bin/sh

# Script pour injecter les variables d'environnement au runtime
echo "🔧 Injection des variables d'environnement au runtime..."

# Variables d'environnement
TIMESTAMP=$(date +%s)
API_URL="${VITE_API_BASE_URL:-http://localhost:8000}"
ZIPKIN_URL="${VITE_ZIPKIN_URL:-/zipkin}"
ZIPKIN_ENABLED="${VITE_ZIPKIN_ENABLED:-true}"

# Créer le fichier env.js avec une méthode qui fonctionne
cat > /usr/share/nginx/html/env.js << 'ENVEOF'
window.ENV = {
  VITE_API_BASE_URL: "http://backend:8000",
  VITE_ZIPKIN_URL: "/zipkin",
  VITE_ZIPKIN_ENABLED: "true",
  _TIMESTAMP: "TIMESTAMP_PLACEHOLDER"
};
console.log("Variables environnement injectees:", window.ENV);
ENVEOF

# Remplacer le timestamp
sed -i "s/TIMESTAMP_PLACEHOLDER/$TIMESTAMP/g" /usr/share/nginx/html/env.js 2>/dev/null || echo "Timestamp: $TIMESTAMP"

echo "✅ Variables d'environnement injectées:"
echo "   VITE_API_BASE_URL: ${API_URL}"
echo "   VITE_ZIPKIN_URL: ${ZIPKIN_URL}"
echo "   VITE_ZIPKIN_ENABLED: ${ZIPKIN_ENABLED}"
echo "   TIMESTAMP: ${TIMESTAMP}"

# Démarrer Nginx
echo "🚀 Démarrage de Nginx..."
exec nginx -g "daemon off;"
