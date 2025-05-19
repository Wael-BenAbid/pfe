#!/bin/bash

# Script d'installation du monitoring pour RH System
# Ce script installe Prometheus pour surveiller les applications RH System

# Créer le namespace monitoring
echo "Création du namespace monitoring..."
kubectl apply -f namespace.yaml

# Installer Prometheus
echo "Installation de Prometheus..."
kubectl apply -f prometheus/prometheus-rbac.yaml
kubectl apply -f prometheus/prometheus-configmap.yaml
kubectl apply -f prometheus/prometheus-pvc.yaml
kubectl apply -f prometheus/prometheus-deployment.yaml
kubectl apply -f prometheus/prometheus-service.yaml
kubectl apply -f prometheus/prometheus-ingress.yaml

# Installer les exporteurs
echo "Installation des exporteurs..."
kubectl apply -f exporters/postgres-exporter-secret-template.yaml
kubectl apply -f exporters/postgres-exporter-deployment.yaml
kubectl apply -f exporters/postgres-exporter-service.yaml

# Installer Grafana
echo "Installation de Grafana..."
kubectl apply -f grafana/grafana-credentials-secret-template.yaml
kubectl apply -f grafana/grafana-pvc.yaml
kubectl apply -f grafana/grafana-datasources-configmap.yaml
kubectl apply -f grafana/grafana-dashboards-provision-configmap.yaml
kubectl apply -f grafana/grafana-dashboards-configmap.yaml
kubectl apply -f grafana/grafana-deployment.yaml
kubectl apply -f grafana/grafana-service.yaml
kubectl apply -f grafana/grafana-ingress.yaml

echo "Installation du monitoring terminée."
echo "Prometheus est accessible à l'adresse: http://prometheus.rh-system.local"
echo "Grafana est accessible à l'adresse: http://grafana.rh-system.local"
echo "  - Utilisateur: admin"
echo "  - Mot de passe: admin123"
echo ""
echo "Pour ajouter des métriques aux applications, exécutez:"
echo "bash add-metrics-to-apps.sh"
