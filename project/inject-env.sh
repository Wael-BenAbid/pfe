#!/bin/sh

# Script pour injecter les variables d'environnement au runtime
# Ce script remplace les placeholders dans index.html avec les vraies valeurs

echo "🔧 Injection des variables d'environnement au runtime..."

# Créer le fichier env.js avec les variables d'environnement
cat > /usr/share/nginx/html/env.js << EOF
window.ENV = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:8000}",
  VITE_ZIPKIN_URL: "${VITE_ZIPKIN_URL:-/zipkin}",
  VITE_ZIPKIN_ENABLED: "${VITE_ZIPKIN_ENABLED:-true}"
};
console.log('🌍 Variables d\'environnement injectées:', window.ENV);
EOF

echo "✅ Variables d'environnement injectées:"
echo "   VITE_API_BASE_URL: ${VITE_API_BASE_URL:-http://localhost:8000}"
echo "   VITE_ZIPKIN_URL: ${VITE_ZIPKIN_URL:-/zipkin}"
echo "   VITE_ZIPKIN_ENABLED: ${VITE_ZIPKIN_ENABLED:-true}"

# Démarrer Nginx
echo "🚀 Démarrage de Nginx..."
exec nginx -g "daemon off;"
