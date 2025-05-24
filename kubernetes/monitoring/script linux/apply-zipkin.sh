#!/bin/bash

# Script pour déployer Zipkin et l'intégrer avec Prometheus et Grafana

echo "Déploiement de Zipkin..."

# Créer le namespace monitoring s'il n'existe pas
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Appliquer le déploiement Zipkin
kubectl apply -f kubernetes/monitoring/zipkin/zipkin-deployment.yaml

# Appliquer la configuration Prometheus pour Zipkin
kubectl apply -f kubernetes/monitoring/zipkin/zipkin-prometheus-config.yaml

# Mettre à jour la configuration Prometheus
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-config.yaml

# Créer le ConfigMap pour le tableau de bord Grafana
kubectl create configmap zipkin-dashboard --from-file=kubernetes/monitoring/grafana/dashboards/zipkin-dashboard.json -n monitoring --dry-run=client -o yaml | kubectl apply -f -

# Redémarrer Prometheus pour appliquer les modifications
kubectl rollout restart deployment prometheus -n monitoring

# Redémarrer Grafana pour appliquer les modifications
kubectl rollout restart deployment grafana -n monitoring

# Redémarrer le backend pour appliquer les modifications
kubectl rollout restart deployment rh-backend -n rh-system

# Redémarrer le frontend pour appliquer les modifications
kubectl rollout restart deployment rh-frontend -n rh-system

echo "Zipkin a été déployé avec succès."
echo "Vous pouvez accéder à Zipkin à l'adresse http://zipkin.rh-system.local"
echo "Vous pouvez accéder au tableau de bord Zipkin dans Grafana à l'adresse http://grafana.rh-system.local"
