#!/bin/bash

# Script pour sélectionner les fichiers de déploiement appropriés en fonction de l'environnement

# Définir les couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher l'aide
show_help() {
    echo -e "${YELLOW}Usage: $0 [environment]${NC}"
    echo -e "  environment: L'environnement cible (local, docker, kubernetes)"
    echo -e "  Options:"
    echo -e "    local      - Configuration pour le développement local"
    echo -e "    docker     - Configuration pour Docker Desktop"
    echo -e "    kubernetes - Configuration pour Kubernetes (production)"
    echo -e "  Exemple: $0 kubernetes"
}

# Vérifier si un argument a été fourni
if [ $# -eq 0 ]; then
    echo -e "${RED}Erreur: Aucun environnement spécifié${NC}"
    show_help
    exit 1
fi

# Récupérer l'environnement cible
ENV=$1

# Vérifier si l'environnement est valide
if [[ "$ENV" != "local" && "$ENV" != "docker" && "$ENV" != "kubernetes" ]]; then
    echo -e "${RED}Erreur: Environnement invalide: $ENV${NC}"
    show_help
    exit 1
fi

echo -e "${GREEN}Sélection des fichiers de déploiement pour l'environnement: $ENV${NC}"

# Créer des liens symboliques vers les fichiers de déploiement appropriés
if [ "$ENV" == "local" ]; then
    echo -e "${YELLOW}Configuration pour le développement local...${NC}"
    
    # Utiliser les fichiers de déploiement simples
    ln -sf kubernetes/deployments/simple-backend-deployment.yaml kubernetes/deployments/current-backend-deployment.yaml
    ln -sf kubernetes/deployments/simple-frontend-deployment.yaml kubernetes/deployments/current-frontend-deployment.yaml
    
    # Mettre à jour les variables d'environnement
    echo "VITE_API_BASE_URL=http://localhost:8000" > project/.env
    echo "VITE_ZIPKIN_URL=http://localhost:9411" >> project/.env
    echo "VITE_ZIPKIN_ENABLED=true" >> project/.env
    
    echo -e "${GREEN}Configuration pour le développement local terminée.${NC}"
    
elif [ "$ENV" == "docker" ]; then
    echo -e "${YELLOW}Configuration pour Docker Desktop...${NC}"
    
    # Utiliser les fichiers de déploiement pour Docker Desktop
    ln -sf kubernetes/deployments/backend-deployment-desktop.yaml kubernetes/deployments/current-backend-deployment.yaml
    ln -sf kubernetes/deployments/frontend-deployment-desktop.yaml kubernetes/deployments/current-frontend-deployment.yaml
    
    # Mettre à jour les variables d'environnement
    echo "VITE_API_BASE_URL=http://localhost" > project/.env
    echo "VITE_ZIPKIN_URL=http://localhost:9411" >> project/.env
    echo "VITE_ZIPKIN_ENABLED=true" >> project/.env
    
    echo -e "${GREEN}Configuration pour Docker Desktop terminée.${NC}"
    
elif [ "$ENV" == "kubernetes" ]; then
    echo -e "${YELLOW}Configuration pour Kubernetes (production)...${NC}"
    
    # Utiliser les fichiers de déploiement pour Kubernetes
    ln -sf kubernetes/deployments/backend-deployment.yaml kubernetes/deployments/current-backend-deployment.yaml
    ln -sf kubernetes/deployments/frontend-deployment.yaml kubernetes/deployments/current-frontend-deployment.yaml
    
    # Mettre à jour les variables d'environnement
    echo "VITE_API_BASE_URL=http://rh-system.local" > project/.env
    echo "VITE_ZIPKIN_URL=http://zipkin.rh-system.local" >> project/.env
    echo "VITE_ZIPKIN_ENABLED=true" >> project/.env
    
    echo -e "${GREEN}Configuration pour Kubernetes terminée.${NC}"
fi

echo -e "${GREEN}Mise à jour des scripts de déploiement...${NC}"

# Mettre à jour les scripts de déploiement pour utiliser les fichiers actuels
sed -i 's/backend-deployment.yaml/current-backend-deployment.yaml/g' script/deploy-kubernetes.sh
sed -i 's/frontend-deployment.yaml/current-frontend-deployment.yaml/g' script/deploy-kubernetes.sh

sed -i 's/backend-deployment.yaml/current-backend-deployment.yaml/g' script/deploy-kubernetes.ps1
sed -i 's/frontend-deployment.yaml/current-frontend-deployment.yaml/g' script/deploy-kubernetes.ps1

echo -e "${GREEN}Configuration terminée pour l'environnement: $ENV${NC}"
echo -e "${YELLOW}Utilisez les commandes suivantes pour déployer:${NC}"
echo -e "  - Pour Docker: ${GREEN}docker-compose up -d${NC}"
echo -e "  - Pour Kubernetes: ${GREEN}./script/deploy-kubernetes.sh${NC} ou ${GREEN}./script/deploy-kubernetes.ps1${NC}"
