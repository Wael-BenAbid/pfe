#!/bin/bash

# Script pour appliquer le tableau de bord Grafana

echo "Application du tableau de bord Grafana..."

# Créer le ConfigMap pour le tableau de bord
kubectl create configmap rh-system-dashboard --from-file=kubernetes/monitoring/grafana/dashboards/rh-system-dashboard.json -n monitoring

# Vérifier que le ConfigMap a été créé
kubectl get configmap rh-system-dashboard -n monitoring

# Redémarrer Grafana pour appliquer les modifications
kubectl rollout restart deployment grafana -n monitoring

echo "Le tableau de bord Grafana a été appliqué avec succès."
echo "Vous pouvez accéder au tableau de bord à l'adresse http://grafana.rh-system.local"
echo "Identifiants Grafana : admin / admin123"
