#!/bin/bash

# Script principal pour appliquer toutes les configurations de monitoring

echo "Application des configurations de monitoring..."

# Rendre les scripts exécutables
chmod +x kubernetes/monitoring/apply-prometheus-rules.sh
chmod +x kubernetes/monitoring/apply-grafana-dashboard.sh
chmod +x kubernetes/monitoring/apply-zipkin.sh

# Appliquer les règles Prometheus
./kubernetes/monitoring/apply-prometheus-rules.sh

# Appliquer le tableau de bord Grafana
./kubernetes/monitoring/apply-grafana-dashboard.sh

# Déployer Zipkin
./kubernetes/monitoring/apply-zipkin.sh

# Redémarrer le backend pour appliquer les modifications
kubectl rollout restart deployment rh-backend -n rh-system

# Redémarrer le frontend pour appliquer les modifications
kubectl rollout restart deployment rh-frontend -n rh-system

echo "Toutes les configurations de monitoring ont été appliquées avec succès."
echo "Vous pouvez accéder à Prometheus à l'adresse http://prometheus.rh-system.local"
echo "Vous pouvez accéder à Grafana à l'adresse http://grafana.rh-system.local"
echo "Vous pouvez accéder à Zipkin à l'adresse http://zipkin.rh-system.local"
echo "Identifiants Grafana : admin / admin123"
