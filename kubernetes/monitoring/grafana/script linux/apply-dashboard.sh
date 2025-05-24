#!/bin/bash

# Script pour appliquer le tableau de bord Grafana

echo "Application du tableau de bord RH System pour Grafana..."

# Appliquer le ConfigMap du tableau de bord
kubectl apply -f kubernetes/monitoring/grafana/rh-system-dashboard-configmap.yaml

# Vérifier que le ConfigMap a été créé
kubectl get configmap -n monitoring rh-system-dashboard

# Redémarrer le pod Grafana pour s'assurer que le tableau de bord est chargé
GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath="{.items[0].metadata.name}")
if [ -n "$GRAFANA_POD" ]; then
  echo "Redémarrage du pod Grafana $GRAFANA_POD..."
  kubectl delete pod -n monitoring $GRAFANA_POD
  
  # Attendre que le pod soit prêt
  echo "Attente du redémarrage du pod Grafana..."
  kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s
else
  echo "Aucun pod Grafana trouvé. Vérifiez que Grafana est déployé."
fi

echo "Le tableau de bord RH System a été appliqué à Grafana."
echo "Vous pouvez y accéder via l'interface Grafana à l'adresse http://grafana.rh-system.local ou http://grafana-ingress.local"
