#!/bin/bash

# Script principal pour corriger la configuration de monitoring

echo "Correction de la configuration de monitoring..."

# 1. Appliquer les configurations Prometheus
echo "Application des configurations Prometheus..."
./kubernetes/monitoring/apply-prometheus-configs.sh

# 2. Vérifier et configurer la source de données Prometheus dans Grafana
echo "Vérification et configuration de la source de données Prometheus dans Grafana..."
./kubernetes/monitoring/grafana/check-prometheus-datasource.sh

# 3. Appliquer le tableau de bord simple
echo "Application du tableau de bord simple..."
./kubernetes/monitoring/grafana/apply-simple-dashboard.sh

# 4. Appliquer le tableau de bord complet
echo "Application du tableau de bord complet..."
./kubernetes/monitoring/grafana/fix-grafana-dashboard.sh

echo "La configuration de monitoring a été corrigée."
echo "Vous pouvez accéder à Grafana via l'interface à l'adresse http://grafana.rh-system.local ou http://grafana-ingress.local"
echo "Vous pouvez accéder à Prometheus via l'interface à l'adresse http://prometheus.rh-system.local ou http://prometheus-ingress.local"
