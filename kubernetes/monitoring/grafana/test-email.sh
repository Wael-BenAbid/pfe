#!/bin/bash

# Script pour tester l'envoi d'emails Grafana

echo "🔧 Configuration de test pour l'email Grafana..."

# Obtenir le nom du pod Grafana
GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}')

echo "📧 Pod Grafana: $GRAFANA_POD"

# Vérifier la configuration SMTP dans Grafana
echo "🔍 Vérification de la configuration SMTP..."
kubectl exec -it $GRAFANA_POD -n monitoring -- cat /etc/grafana/grafana.ini | grep -A 10 "\[smtp\]"

echo ""
echo "📝 Instructions pour tester l'email:"
echo "1. Connectez-vous à Grafana: https://grafana.rh-system.local"
echo "2. Utilisateur: admin"
echo "3. Mot de passe: admin"
echo "4. Allez dans Configuration > Users"
echo "5. Créez un nouvel utilisateur avec votre email"
echo "6. Cliquez sur 'Forgot Password' pour tester l'envoi d'email"
echo ""
echo "🔧 Variables d'environnement SMTP dans le pod:"
kubectl exec -it $GRAFANA_POD -n monitoring -- env | grep GF_SMTP
