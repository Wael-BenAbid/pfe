#!/bin/bash

# Script de déploiement pour Kubernetes sur Linux
# Auteur: Wael Ben Abid
# Date: 05/05/2025
set -e

# Définir les couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
function print_message() {
    local message=$1
    local color=$2
    echo -e "${color}${message}${NC}"
}

# Vérifier si kubectl est installé
if ! command -v kubectl &> /dev/null; then
    print_message "kubectl n'est pas installé. Veuillez l'installer avant de continuer." "$RED"
    exit 1
fi

# Vérifier la connexion au cluster
print_message "Vérification de la connexion au cluster Kubernetes..." "$CYAN"
kubectl cluster-info

# Créer le namespace
print_message "Création du namespace rh-system..." "$CYAN"
kubectl apply -f namespace/rh-system.yaml

# Demander confirmation pour continuer
read -p "Voulez-vous continuer avec le déploiement? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_message "Déploiement annulé." "$YELLOW"
    exit 0
fi

# Créer les ConfigMaps
print_message "Création des ConfigMaps..." "$CYAN"
kubectl apply -f configmaps/ -n rh-system

# Créer les secrets
print_message "Création des secrets..." "$CYAN"
kubectl create secret generic postgres-secrets \
    --namespace=rh-system \
    --from-literal=POSTGRES_PASSWORD="12345" \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic rh-backend-secrets \
    --namespace=rh-system \
    --from-literal=SECRET_KEY="django-insecure-4!@e#some$%random^&characters" \
    --from-literal=DATABASE_PASSWORD="12345" \
    --from-literal=EMAIL_HOST_USER="waelbenabid1@gmail.com" \
    --from-literal=EMAIL_HOST_PASSWORD="rkoe ufhs iike osmz" \
    --from-literal=SENDGRID_API_KEY="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" \
    --dry-run=client -o yaml | kubectl apply -f -

# Créer le stockage persistant
print_message "Déploiement du stockage..." "$CYAN"
kubectl apply -f storage/ -n rh-system

# Déployer PostgreSQL
print_message "Déploiement de PostgreSQL..." "$CYAN"
kubectl apply -f deployments/postgres-deployment.yaml -n rh-system
kubectl apply -f services/postgres-service.yaml -n rh-system

# Attendre que PostgreSQL soit prêt
print_message "Attente que PostgreSQL soit prêt..." "$CYAN"
kubectl rollout status deployment/postgres-db -n rh-system --timeout=300s

# Déployer le backend
print_message "Déploiement du backend..." "$CYAN"
kubectl apply -f deployments/backend-deployment.yaml -n rh-system
kubectl apply -f services/backend-service.yaml -n rh-system

# Attendre que le backend soit prêt
print_message "Attente que le backend soit prêt..." "$CYAN"
kubectl rollout status deployment/rh-backend -n rh-system --timeout=300s

# Déployer le frontend
print_message "Déploiement du frontend..." "$CYAN"
kubectl apply -f deployments/frontend-deployment.yaml -n rh-system
kubectl apply -f services/frontend-service.yaml -n rh-system

# Attendre que le frontend soit prêt
print_message "Attente que le frontend soit prêt..." "$CYAN"
kubectl rollout status deployment/rh-frontend -n rh-system --timeout=300s

# Déployer l'ingress
print_message "Déploiement de l'ingress..." "$CYAN"
kubectl apply -f ingress/ -n rh-system

# Afficher les ressources déployées
print_message "Ressources déployées:" "$GREEN"
print_message "Pods:" "$CYAN"
kubectl get pods -n rh-system
print_message "Services:" "$CYAN"
kubectl get services -n rh-system
print_message "Ingress:" "$CYAN"
kubectl get ingress -n rh-system

# Afficher les instructions pour accéder à l'application
print_message "L'application est maintenant déployée sur Kubernetes!" "$GREEN"
print_message "Pour accéder à l'application, vous devez:" "$CYAN"
print_message "1. Vérifier que l'entrée suivante est dans votre fichier hosts:" "$CYAN"
print_message "   $(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}') rh-system.local" "$CYAN"
print_message "2. Accéder à l'application via:" "$CYAN"
print_message "   Frontend: http://rh-system.local/" "$CYAN"
print_message "   Backend API: http://rh-system.local/api/" "$CYAN"
print_message "   Backend Admin: http://rh-system.local/admin/" "$CYAN"
