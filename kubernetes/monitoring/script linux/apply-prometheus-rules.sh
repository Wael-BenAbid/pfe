#!/bin/bash

# Script pour appliquer les règles Prometheus

echo "Application des règles Prometheus..."

# Créer le répertoire des règles s'il n'existe pas
kubectl exec -n monitoring deploy/prometheus -- mkdir -p /etc/prometheus/rules

# Copier le fichier de règles dans le pod Prometheus
kubectl cp kubernetes/monitoring/prometheus/rules/rh-system-rules.yml monitoring/$(kubectl get pods -n monitoring -l app=prometheus -o jsonpath="{.items[0].metadata.name}"):/etc/prometheus/rules/

# Vérifier que les règles ont été copiées
kubectl exec -n monitoring deploy/prometheus -- ls -la /etc/prometheus/rules/

# Recharger la configuration de Prometheus
kubectl exec -n monitoring deploy/prometheus -- kill -HUP 1

echo "Les règles Prometheus ont été appliquées avec succès."
echo "Vous pouvez vérifier les règles dans l'interface Prometheus à l'adresse http://prometheus.rh-system.local/rules"
