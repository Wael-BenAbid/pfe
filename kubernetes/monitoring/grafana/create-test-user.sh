#!/bin/bash

# Script pour créer un utilisateur de test dans Grafana

echo "🔧 Création d'un utilisateur de test dans Grafana..."

# Attendre que Grafana soit prêt
echo "⏳ Attente que Grafana soit prêt..."
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=60s

# Port-forward pour accéder à Grafana
echo "🔗 Création du port-forward vers Grafana..."
kubectl port-forward -n monitoring svc/grafana 3000:3000 &
PF_PID=$!

# Attendre que le port-forward soit établi
sleep 5

# Créer un utilisateur de test
echo "👤 Création de l'utilisateur de test..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "waelbenabid@example.com",
    "login": "testuser",
    "password": "testpass123",
    "role": "Viewer"
  }' \
  http://admin:admin@localhost:3000/api/admin/users

echo ""
echo "📧 Utilisateur créé avec l'email: waelbenabid@example.com"
echo "🔑 Login: testuser"
echo "🔒 Password: testpass123"

# Tester l'envoi d'email de réinitialisation
echo "📨 Test d'envoi d'email de réinitialisation..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "loginOrEmail": "waelbenabid@example.com"
  }' \
  http://localhost:3000/api/user/password/send-reset-email

echo ""
echo "✅ Email de réinitialisation envoyé !"

# Nettoyer le port-forward
kill $PF_PID

echo ""
echo "📝 Instructions:"
echo "1. Vérifiez votre boîte email: waelbenabid@example.com"
echo "2. Vous devriez recevoir un email de réinitialisation de mot de passe"
echo "3. L'email vient de: noreply@rh-system.local"
echo "4. Expéditeur: RH System - Grafana"
