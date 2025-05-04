#!/bin/bash

# Script d'installation pour la stack ELK
set -e

# Vérifier si kubectl est installé
if ! command -v kubectl &> /dev/null; then
    echo "kubectl n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier la connexion au cluster
echo "Vérification de la connexion au cluster Kubernetes..."
kubectl cluster-info

# Créer le namespace pour la centralisation des logs
echo "Création du namespace logging..."
kubectl apply -f namespace.yaml

# Demander confirmation pour continuer
read -p "Voulez-vous continuer avec l'installation de la stack ELK? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation annulée."
    exit 0
fi

# Vérifier si les secrets existent déjà
if ! kubectl get secret elasticsearch-credentials -n logging &> /dev/null; then
    echo "Le secret elasticsearch-credentials n'existe pas. Création à partir du template..."
    kubectl apply -f elasticsearch/elasticsearch-credentials-secret-template.yaml
else
    echo "Le secret elasticsearch-credentials existe déjà."
fi

# Déployer Elasticsearch
echo "Déploiement d'Elasticsearch..."
kubectl apply -f elasticsearch/

# Attendre que Elasticsearch soit prêt
echo "Attente du démarrage d'Elasticsearch..."
kubectl wait --for=condition=ready pod -l app=elasticsearch -n logging --timeout=300s

# Déployer Logstash
echo "Déploiement de Logstash..."
kubectl apply -f logstash/

# Déployer Kibana
echo "Déploiement de Kibana..."
kubectl apply -f kibana/

# Déployer Filebeat
echo "Déploiement de Filebeat..."
kubectl apply -f filebeat/

# Attendre que tous les pods soient prêts
echo "Attente du démarrage de tous les pods..."
kubectl wait --for=condition=ready pod -l app=logstash -n logging --timeout=300s
kubectl wait --for=condition=ready pod -l app=kibana -n logging --timeout=300s

echo "Installation terminée avec succès!"
echo "Kibana est accessible à l'adresse: http://kibana.rh-system.local"
echo "Veuillez attendre quelques minutes pour que les premiers logs soient collectés et indexés."
