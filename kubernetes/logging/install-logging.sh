#!/bin/bash

# Script d'installation du logging pour RH System
# Ce script installe Elasticsearch, Kibana et Filebeat pour collecter et visualiser les logs

# Créer le namespace logging
echo "Création du namespace logging..."
kubectl apply -f namespace.yaml

# Installer Elasticsearch
echo "Installation d'Elasticsearch..."
kubectl apply -f elasticsearch/elasticsearch-credentials-secret-template.yaml
kubectl apply -f elasticsearch/elasticsearch-statefulset.yaml
kubectl apply -f elasticsearch/elasticsearch-service.yaml

# Attendre que Elasticsearch soit prêt
echo "Attente du démarrage d'Elasticsearch..."
kubectl wait --for=condition=ready pod -l app=elasticsearch -n logging --timeout=300s

# Installer Kibana
echo "Installation de Kibana..."
kubectl apply -f kibana/kibana-deployment.yaml
kubectl apply -f kibana/kibana-service.yaml
kubectl apply -f kibana/kibana-ingress.yaml

# Installer Filebeat
echo "Installation de Filebeat..."
kubectl apply -f filebeat/filebeat-rbac.yaml
kubectl apply -f filebeat/filebeat-configmap.yaml
kubectl apply -f filebeat/filebeat-daemonset.yaml

echo "Installation du logging terminée."
echo "Kibana est accessible à l'adresse: http://kibana.rh-system.local"
echo "  - Utilisateur: elastic"
echo "  - Mot de passe: elastic123"
