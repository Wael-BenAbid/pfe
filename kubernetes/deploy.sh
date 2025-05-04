#!/bin/bash

# Script de déploiement pour Kubernetes
set -e

# Vérifier si kubectl est installé
if ! command -v kubectl &> /dev/null; then
    echo "kubectl n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier la connexion au cluster
echo "Vérification de la connexion au cluster Kubernetes..."
kubectl cluster-info

# Créer le namespace
echo "Création du namespace rh-system..."
kubectl apply -f namespaces.yaml

# Demander confirmation pour continuer
read -p "Voulez-vous continuer avec le déploiement? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Déploiement annulé."
    exit 0
fi

# Créer les ConfigMaps
echo "Création des ConfigMaps..."
kubectl apply -f configmaps/

# Vérifier si les secrets existent déjà
if kubectl get secret rh-backend-secrets -n rh-system &> /dev/null; then
    echo "Les secrets backend existent déjà."
else
    echo "Les secrets backend n'existent pas. Veuillez les créer manuellement."
    echo "Exemple: kubectl create secret generic rh-backend-secrets --namespace=rh-system --from-literal=SECRET_KEY='your-key' ..."
    exit 1
fi

if kubectl get secret postgres-secrets -n rh-system &> /dev/null; then
    echo "Les secrets postgres existent déjà."
else
    echo "Les secrets postgres n'existent pas. Veuillez les créer manuellement."
    echo "Exemple: kubectl create secret generic postgres-secrets --namespace=rh-system --from-literal=POSTGRES_PASSWORD='your-password'"
    exit 1
fi

# Créer le stockage persistant
echo "Création du stockage persistant..."
kubectl apply -f storage/

# Déployer PostgreSQL
echo "Déploiement de PostgreSQL..."
kubectl apply -f deployments/postgres-deployment.yaml
kubectl apply -f services/postgres-service.yaml

# Attendre que PostgreSQL soit prêt
echo "Attente du démarrage de PostgreSQL..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres-db -n rh-system

# Déployer le backend
echo "Déploiement du backend..."
kubectl apply -f deployments/backend-deployment.yaml
kubectl apply -f services/backend-service.yaml

# Déployer le frontend
echo "Déploiement du frontend..."
kubectl apply -f deployments/frontend-deployment.yaml
kubectl apply -f services/frontend-service.yaml

# Configurer l'auto-scaling
echo "Configuration de l'auto-scaling..."
kubectl apply -f autoscaling/

# Déployer l'ingress
echo "Déploiement de l'ingress..."
kubectl apply -f ingress/

echo "Déploiement terminé avec succès!"
echo "Vérifiez l'état des pods avec: kubectl get pods -n rh-system"
echo "Accédez à l'application via l'ingress: http://rh-system.local (ajustez votre fichier hosts si nécessaire)"
