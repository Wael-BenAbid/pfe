#!/bin/bash

# Script d'installation pour la stack de monitoring
set -e

# Vérifier si kubectl est installé
if ! command -v kubectl &> /dev/null; then
    echo "kubectl n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier la connexion au cluster
echo "Vérification de la connexion au cluster Kubernetes..."
kubectl cluster-info

# Créer le namespace pour le monitoring
echo "Création du namespace monitoring..."
kubectl apply -f namespace.yaml

# Demander confirmation pour continuer
read -p "Voulez-vous continuer avec l'installation du monitoring? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation annulée."
    exit 0
fi

# Vérifier si les secrets existent déjà
if ! kubectl get secret grafana-credentials -n monitoring &> /dev/null; then
    echo "Le secret grafana-credentials n'existe pas. Création à partir du template..."
    kubectl apply -f grafana/grafana-credentials-secret-template.yaml
else
    echo "Le secret grafana-credentials existe déjà."
fi

if ! kubectl get secret postgres-exporter-secret -n monitoring &> /dev/null; then
    echo "Le secret postgres-exporter-secret n'existe pas. Veuillez le créer manuellement."
    echo "Exemple: kubectl create secret generic postgres-exporter-secret --namespace=monitoring --from-literal=data-source-name='postgresql://postgres:password@postgres-db.rh-system.svc:5432/rh_v2?sslmode=disable'"
    exit 1
else
    echo "Le secret postgres-exporter-secret existe déjà."
fi

# Déployer les exporters
echo "Déploiement des exporters..."
kubectl apply -f exporters/

# Déployer Prometheus
echo "Déploiement de Prometheus..."
kubectl apply -f prometheus/

# Déployer Grafana
echo "Déploiement de Grafana..."
kubectl apply -f grafana/

# Attendre que les pods soient prêts
echo "Attente du démarrage des pods..."
kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n monitoring
kubectl wait --for=condition=available --timeout=300s deployment/grafana -n monitoring
kubectl wait --for=condition=available --timeout=300s deployment/kube-state-metrics -n monitoring
kubectl wait --for=condition=available --timeout=300s deployment/postgres-exporter -n monitoring

echo "Installation terminée avec succès!"
echo "Prometheus est accessible à l'adresse: http://prometheus.rh-system.local"
echo "Grafana est accessible à l'adresse: http://grafana.rh-system.local"
echo "Identifiants Grafana par défaut: admin/admin"
