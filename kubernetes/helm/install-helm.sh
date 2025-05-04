#!/bin/bash

# Script d'installation du chart Helm pour RH System
set -e

# Vérifier si Helm est installé
if ! command -v helm &> /dev/null; then
    echo "Helm n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier si kubectl est installé
if ! command -v kubectl &> /dev/null; then
    echo "kubectl n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier la connexion au cluster
echo "Vérification de la connexion au cluster Kubernetes..."
kubectl cluster-info

# Créer le namespace s'il n'existe pas
if ! kubectl get namespace rh-system &> /dev/null; then
    echo "Création du namespace rh-system..."
    kubectl create namespace rh-system
else
    echo "Le namespace rh-system existe déjà."
fi

# Vérifier si les secrets existent déjà
if ! kubectl get secret rh-backend-secrets -n rh-system &> /dev/null; then
    echo "Les secrets backend n'existent pas. Veuillez les créer manuellement."
    echo "Exemple: kubectl create secret generic rh-backend-secrets --namespace=rh-system --from-literal=SECRET_KEY='your-key' ..."
    exit 1
fi

if ! kubectl get secret postgres-secrets -n rh-system &> /dev/null; then
    echo "Les secrets postgres n'existent pas. Veuillez les créer manuellement."
    echo "Exemple: kubectl create secret generic postgres-secrets --namespace=rh-system --from-literal=POSTGRES_PASSWORD='your-password'"
    exit 1
fi

# Installer ou mettre à jour le chart Helm
if helm list -n rh-system | grep -q "rh-system"; then
    echo "Le chart Helm est déjà installé. Mise à jour..."
    helm upgrade rh-system ./rh-system -n rh-system
else
    echo "Installation du chart Helm..."
    helm install rh-system ./rh-system -n rh-system
fi

echo "Déploiement terminé avec succès!"
echo "Vérifiez l'état des pods avec: kubectl get pods -n rh-system"
echo "Accédez à l'application via l'ingress configuré dans values.yaml"
