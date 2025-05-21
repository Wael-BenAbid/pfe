#!/bin/bash

# Script pour appliquer les configurations Prometheus

echo "Application des configurations Prometheus..."

# Appliquer les ConfigMaps pour les métriques
kubectl apply -f kubernetes/monitoring/prometheus-metrics-view.yaml
kubectl apply -f kubernetes/monitoring/prometheus-metrics.yaml
kubectl apply -f kubernetes/monitoring/backend-prometheus-fix.yaml
kubectl apply -f kubernetes/monitoring/fix-frontend-metrics.yaml

# Appliquer la configuration Prometheus
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-config.yaml

# Appliquer le déploiement backend avec les volumes pour les métriques
kubectl apply -f kubernetes/deployments/backend-deployment.yaml

# Redémarrer les pods pour appliquer les changements
kubectl rollout restart deployment rh-backend -n rh-system
kubectl rollout restart deployment rh-frontend -n rh-system

# Attendre que les pods soient prêts
echo "Attente du redémarrage des pods..."
kubectl rollout status deployment rh-backend -n rh-system
kubectl rollout status deployment rh-frontend -n rh-system

# Exécuter le job pour configurer les métriques frontend
kubectl delete job fix-frontend-metrics -n rh-system --ignore-not-found
kubectl apply -f kubernetes/monitoring/fix-frontend-metrics.yaml

echo "Configuration Prometheus terminée!"
